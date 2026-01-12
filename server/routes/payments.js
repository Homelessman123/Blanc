import express, { Router } from 'express';
import crypto from 'crypto';
import net from 'node:net';
import { ObjectId } from '../lib/objectId.js';
import { connectToDatabase, getCollection, getDb } from '../lib/db.js';
import { getClientIp } from '../lib/security.js';
import {
    extractOrderCodeFromContent,
    getMembershipPlans,
    setUserMembership,
    computeNewMembershipFromPurchase,
    normalizeMembership,
    normalizeTier,
} from '../lib/membership.js';

const router = Router();

function timingSafeEqual(a, b) {
    const aa = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
}

function parseSepayApiKey(authorizationHeader) {
    const header = String(authorizationHeader || '').trim();
    if (!header) return null;
    const lower = header.toLowerCase();
    if (lower.startsWith('apikey ')) return header.slice(7).trim();
    if (lower.startsWith('bearer ')) return header.slice(7).trim();
    // Some clients may send the raw key without prefix
    return header;
}

function tryParseJson(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return null;
    if (!text.startsWith('{') && !text.startsWith('[')) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function tryParseUrlEncoded(rawText) {
    const text = String(rawText || '').trim();
    if (!text || !text.includes('=')) return null;

    try {
        const params = new URLSearchParams(text);
        const obj = {};
        for (const [key, value] of params.entries()) {
            obj[key] = value;
        }
        return Object.keys(obj).length > 0 ? obj : null;
    } catch {
        return null;
    }
}

function coerceSepayRequestBody(body) {
    if (body && typeof body === 'object') {
        return { parsed: body, rawForStorage: body };
    }

    if (typeof body === 'string') {
        const trimmed = body.trim();
        if (!trimmed) return { parsed: {}, rawForStorage: '' };
        const parsed = tryParseJson(trimmed) || tryParseUrlEncoded(trimmed) || {};
        return { parsed, rawForStorage: trimmed };
    }

    return { parsed: {}, rawForStorage: body ?? null };
}

function unwrapSepayTransaction(body) {
    let cursor = body;

    for (let depth = 0; depth < 5; depth++) {
        if (Array.isArray(cursor)) {
            cursor = cursor[0];
            continue;
        }

        if (!cursor || typeof cursor !== 'object') return {};

        const next =
            cursor.data ??
            cursor.transaction ??
            cursor.tx ??
            cursor.payload ??
            cursor.result ??
            cursor.event ??
            cursor.body;

        if (next && typeof next === 'object') {
            cursor = next;
            continue;
        }

        if (typeof next === 'string') {
            const parsed = tryParseJson(next);
            if (parsed && typeof parsed === 'object') {
                cursor = parsed;
                continue;
            }
        }

        break;
    }

    return cursor && typeof cursor === 'object' ? cursor : {};
}

function normalizeIp(ip) {
    const value = String(ip || '').trim();
    if (!value) return '';
    // Normalize IPv4-mapped IPv6
    if (value.startsWith('::ffff:')) return value.slice(7);
    return value;
}

function ipv4ToInt(ip) {
    const parts = String(ip).split('.').map((p) => Number.parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function ipInIpv4Cidr(ip, cidr) {
    const [cidrIp, prefixRaw] = String(cidr || '').split('/');
    const prefix = Number.parseInt(prefixRaw, 10);
    if (!cidrIp || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    const ipInt = ipv4ToInt(ip);
    const cidrInt = ipv4ToInt(cidrIp);
    if (ipInt === null || cidrInt === null) return false;

    const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
    return (ipInt & mask) === (cidrInt & mask);
}

function isIpAllowed(clientIp, allowlist) {
    const normalized = normalizeIp(clientIp);
    if (!normalized) return false;
    const kind = net.isIP(normalized);
    if (!kind) return false;

    for (const entry of allowlist) {
        const rule = String(entry || '').trim();
        if (!rule) continue;
        if (rule === normalized) return true;
        if (rule.includes('/') && kind === 4) {
            if (ipInIpv4Cidr(normalized, rule)) return true;
        }
    }
    return false;
}

function requireSepayAllowlistedIp(req, res) {
    const rawAllowlist = String(process.env.SEPAY_WEBHOOK_IP_ALLOWLIST || '').trim();
    if (!rawAllowlist) return true; // allowlist disabled

    const allowlist = rawAllowlist
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    if (allowlist.length === 0) return true;

    // Prefer Express' computed IP (respects trust proxy) to reduce header spoofing risk.
    const clientIp = normalizeIp(req.ip || getClientIp(req));
    if (!isIpAllowed(clientIp, allowlist)) {
        res.status(403).json({ error: 'Forbidden' });
        return false;
    }

    return true;
}

function requireSepayAuth(req, res) {
    const configuredKeys = String(process.env.SEPAY_API_KEYS || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    const legacyKey = String(process.env.SEPAY_API_KEY || '').trim();
    if (legacyKey && !configuredKeys.includes(legacyKey)) configuredKeys.push(legacyKey);

    if (configuredKeys.length === 0) {
        res.status(500).json({ error: 'SEPAY_API_KEY is not configured' });
        return false;
    }

    const allowQueryKey = String(process.env.SEPAY_WEBHOOK_ALLOW_QUERY_KEY || 'false').toLowerCase() === 'true';
    const queryProvided = allowQueryKey
        ? parseSepayApiKey(
            req.query.apiKey ??
            req.query.apikey ??
            req.query.api_key ??
            req.query.key ??
            req.query.token ??
            req.query.sepay_api_key
        )
        : null;

    const provided =
        parseSepayApiKey(req.headers.authorization) ||
        parseSepayApiKey(req.headers['x-api-key']) ||
        parseSepayApiKey(req.headers['x-sepay-api-key']) ||
        queryProvided;

    const isAuthorized =
        Boolean(provided) &&
        configuredKeys.some((k) => {
            if (!k) return false;
            if (String(provided).length !== String(k).length) return false;
            return timingSafeEqual(provided, k);
        });

    if (!isAuthorized) {
        res.status(401).json({ error: 'Unauthorized' });
        return false;
    }

    return true;
}

function parseVndAmount(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const text = String(value ?? '').trim();
    if (!text) return 0;

    const sign = text.includes('-') ? -1 : 1;
    const digits = text.replace(/\D/g, '');
    if (!digits) return 0;

    const parsed = Number.parseInt(digits, 10);
    if (Number.isNaN(parsed)) return 0;
    return sign * parsed;
}

function normalizeSepayTransferType(value) {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return null;

    // Accept common inbound/outbound synonyms used by gateways.
    if (['in', 'credit', 'incoming', 'receive', 'received', 'deposit'].includes(raw)) return 'in';
    if (['out', 'debit', 'outgoing', 'send', 'sent', 'withdraw', 'withdrawal'].includes(raw)) return 'out';

    return raw;
}

function normalizeSepayPayload(body) {
    const coerced = coerceSepayRequestBody(body);
    const tx = unwrapSepayTransaction(coerced.parsed);

    const providerTransactionIdCandidate =
        tx.id ??
        tx.transactionId ??
        tx.transaction_id ??
        tx.transId ??
        tx.trans_id ??
        tx.txnId ??
        tx.txn_id ??
        tx.txId ??
        tx.tx_id ??
        tx.providerTransactionId ??
        tx.provider_transaction_id ??
        tx.referenceCode ??
        tx.reference_code ??
        tx.refCode ??
        tx.ref_code;

    let providerTransactionId =
        providerTransactionIdCandidate === undefined || providerTransactionIdCandidate === null
            ? null
            : String(providerTransactionIdCandidate).trim();

    const transferAmount = parseVndAmount(
        tx.transferAmount ??
        tx.transfer_amount ??
        tx.amount ??
        tx.amountVnd ??
        tx.amount_vnd ??
        tx.transferAmountVnd ??
        tx.transfer_amount_vnd
    );

    if (!providerTransactionId) {
        const fingerprintParts = [
            tx.gateway ?? '',
            tx.transactionDate ?? tx.transaction_date ?? tx.transactionTime ?? tx.transaction_time ?? '',
            tx.accountNumber ?? tx.account_number ?? '',
            String(transferAmount || 0),
            tx.referenceCode ?? tx.reference_code ?? tx.refCode ?? tx.ref_code ?? tx.code ?? '',
            tx.content ?? tx.transferContent ?? tx.transfer_content ?? tx.description ?? '',
        ]
            .map((v) => String(v || '').trim())
            .filter(Boolean);

        if (fingerprintParts.length > 0) {
            providerTransactionId = crypto
                .createHash('sha256')
                .update(fingerprintParts.join('|'))
                .digest('hex')
                .slice(0, 32);
        }
    }

    const content =
        tx.content ??
        tx.transferContent ??
        tx.transfer_content ??
        tx.contentText ??
        tx.content_text ??
        tx.description ??
        tx.note ??
        '';

    return {
        providerTransactionId: providerTransactionId || null,
        gateway: tx.gateway ?? tx.bank ?? tx.bankCode ?? tx.bank_code ?? null,
        transactionDate:
            tx.transactionDate ??
            tx.transaction_date ??
            tx.transactionTime ??
            tx.transaction_time ??
            null,
        accountNumber:
            tx.accountNumber ??
            tx.account_number ??
            tx.bankAccountNumber ??
            tx.bank_account_number ??
            tx.account ??
            null,
        code: tx.code ?? null,
        content: String(content || ''),
        transferType: normalizeSepayTransferType(
            tx.transferType ?? tx.transfer_type ?? tx.type ?? tx.transactionType ?? tx.transaction_type ?? tx.direction
        ),
        transferAmount,
        accumulated: tx.accumulated ?? null,
        subAccount: tx.subAccount ?? tx.sub_account ?? null,
        referenceCode: tx.referenceCode ?? tx.reference_code ?? tx.refCode ?? tx.ref_code ?? null,
        description: tx.description ?? tx.note ?? tx.message ?? null,
        raw: coerced.rawForStorage,
    };
}

function normalizeAccountNumber(value) {
    return String(value || '').replace(/\D/g, '');
}

function getSepayWebhookEventDocId(providerTransactionId) {
    return `sepay:webhook:${String(providerTransactionId || '').trim()}`;
}

function getSepayTransactionDocId(providerTransactionId) {
    return `sepay:tx:${String(providerTransactionId || '').trim()}`;
}

async function findPaymentOrderByOrderCode(orderCode) {
    const code = String(orderCode || '').trim();
    if (!code) return null;

    await connectToDatabase();
    const pool = getDb();
    const result = await pool.query(
        `SELECT doc FROM documents
         WHERE collection = $1 AND doc->>'orderCode' = $2
         LIMIT 1`,
        ['payment_orders', code]
    );

    return result.rows[0]?.doc || null;
}

const PAYMENT_AMOUNT_TOLERANCE_VND = Math.max(
    0,
    Number.parseInt(process.env.PAYMENT_AMOUNT_TOLERANCE_VND || '0', 10) || 0
);

const SEPAY_WEBHOOK_BODY_LIMIT = process.env.SEPAY_WEBHOOK_BODY_LIMIT || process.env.JSON_BODY_LIMIT || '10mb';
const sepayWebhookBodyParser = express.text({ type: '*/*', limit: SEPAY_WEBHOOK_BODY_LIMIT });

// POST /api/payments/sepay/webhook
router.post('/sepay/webhook', sepayWebhookBodyParser, async (req, res, next) => {
    try {
        if (!requireSepayAuth(req, res)) return;
        if (!requireSepayAllowlistedIp(req, res)) return;

        const storeRawPayload = String(process.env.SEPAY_WEBHOOK_STORE_RAW_PAYLOAD || 'true').toLowerCase() !== 'false';

        const payload = normalizeSepayPayload(req.body);
        const storedPayload = storeRawPayload ? payload.raw : null;
        if (!payload.providerTransactionId) {
            return res.status(200).json({ success: true, ignored: true, reason: 'missing_transaction_id' });
        }

        const now = new Date();
        const webhookEventId = getSepayWebhookEventDocId(payload.providerTransactionId);
        const transactionId = getSepayTransactionDocId(payload.providerTransactionId);

        // Always log webhook events (best-effort, idempotent)
        await connectToDatabase();
        const webhookEvents = getCollection('payment_webhook_events');
        try {
            await webhookEvents.updateOne(
                { _id: webhookEventId },
                {
                    $setOnInsert: {
                        _id: webhookEventId,
                        provider: 'sepay',
                        providerEventId: payload.providerTransactionId,
                        receivedAt: now,
                        headers: {
                            authorization: req.headers.authorization ? '[REDACTED]' : null,
                            'x-forwarded-for': req.headers['x-forwarded-for'] || null,
                            'user-agent': req.headers['user-agent'] || null,
                        },
                        body: storedPayload,
                    },
                },
                { upsert: true }
            );
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[sepay] Failed to persist webhook event:', err?.message || err);
        }

        // Only process inbound transfers
        if (String(payload.transferType || '').toLowerCase() !== 'in') {
            return res.status(200).json({ success: true, ignored: true, reason: 'transferType_not_in' });
        }

        // Prefer parsing the merchant order code from the transfer description/content.
        // Some providers use `code` for the bank transaction reference, not our order code.
        const contentText = payload.content || payload.description || '';
        const orderCodeFromContent = extractOrderCodeFromContent(contentText);
        const orderCodeFromCode = extractOrderCodeFromContent(payload.code ? String(payload.code) : '');
        const orderCode = orderCodeFromContent || orderCodeFromCode;
        if (!orderCode) {
            await getCollection('payment_transactions').updateOne(
                { _id: transactionId },
                {
                    $setOnInsert: {
                        _id: transactionId,
                        provider: 'sepay',
                        providerTransactionId: payload.providerTransactionId,
                        status: 'unmatched',
                        createdAt: now,
                    },
                    $set: {
                        updatedAt: now,
                        provider: 'sepay',
                        providerTransactionId: payload.providerTransactionId,
                        payload: storedPayload,
                        note: 'Missing payment code / orderCode',
                    },
                },
                { upsert: true }
            );
            return res.status(200).json({ success: true, unmatched: true });
        }

        const orders = getCollection('payment_orders');
        const orderCodeMappings = getCollection('payment_order_codes');

        let order = null;
        try {
            const mapping = await orderCodeMappings.findOne({ _id: orderCode });
            if (mapping?.orderId) {
                order = await orders.findOne({ _id: mapping.orderId });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[sepay] Failed to resolve orderCode mapping:', err?.message || err);
        }

        if (!order) {
            order = await findPaymentOrderByOrderCode(orderCode);
        }

        if (!order) {
            await getCollection('payment_transactions').updateOne(
                { _id: transactionId },
                {
                    $setOnInsert: {
                        _id: transactionId,
                        provider: 'sepay',
                        providerTransactionId: payload.providerTransactionId,
                        status: 'unmatched',
                        createdAt: now,
                    },
                    $set: {
                        updatedAt: now,
                        provider: 'sepay',
                        providerTransactionId: payload.providerTransactionId,
                        orderCode,
                        payload: storedPayload,
                        note: 'Order not found',
                    },
                },
                { upsert: true }
            );
            return res.status(200).json({ success: true, unmatched: true });
        }

        if (String(order.provider || '').toLowerCase() !== 'sepay') {
            await orders.updateOne(
                { _id: order._id },
                {
                    $set: {
                        status: 'needs_review',
                        updatedAt: now,
                        reviewReason: 'provider_mismatch',
                        reviewMeta: { expectedProvider: 'sepay', actualProvider: order.provider || null },
                    },
                }
            );
            return res.status(200).json({ success: true, needsReview: true });
        }

        const configuredAccount = normalizeAccountNumber(
            process.env.PAYMENT_ACCOUNT_NUMBER || process.env.BANK_ACCOUNT_NUMBER || ''
        );
        const receivedAccount = normalizeAccountNumber(payload.accountNumber);
        const accountOk = !configuredAccount || !receivedAccount || configuredAccount === receivedAccount;

        const expiresAt = order.expiresAt ? new Date(order.expiresAt) : null;
        const isExpired =
            expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt.getTime() < now.getTime() : false;

        // Validate amount for membership orders
        const expectedAmount = Number(order.amountVnd || 0);
        const rawTransferAmount = Number(payload.transferAmount || 0);
        const actualAmount = Number.isFinite(rawTransferAmount) ? Math.round(rawTransferAmount) : 0;
        const diff = Math.abs(expectedAmount - actualAmount);
        const amountOk = expectedAmount > 0 && diff <= PAYMENT_AMOUNT_TOLERANCE_VND;

        const transactionStatus = !accountOk
            ? 'account_mismatch'
            : isExpired && order.status !== 'paid'
                ? 'received_late'
                : amountOk
                    ? 'received'
                    : 'amount_mismatch';

        // Persist transaction (idempotent)
        await getCollection('payment_transactions').updateOne(
            { _id: transactionId },
            {
                $setOnInsert: {
                    _id: transactionId,
                    provider: 'sepay',
                    providerTransactionId: payload.providerTransactionId,
                    orderId: order._id?.toString(),
                    orderCode,
                    createdAt: now,
                },
                $set: {
                    updatedAt: now,
                    provider: 'sepay',
                    providerTransactionId: payload.providerTransactionId,
                    orderId: order._id?.toString(),
                    orderCode,
                    gateway: payload.gateway,
                    transactionDate: payload.transactionDate,
                    accountNumber: payload.accountNumber,
                    transferAmount: actualAmount,
                    transferType: payload.transferType,
                    content: payload.content,
                    payload: storedPayload,
                    status: transactionStatus,
                },
            },
            { upsert: true }
        );

        // Do not downgrade already-paid orders. Record the transaction but keep the order status.
        if (order.status !== 'paid') {
            if (!accountOk) {
                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            status: 'needs_review',
                            updatedAt: now,
                            reviewReason: 'account_mismatch',
                            reviewMeta: { expectedAccount: configuredAccount || null, receivedAccount: receivedAccount || null },
                            providerTransactionId: payload.providerTransactionId,
                            payment: {
                                provider: 'sepay',
                                gateway: payload.gateway,
                                transactionDate: payload.transactionDate,
                                accountNumber: payload.accountNumber,
                                referenceCode: payload.referenceCode,
                                transferAmount: actualAmount,
                                content: payload.content,
                            },
                        },
                    }
                );
                return res.status(200).json({ success: true, needsReview: true });
            }

            if (isExpired) {
                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            status: 'needs_review',
                            updatedAt: now,
                            reviewReason: 'expired',
                            reviewMeta: { expiresAt: expiresAt ? expiresAt.toISOString() : null, receivedAt: now.toISOString() },
                            providerTransactionId: payload.providerTransactionId,
                            payment: {
                                provider: 'sepay',
                                gateway: payload.gateway,
                                transactionDate: payload.transactionDate,
                                accountNumber: payload.accountNumber,
                                referenceCode: payload.referenceCode,
                                transferAmount: actualAmount,
                                content: payload.content,
                            },
                        },
                    }
                );
                return res.status(200).json({ success: true, needsReview: true });
            }

            if (!amountOk) {
                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            status: 'needs_review',
                            updatedAt: now,
                            reviewReason: 'amount_mismatch',
                            reviewMeta: { expectedAmount, actualAmount, tolerance: PAYMENT_AMOUNT_TOLERANCE_VND },
                            providerTransactionId: payload.providerTransactionId,
                            payment: {
                                provider: 'sepay',
                                gateway: payload.gateway,
                                transactionDate: payload.transactionDate,
                                accountNumber: payload.accountNumber,
                                referenceCode: payload.referenceCode,
                                transferAmount: actualAmount,
                                content: payload.content,
                            },
                        },
                    }
                );

                return res.status(200).json({ success: true, needsReview: true });
            }
        }

        if (String(order.type || '').toLowerCase() !== 'membership') {
            const paidAt = order.paidAt ? new Date(order.paidAt) : now;
            await orders.updateOne(
                { _id: order._id },
                {
                    $set: {
                        status: 'paid',
                        paidAt,
                        updatedAt: now,
                        providerTransactionId: payload.providerTransactionId,
                        payment: {
                            provider: 'sepay',
                            gateway: payload.gateway,
                            transactionDate: payload.transactionDate,
                            accountNumber: payload.accountNumber,
                            referenceCode: payload.referenceCode,
                            transferAmount: actualAmount,
                            content: payload.content,
                        },
                    },
                }
            );
            return res.status(200).json({ success: true });
        }

        // Apply membership (idempotent per order)
        const users = getCollection('users');
        const userId = String(order.userId || '');
        const userFilter = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { _id: userId };
        const user = await users.findOne(userFilter, { projection: { membership: 1 } });
        if (!user) {
            await orders.updateOne(
                { _id: order._id },
                {
                    $set: {
                        status: 'needs_review',
                        reviewReason: 'user_not_found',
                        updatedAt: now,
                        providerTransactionId: payload.providerTransactionId,
                        payment: {
                            provider: 'sepay',
                            gateway: payload.gateway,
                            transactionDate: payload.transactionDate,
                            accountNumber: payload.accountNumber,
                            referenceCode: payload.referenceCode,
                            transferAmount: actualAmount,
                            content: payload.content,
                        },
                    },
                }
            );
            return res.status(200).json({ success: true, needsReview: true });
        }

        const currentMembership = normalizeMembership(user.membership);
        const membershipAlreadyApplied =
            (currentMembership.orderId && String(currentMembership.orderId) === String(order._id)) ||
            Boolean(order.fulfillment?.appliedAt);

        const planId = order.planId || order.tier;
        const plan = getMembershipPlans().find((p) => p.id === normalizeTier(planId));
        if (!plan) {
            await orders.updateOne(
                { _id: order._id },
                {
                    $set: {
                        status: 'needs_review',
                        reviewReason: 'invalid_plan',
                        updatedAt: now,
                        providerTransactionId: payload.providerTransactionId,
                        payment: {
                            provider: 'sepay',
                            gateway: payload.gateway,
                            transactionDate: payload.transactionDate,
                            accountNumber: payload.accountNumber,
                            referenceCode: payload.referenceCode,
                            transferAmount: actualAmount,
                            content: payload.content,
                        },
                    },
                }
            );
            return res.status(200).json({ success: true, needsReview: true });
        }

        const paidAt = order.paidAt ? new Date(order.paidAt) : now;

        if (!membershipAlreadyApplied) {
            const newMembership = computeNewMembershipFromPurchase({
                currentMembership: user.membership,
                purchasedTier: plan.tier,
                durationDays: plan.durationDays,
                now: paidAt,
            });

            await setUserMembership({
                userId,
                membership: newMembership,
                source: 'sepay',
                orderId: order._id?.toString(),
            });
        }

        const appliedAt = order.fulfillment?.appliedAt ? new Date(order.fulfillment.appliedAt) : now;
        await orders.updateOne(
            { _id: order._id },
            {
                $set: {
                    status: 'paid',
                    paidAt,
                    updatedAt: now,
                    providerTransactionId: payload.providerTransactionId,
                    payment: {
                        provider: 'sepay',
                        gateway: payload.gateway,
                        transactionDate: payload.transactionDate,
                        accountNumber: payload.accountNumber,
                        referenceCode: payload.referenceCode,
                        transferAmount: actualAmount,
                        content: payload.content,
                    },
                    fulfillment: {
                        type: 'membership',
                        appliedAt,
                        userId,
                    },
                },
            }
        );

        return res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
