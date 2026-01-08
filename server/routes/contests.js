import { Router } from 'express';
import { ObjectId } from '../lib/objectId.js';
import { connectToDatabase, getCollection } from '../lib/db.js';
import { getCached, invalidate } from '../lib/cache.js';
import { authGuard, requireRole } from '../middleware/auth.js';

const router = Router();

// Category normalization (map legacy values and new slugs to friendly labels)
const CATEGORY_MAP = {
  'it': 'IT & Tech',
  'it & tech': 'IT & Tech',
  'it & tech (hackathon, coding, ai/ml)': 'IT & Tech',
  'hackathon': 'IT & Tech',
  'coding': 'IT & Tech',
  'coding contest': 'IT & Tech',
  'ai/ml': 'IT & Tech',
  'ai': 'IT & Tech',
  'ml': 'IT & Tech',
  'programming': 'IT & Tech',
  'data': 'Data & Analytics',
  'data & analytics': 'Data & Analytics',
  'analytics': 'Data & Analytics',
  'data science': 'Data & Analytics',
  'cyber': 'Cybersecurity',
  'cybersecurity': 'Cybersecurity',
  'security': 'Cybersecurity',
  'infosec': 'Cybersecurity',
  'robotics': 'Robotics & IoT',
  'robot': 'Robotics & IoT',
  'iot': 'Robotics & IoT',
  'embedded': 'Robotics & IoT',
  'hardware': 'Robotics & IoT',
  'design': 'Design / UI-UX',
  'ui': 'Design / UI-UX',
  'ux': 'Design / UI-UX',
  'ui/ux': 'Design / UI-UX',
  'product design': 'Design / UI-UX',
  'business': 'Business & Strategy',
  'strategy': 'Business & Strategy',
  'case study': 'Business & Strategy',
  'management': 'Business & Strategy',
  'startup': 'Startup & Innovation',
  'innovation': 'Startup & Innovation',
  'pitch': 'Startup & Innovation',
  'entrepreneurship': 'Startup & Innovation',
  'marketing': 'Marketing & Growth',
  'growth': 'Marketing & Growth',
  'branding': 'Marketing & Growth',
  'brand': 'Marketing & Growth',
  'seo': 'Marketing & Growth',
  'ads': 'Marketing & Growth',
  'finance': 'Finance & Fintech',
  'fintech': 'Finance & Fintech',
  'investment': 'Finance & Fintech',
  'trading': 'Finance & Fintech',
  'health': 'Health & Biotech',
  'biotech': 'Health & Biotech',
  'medical': 'Health & Biotech',
  'med': 'Health & Biotech',
  'education': 'Education & EdTech',
  'edtech': 'Education & EdTech',
  'learning': 'Education & EdTech',
  'training': 'Education & EdTech',
  'sustainability': 'Sustainability & Environment',
  'environment': 'Sustainability & Environment',
  'green': 'Sustainability & Environment',
  'climate': 'Sustainability & Environment',
  'gaming': 'Gaming & Esports',
  'esports': 'Gaming & Esports',
  'game': 'Gaming & Esports',
  'research': 'Research & Science',
  'science': 'Research & Science',
  'other': 'Other'
};

function normalizeCategory(category = '') {
  const normalized = category.toString().toLowerCase().trim();
  if (!normalized) return '';
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];

  // Fallback: partial match against known keys
  const hit = Object.entries(CATEGORY_MAP).find(([key]) => normalized.includes(key));
  if (hit) return hit[1];

  return category;
}

async function getActiveRegistrationCountMap(contestIds) {
  const registrations = getCollection('registrations');

  const normalizedIds = (contestIds || []).filter(Boolean);
  if (normalizedIds.length === 0) return new Map();

  // Handle legacy data where contestId may be stored as string instead of ObjectId
  const idStrings = normalizedIds.map((id) => id.toString());
  const inList = [...normalizedIds, ...idStrings];

  const rows = await registrations
    .aggregate([
      { $match: { status: 'active', contestId: { $in: inList } } },
      { $group: { _id: { $toString: '$contestId' }, count: { $sum: 1 } } },
    ])
    .toArray();

  const map = new Map();
  for (const row of rows) {
    map.set(row._id, row.count);
  }
  return map;
}

async function deleteAllContestData() {
  const contests = getCollection('contests');
  const registrations = getCollection('registrations');
  const teams = getCollection('teams');
  const teamPosts = getCollection('team_posts');

  const deletedRegistrations = await registrations.deleteMany({ contestId: { $exists: true, $ne: null } });
  const deletedTeams = await teams.deleteMany({ contestId: { $exists: true, $ne: null } });
  const deletedTeamPosts = await teamPosts.deleteMany({ contestId: { $exists: true, $ne: null } });
  const deletedContests = await contests.deleteMany({});

  await invalidate('contests:*');

  return {
    deletedContests: deletedContests.deletedCount || 0,
    deletedRegistrations: deletedRegistrations.deletedCount || 0,
    deletedTeams: deletedTeams.deletedCount || 0,
    deletedTeamPosts: deletedTeamPosts.deletedCount || 0,
  };
}

const contestFields = {
  projection: {
    title: 1,
    organizer: 1,
    dateStart: 1,
    deadline: 1,
    status: 1,
    fee: 1,
    tags: 1,
    image: 1,
    description: 1,
    // New fields for complete contest info
    location: 1,
    locationType: 1,
    category: 1,
    rules: 1,
    schedule: 1,
    prizes: 1,
    objectives: 1,
    eligibility: 1,
    organizerDetails: 1,
    maxParticipants: 1,
    registrationCount: 1,
    createdAt: 1,
    updatedAt: 1,
  },
};

// Get all unique tags from contests
router.get('/tags', async (req, res, next) => {
  try {
    await connectToDatabase();

    // Aggregate to get unique tags with count
    const tagsAggregation = await getCollection('contests').aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, // Sort by popularity
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]).toArray();

    res.json({
      tags: tagsAggregation.map(t => t.tag),
      tagsWithCount: tagsAggregation
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await connectToDatabase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    const tagsRaw = typeof req.query.tags === 'string' ? req.query.tags : undefined;
    const tags = (tagsRaw || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const queryParts = [];
    if (tag) queryParts.push({ tags: tag });
    if (tags.length === 1) queryParts.push({ tags: tags[0] });
    if (tags.length > 1) queryParts.push({ tags: { $in: tags } });
    if (status) queryParts.push({ status });
    if (search) {
      queryParts.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { organizer: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }
    const query = queryParts.length ? { $and: queryParts } : {};

    const sortMap = {
      title: { title: sortOrder === 'asc' ? 1 : -1 },
      createdAt: { createdAt: sortOrder === 'asc' ? 1 : -1 },
      deadline: { deadline: sortOrder === 'asc' ? 1 : -1 },
      dateStart: { dateStart: sortOrder === 'asc' ? 1 : -1 },
    };
    const sortSpec = sortBy && sortMap[sortBy] ? sortMap[sortBy] : { createdAt: -1 };

    const cacheKey = `contests:list:${encodeURIComponent(
      JSON.stringify({ tag: tag || '', tags, status: status || '', search, page, limit, sortBy: sortBy || '', sortOrder })
    )}`;

    const mapped = await getCached(
      cacheKey,
      async () => {
        const total = await getCollection('contests').countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const contests = await getCollection('contests')
          .find(query, contestFields)
          .sort(sortSpec)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();

        const countMap = await getActiveRegistrationCountMap(contests.map((c) => c._id));

        const items = contests.map((doc) => {
          const contest = mapContest(doc);
          contest.registrationCount = countMap.get(doc._id.toString()) ?? 0;
          return contest;
        });

        return { items, total, page, limit, totalPages };
      },
      600 // 10 minutes cache
    );

    res.json({
      contests: mapped.items,
      items: mapped.items,
      total: mapped.total,
      page: mapped.page,
      limit: mapped.limit,
      totalPages: mapped.totalPages,
    });
  } catch (error) {
    next(error);
  }
});

// Delete ALL contests (admin only)
router.delete('/', authGuard, requireRole('admin'), async (req, res, next) => {
  try {
    await connectToDatabase();
    res.json(await deleteAllContestData());
  } catch (error) {
    next(error);
  }
});

// Proxy-friendly bulk delete (admin only). Some deployments block DELETE methods.
router.post('/delete-all', authGuard, requireRole('admin'), async (req, res, next) => {
  try {
    await connectToDatabase();
    res.json(await deleteAllContestData());
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contest id' });
    }

    const contestId = new ObjectId(id);
    const contest = await getCollection('contests').findOne({ _id: contestId }, contestFields);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const activeCount = await getCollection('registrations').countDocuments({
      status: 'active',
      $or: [{ contestId }, { contestId: id }],
    });

    const mapped = mapContest(contest);
    mapped.registrationCount = activeCount;

    res.json({ contest: mapped });
  } catch (error) {
    next(error);
  }
});

router.post('/', authGuard, requireRole('admin'), async (req, res, next) => {
  try {
    await connectToDatabase();
    const body = req.body || {};
    const required = ['title', 'organizer', 'dateStart', 'deadline'];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }

    const payload = {
      title: String(body.title),
      organizer: String(body.organizer),
      dateStart: new Date(body.dateStart).toISOString(),
      deadline: new Date(body.deadline).toISOString(),
      status: body.status || 'OPEN',
      fee: Number(body.fee) || 0,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      image: body.image || '',
      description: body.description || '',
      // New fields
      location: body.location || '',
      locationType: body.locationType || 'online', // online, offline, hybrid
      category: normalizeCategory(body.category || ''), // Canonical category label
      rules: body.rules || '', // Rich text for contest rules
      schedule: Array.isArray(body.schedule) ? body.schedule : [], // Array of {date, title, description}
      prizes: Array.isArray(body.prizes) ? body.prizes : [], // Array of {rank, title, value, description}
      objectives: body.objectives || '', // Contest objectives
      eligibility: body.eligibility || '', // Eligibility requirements
      organizerDetails: body.organizerDetails || {}, // {name, school, logo, description, contact}
      maxParticipants: Number(body.maxParticipants) || 0,
      registrationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.id || null,
    };

    const result = await getCollection('contests').insertOne(payload);

    // Invalidate contests cache
    await invalidate('contests:*');

    res.status(201).json({ id: result.insertedId.toString() });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authGuard, requireRole('admin'), async (req, res, next) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contest id' });
    }

    const updates = { ...req.body, updatedAt: new Date() };
    const allowed = [
      'title', 'organizer', 'dateStart', 'deadline', 'status', 'fee', 'tags', 'image', 'description',
      // New fields
      'location', 'locationType', 'category', 'rules', 'schedule', 'prizes',
      'objectives', 'eligibility', 'organizerDetails', 'maxParticipants'
    ];
    const set = { updatedAt: new Date() };
    allowed.forEach((key) => {
      if (updates[key] !== undefined) {
        set[key] = key === 'category' ? normalizeCategory(updates[key]) : updates[key];
      }
    });

    const result = await getCollection('contests').updateOne(
      { _id: new ObjectId(id) },
      { $set: set }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Invalidate contests cache so list views reflect updates immediately
    await invalidate('contests:*');

    res.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authGuard, requireRole('admin'), async (req, res, next) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contest id' });
    }

    const contestId = new ObjectId(id);
    const contests = getCollection('contests');
    const registrations = getCollection('registrations');
    const teamPosts = getCollection('team_posts');

    // Remove contest first
    const deleteResult = await contests.deleteOne({ _id: contestId });
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Invalidate contests cache so list views don't show deleted items
    await invalidate('contests:*');

    // Best-effort cleanup of related data
    const [registrationCleanup, teamPostsCleanup] = await Promise.allSettled([
      registrations.deleteMany({ contestId }),
      teamPosts.deleteMany({
        $or: [
          { contestId },
          { contestId: id }, // handle string-stored ids
        ]
      })
    ]);

    res.json({
      deleted: true,
      removedRegistrations: registrationCleanup.status === 'fulfilled'
        ? registrationCleanup.value.deletedCount
        : 0,
      removedTeamPosts: teamPostsCleanup.status === 'fulfilled'
        ? teamPostsCleanup.value.deletedCount
        : 0,
    });
  } catch (error) {
    next(error);
  }
});

function mapContest(doc) {
  const maxParticipants = Number(doc.maxParticipants) || 0;
  return {
    id: doc._id?.toString(),
    title: doc.title,
    organizer: doc.organizer,
    dateStart: doc.dateStart,
    deadline: doc.deadline,
    status: doc.status,
    fee: doc.fee,
    tags: doc.tags || [],
    image: doc.image,
    description: doc.description,
    // New fields
    location: doc.location || '',
    locationType: doc.locationType || 'online',
    category: doc.category || '',
    rules: doc.rules || '',
    schedule: doc.schedule || [],
    prizes: doc.prizes || [],
    objectives: doc.objectives || '',
    eligibility: doc.eligibility || '',
    organizerDetails: doc.organizerDetails || {},
    maxParticipants: maxParticipants > 0 ? maxParticipants : undefined,
    registrationCount: Number(doc.registrationCount) || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export default router;
