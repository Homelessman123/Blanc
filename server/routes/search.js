import { Router } from 'express';
import { connectToDatabase, getCollection } from '../lib/db.js';

const router = Router();

// Sanitize search query to prevent regex injection
function sanitizeQuery(query) {
    if (!query || typeof query !== 'string') return '';
    // Escape special regex characters and limit length
    return query
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .trim();
}

// GET /api/search - Tìm kiếm contests và courses
router.get('/', async (req, res, next) => {
    try {
        await connectToDatabase();

        const rawQuery = req.query.q;
        const query = sanitizeQuery(rawQuery);
        const type = req.query.type; // 'contests', 'courses', hoặc undefined (cả hai)
        const limit = Math.min(Number(req.query.limit) || 10, 50);

        if (!query) {
            return res.json({ contests: [], courses: [], total: 0 });
        }

        const searchRegex = { $regex: query, $options: 'i' };
        const results = { contests: [], courses: [], total: 0 };

        // Search contests
        if (!type || type === 'contests') {
            const contestsQuery = {
                $or: [
                    { title: searchRegex },
                    { organizer: searchRegex },
                    { description: searchRegex },
                    { tags: searchRegex },
                ],
            };

            const contests = await getCollection('contests')
                .find(contestsQuery, {
                    projection: {
                        title: 1,
                        organizer: 1,
                        status: 1,
                        fee: 1,
                        tags: 1,
                        image: 1,
                        dateStart: 1,
                        deadline: 1,
                    },
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            results.contests = contests.map((doc) => ({
                id: doc._id.toString(),
                title: doc.title,
                organizer: doc.organizer,
                status: doc.status,
                fee: doc.fee,
                tags: doc.tags || [],
                image: doc.image,
                dateStart: doc.dateStart,
                deadline: doc.deadline,
                type: 'contest',
            }));
        }

        // Search courses
        if (!type || type === 'courses') {
            const coursesQuery = {
                $or: [
                    { title: searchRegex },
                    { instructor: searchRegex },
                    { description: searchRegex },
                ],
            };

            const courses = await getCollection('courses')
                .find(coursesQuery, {
                    projection: {
                        title: 1,
                        instructor: 1,
                        price: 1,
                        rating: 1,
                        reviewsCount: 1,
                        level: 1,
                        image: 1,
                    },
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            results.courses = courses.map((doc) => ({
                id: doc._id.toString(),
                title: doc.title,
                instructor: doc.instructor,
                price: doc.price,
                rating: doc.rating,
                reviewsCount: doc.reviewsCount,
                level: doc.level,
                image: doc.image,
                type: 'course',
            }));
        }

        results.total = results.contests.length + results.courses.length;

        res.json(results);
    } catch (error) {
        next(error);
    }
});

export default router;
