import express from 'express';
import { COURSES } from '../constants';
import prisma from '../db';
import { optionalAuth } from '../middleware/optionalAuth.middleware';

const router = express.Router();

const computeReviewStats = (product: any) => {
    const reviews = product.reviews || [];
    if (!reviews.length) {
        return { rating: product.rating || 0, reviewCount: product.reviewCount || 0 };
    }
    const total = reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
    const reviewCount = reviews.length;
    const rating = Math.round((total / reviewCount) * 10) / 10;
    return { rating, reviewCount };
};

// Get all products (using constants for now)
router.get('/', async (_req, res) => {
    try {
        const enriched = COURSES.map((product) => {
            const stats = computeReviewStats(product);
            return { ...product, ...stats };
        });
        res.json(enriched);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

const enrichReviewsWithUsers = async (reviews: any[]) => {
    try {
        const ids = new Set<string>();
        const emails = new Set<string>();

        reviews.forEach((review) => {
            const reviewerId = review.reviewerId;
            if (typeof reviewerId === 'string') {
                if (reviewerId.includes('@')) {
                    emails.add(reviewerId);
                } else {
                    ids.add(reviewerId);
                }
            }
        });

        if (ids.size === 0 && emails.size === 0) {
            return reviews;
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    ids.size ? { id: { in: Array.from(ids) } } : undefined,
                    emails.size ? { email: { in: Array.from(emails) } } : undefined,
                ].filter(Boolean) as any[],
            },
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
            },
        });

        const byId = new Map(users.map((u) => [u.id, u]));
        const byEmail = new Map(users.map((u) => [u.email, u]));

        return reviews.map((review) => {
            const found =
                (review.reviewerId && byId.get(review.reviewerId)) ||
                (review.reviewerId && byEmail.get(review.reviewerId));

            if (!found) return review;

            const resolvedName = review.reviewerName || found.displayName || found.name || found.email || 'Học viên';
            const resolvedEmail = found.email || review.reviewerId;

            return {
                ...review,
                reviewerName: resolvedName,
                reviewerId: resolvedEmail,
            };
        });
    } catch (error) {
        console.error('Enrich reviews with users failed:', error);
        return reviews;
    }
};

// Get product by ID
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const product = COURSES.find((p) => p.id === productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const stats = computeReviewStats(product);
        const enrichedReviews = await enrichReviewsWithUsers(product.reviews || []);

        res.json({ ...product, ...stats, reviews: enrichedReviews });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get reviews for a product
router.get('/:productId/reviews', async (req, res) => {
    try {
        const { productId } = req.params;
        const product = COURSES.find((p) => p.id === productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const enrichedReviews = await enrichReviewsWithUsers(product.reviews || []);
        res.json(enrichedReviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Add a review (mock implementation)
router.post('/:productId/reviews', optionalAuth, async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment, reviewerName, reviewerId } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const target = COURSES.find((p) => p.id === productId);
        if (!target) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const newReview = {
            id: Date.now().toString(),
            rating,
            comment,
            reviewerName: (reviewerName && reviewerName.trim()) || req.user?.name || req.user?.email || 'Học viên mới',
            reviewerId: (reviewerId && reviewerId.trim()) || req.user?.id || 'anonymous',
            isVerifiedPurchase: false,
            createdAt: new Date().toISOString(),
        };

        target.reviews = [...(target.reviews || []), newReview];
        const stats = computeReviewStats(target);
        target.rating = stats.rating;
        target.reviewCount = stats.reviewCount;

        res.status(201).json({ review: newReview, ...stats });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

export default router;
