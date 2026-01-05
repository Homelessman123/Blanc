import crypto from 'node:crypto';

// Minimal ObjectId-compatible helper.
// Keeps the existing codebase working while moving storage to PostgreSQL.
export class ObjectId {
    /** @type {string} */
    #hex;

    /**
     * @param {string} [hex]
     */
    constructor(hex) {
        if (hex === undefined) {
            this.#hex = crypto.randomBytes(12).toString('hex');
            return;
        }

        if (!ObjectId.isValid(hex)) {
            throw new Error('Invalid ObjectId');
        }

        this.#hex = hex.toLowerCase();
    }

    static isValid(value) {
        if (value instanceof ObjectId) return true;
        if (typeof value !== 'string') return false;
        return /^[0-9a-fA-F]{24}$/.test(value);
    }

    toString() {
        return this.#hex;
    }

    toJSON() {
        return this.#hex;
    }

    valueOf() {
        return this.#hex;
    }

    equals(other) {
        if (other instanceof ObjectId) return this.#hex === other.#hex;
        if (typeof other === 'string') return this.#hex === other.toLowerCase();
        return false;
    }
}

export function normalizeId(value) {
    if (value instanceof ObjectId) return value.toString();
    if (typeof value === 'string') return value;
    if (value && typeof value.toString === 'function') return value.toString();
    return String(value);
}
