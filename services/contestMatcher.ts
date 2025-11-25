import type { Contest, User } from '../types';
import { CONTESTS } from '../constants';
import { ensureStringArray, getKeywordVariants, normalizeForMatch } from './matchingUtils';

interface MatchedContest extends Contest {
    matchScore: number;
    matchReasons: string[];
}

interface KeywordDetail {
    original: string;
    normalized: string;
}

interface IndexedContest {
    contest: Contest;
    tags: string[];
    normalizedTags: string[];
    normalizedCategory?: string;
    normalizedText: string;
    textWords: string[];
    deadlineTime: number;
}

interface SemanticMatch {
    detail: KeywordDetail;
    score: number;
    importance: number;
}

const keywordImportanceCache = new Map<string, number>();

const ensureKeywordDetails = (values: string[]): KeywordDetail[] =>
    values
        .map(value => ({
            original: value,
            normalized: normalizeForMatch(value)
        }))
        .filter(detail => Boolean(detail.normalized));

const parseContestTags = (tags: Contest['tags']): string[] => {
    if (!tags) {
        return [];
    }

    if (Array.isArray(tags)) {
        return tags.filter((tag): tag is string => typeof tag === 'string');
    }

    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
                return parsed.filter((tag): tag is string => typeof tag === 'string');
            }
        } catch {
            // Ignore parse errors and treat as comma separated string.
            return tags
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean);
        }
    }

    return [];
};

const buildIndexedContest = (contest: Contest): IndexedContest => {
    const tags = parseContestTags(contest.tags);
    const normalizedTags = tags.map(tag => normalizeForMatch(tag)).filter(Boolean);

    const textSource = [
        contest.title,
        contest.description,
        contest.category || '',
        ...tags
    ]
        .filter(Boolean)
        .join(' ');

    const normalizedText = normalizeForMatch(textSource);
    const textWords = normalizedText ? normalizedText.split(' ') : [];
    const normalizedCategory = contest.category ? normalizeForMatch(contest.category) : undefined;
    const deadlineReference = contest.registrationDeadline || contest.deadline || contest.startDate;
    const deadlineTime = deadlineReference ? new Date(deadlineReference).getTime() : Number.NaN;

    return {
        contest,
        tags,
        normalizedTags,
        normalizedCategory,
        normalizedText,
        textWords,
        deadlineTime
    };
};

const INDEXED_CONTESTS: IndexedContest[] = CONTESTS.map(buildIndexedContest);

const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeForMatch(str1);
    const s2 = normalizeForMatch(str2);

    if (!s1 || !s2) {
        return 0;
    }

    if (s1 === s2) {
        return 1;
    }

    if (s1.includes(s2) || s2.includes(s1)) {
        return 0.8;
    }

    const words1 = s1.split(' ').filter(Boolean);
    const words2 = s2.split(' ').filter(Boolean);
    const commonWords = words1.filter(word => words2.includes(word));

    if (commonWords.length > 0) {
        return 0.6 * (commonWords.length / Math.max(words1.length, words2.length));
    }

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) {
        return 0;
    }

    const distance = levenshteinDistance(s1, s2);
    return Math.max(0, 1 - distance / maxLen);
};

const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
};

const fuzzyMatch = (
    keywords: string[],
    contestData: IndexedContest,
    threshold = 0.6
): { matched: boolean; score: number; matchedKeyword: string } => {
    const { normalizedText, textWords } = contestData;
    let bestScore = 0;
    let bestKeyword = '';

    for (const keyword of keywords) {
        const variants = getKeywordVariants(keyword);

        for (const variant of variants) {
            if (!variant) {
                continue;
            }

            if (normalizedText.includes(variant)) {
                if (1 > bestScore) {
                    bestScore = 1;
                    bestKeyword = keyword;
                }
                continue;
            }

            const variantWords = variant.split(' ').filter(Boolean);

            for (const textWord of textWords) {
                for (const variantWord of variantWords) {
                    const similarity = calculateSimilarity(textWord, variantWord);
                    if (similarity >= threshold && similarity > bestScore) {
                        bestScore = similarity;
                        bestKeyword = keyword;
                    }
                }
            }
        }
    }

    return {
        matched: bestScore >= threshold,
        score: bestScore,
        matchedKeyword: bestKeyword
    };
};

const calculateKeywordImportance = (normalizedKeyword: string, allIndexedContests: IndexedContest[]): number => {
    if (!normalizedKeyword) {
        return 0;
    }

    const cached = keywordImportanceCache.get(normalizedKeyword);
    if (cached !== undefined) {
        return cached;
    }

    let documentFrequency = 0;

    allIndexedContests.forEach(contestData => {
        const match = fuzzyMatch([normalizedKeyword], contestData, 0.6);
        if (match.matched) {
            documentFrequency += 1;
        }
    });

    const idf = Math.log((allIndexedContests.length + 1) / (documentFrequency + 1));
    const importance = Math.min(idf * 1.5, 3);
    keywordImportanceCache.set(normalizedKeyword, importance);
    return importance;
};

const calculateSemanticMatches = (
    keywordDetails: KeywordDetail[],
    contestData: IndexedContest,
    allIndexedContests: IndexedContest[]
): SemanticMatch[] => {
    const matches: SemanticMatch[] = [];

    keywordDetails.forEach(detail => {
        const match = fuzzyMatch([detail.original], contestData, 0.4);
        if (match.matched) {
            const importance = calculateKeywordImportance(detail.normalized, allIndexedContests);
            matches.push({
                detail,
                score: match.score,
                importance
            });
        }
    });

    return matches;
};

export const matchContestsForUser = async (user: User): Promise<MatchedContest[]> => {
    const userInterests = ensureKeywordDetails(ensureStringArray(user.interests));
    const userTalents = ensureKeywordDetails(ensureStringArray(user.talents));

    if (userInterests.length === 0 && userTalents.length === 0) {
        return [];
    }

    const keywordMap = new Map<string, KeywordDetail>();
    [...userInterests, ...userTalents].forEach(detail => {
        if (!keywordMap.has(detail.normalized)) {
            keywordMap.set(detail.normalized, detail);
        }
    });
    const allKeywordDetails = Array.from(keywordMap.values());

    const futureMajorDetails = user.futureMajor
        ? ensureKeywordDetails([user.futureMajor])
        : [];

    const now = Date.now();
    const matchedContests: MatchedContest[] = [];

    INDEXED_CONTESTS.forEach(contestData => {
        const { contest } = contestData;
        let matchScore = 0;
        const matchReasons: string[] = [];
        const matchedReasonKeys = new Set<string>();
        const uniqueMatchedKeywords = new Set<string>();

        const addSemanticMatches = (
            matches: SemanticMatch[],
            type: 'interest' | 'talent' | 'major',
            weight: number,
            label: string
        ) => {
            matches.forEach(({ detail, score, importance }) => {
                if (!detail.normalized) {
                    return;
                }

                const reasonKey = `${type}_${detail.normalized}`;
                if (matchedReasonKeys.has(reasonKey)) {
                    return;
                }

                const points = score * importance * weight;
                if (points <= 0) {
                    return;
                }

                matchScore += points;
                matchedReasonKeys.add(reasonKey);
                uniqueMatchedKeywords.add(detail.normalized);
                matchReasons.push(
                    `${label} "${detail.original}" (~${Math.round(score * 100)}% match, importance ${importance.toFixed(1)})`
                );
            });
        };

        addSemanticMatches(
            calculateSemanticMatches(userInterests, contestData, INDEXED_CONTESTS),
            'interest',
            1,
            'Interest match'
        );

        addSemanticMatches(
            calculateSemanticMatches(userTalents, contestData, INDEXED_CONTESTS),
            'talent',
            1.5,
            'Talent match'
        );

        addSemanticMatches(
            calculateSemanticMatches(futureMajorDetails, contestData, INDEXED_CONTESTS),
            'major',
            0.8,
            'Future major alignment'
        );

        const allKeywordVariants = allKeywordDetails.map(detail => ({
            detail,
            variants: getKeywordVariants(detail.original)
        }));

        if (contestData.normalizedCategory) {
            allKeywordVariants.forEach(({ detail, variants }) => {
                const reasonKey = `category_${detail.normalized}`;
                if (matchedReasonKeys.has(reasonKey)) {
                    return;
                }

                const matchesCategory = variants.some(
                    variant => variant && contestData.normalizedCategory?.includes(variant)
                );

                if (matchesCategory) {
                    matchScore += 2;
                    matchedReasonKeys.add(reasonKey);
                    uniqueMatchedKeywords.add(detail.normalized);
                    matchReasons.push(`Category "${contest.category}" fits "${detail.original}"`);
                }
            });
        }

        contestData.normalizedTags.forEach((normalizedTag, index) => {
            allKeywordVariants.forEach(({ detail, variants }) => {
                const tagReasonKey = `tag_${detail.normalized}_${normalizedTag}`;
                if (matchedReasonKeys.has(tagReasonKey)) {
                    return;
                }

                const matchesTag = variants.some(variant => {
                    if (!variant) {
                        return false;
                    }
                    return normalizedTag.includes(variant) || variant.includes(normalizedTag);
                });

                if (matchesTag) {
                    matchScore += 1.5;
                    matchedReasonKeys.add(tagReasonKey);
                    uniqueMatchedKeywords.add(detail.normalized);
                    const displayTag = contestData.tags[index] || normalizedTag;
                    matchReasons.push(`Tag "${displayTag}" relates to "${detail.original}"`);
                }
            });
        });

        const deadlineTime = contestData.deadlineTime;
        let daysUntilDeadline = Number.POSITIVE_INFINITY;

        if (!Number.isNaN(deadlineTime)) {
            daysUntilDeadline = Math.ceil((deadlineTime - now) / (1000 * 60 * 60 * 24));

            if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) {
                const urgencyBonus = 0.5 + (1 * (30 - daysUntilDeadline)) / 30;
                matchScore += urgencyBonus;
                matchReasons.push(`Registration closes in ${daysUntilDeadline} day(s)`);
            } else if (daysUntilDeadline > 30 && daysUntilDeadline <= 90) {
                matchScore += 0.3;
            }
        }

        if (contest.prizeAmount && contest.prizeAmount > 0) {
            matchScore += 0.5;
            matchReasons.push('Offers prize incentives');
        }

        if (!contest.fee || contest.fee === 0) {
            matchScore += 0.3;
            matchReasons.push('Free registration');
        }

        const stemKeywords = ['toan', 'khoa hoc', 'cong nghe', 'ky thuat', 'lap trinh', 'robot', 'stem'];
        const creativeKeywords = ['nghe thuat', 'thiet ke', 'sang tao', 'creative', 'design', 'art', 'animation'];

        const hasStemInterest = userInterests.some(detail =>
            stemKeywords.some(keyword => detail.normalized.includes(keyword))
        );
        const hasStemTalent = userTalents.some(detail =>
            stemKeywords.some(keyword => detail.normalized.includes(keyword))
        );
        const isStemContest = stemKeywords.some(keyword =>
            contestData.normalizedText.includes(keyword)
        );

        if ((hasStemInterest || hasStemTalent) && isStemContest) {
            matchScore += 1;
            matchReasons.push('Strong STEM alignment');
            uniqueMatchedKeywords.add('stem');
        }

        const hasCreativeInterest = userInterests.some(detail =>
            creativeKeywords.some(keyword => detail.normalized.includes(keyword))
        );
        const hasCreativeTalent = userTalents.some(detail =>
            creativeKeywords.some(keyword => detail.normalized.includes(keyword))
        );
        const isCreativeContest = creativeKeywords.some(keyword =>
            contestData.normalizedText.includes(keyword)
        );

        if ((hasCreativeInterest || hasCreativeTalent) && isCreativeContest) {
            matchScore += 1;
            matchReasons.push('Creative profile match');
            uniqueMatchedKeywords.add('creative');
        }

        const hasStrongMatch = matchScore >= 2.5;
        const hasModerateMatch = matchScore >= 1.2 && uniqueMatchedKeywords.size >= 2;
        const hasWeakMatch = matchScore > 0.4 && uniqueMatchedKeywords.size >= 1;
        const isUpcoming = daysUntilDeadline > 0 && daysUntilDeadline <= 60;

        if (hasStrongMatch || hasModerateMatch || hasWeakMatch || (isUpcoming && uniqueMatchedKeywords.size > 0)) {
            const normalizedScore = Math.min(Math.round(matchScore * 10), 100);
            const deduplicatedReasons = Array.from(new Set(matchReasons));

            matchedContests.push({
                ...contest,
                matchScore: normalizedScore,
                matchReasons: deduplicatedReasons.length > 0 ? deduplicatedReasons : ['General fit for your profile']
            });
        }
    });

    matchedContests.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }

        const deadlineA = new Date(a.registrationDeadline || a.deadline || a.startDate).getTime();
        const deadlineB = new Date(b.registrationDeadline || b.deadline || b.startDate).getTime();
        return deadlineA - deadlineB;
    });

    let topMatches = matchedContests.slice(0, 5);

    if (topMatches.length === 0) {
        const upcomingContests = CONTESTS.filter(contest => {
            const deadlineReference = contest.registrationDeadline || contest.deadline || contest.startDate;
            if (!deadlineReference) {
                return false;
            }
            const deadline = new Date(deadlineReference);
            return !Number.isNaN(deadline.getTime()) && deadline.getTime() >= now;
        })
            .sort((a, b) => {
                const deadlineA = new Date(a.registrationDeadline || a.deadline || a.startDate).getTime();
                const deadlineB = new Date(b.registrationDeadline || b.deadline || b.startDate).getTime();
                return deadlineA - deadlineB;
            })
            .slice(0, 3);

        if (upcomingContests.length > 0) {
            topMatches = upcomingContests.map(contest => ({
                ...contest,
                matchScore: 5,
                matchReasons: ['Upcoming contest worth exploring']
            }));
        } else {
            topMatches = CONTESTS.slice(0, 3).map(contest => ({
                ...contest,
                matchScore: 3,
                matchReasons: ['General recommendation']
            }));
        }
    }

    return topMatches;
};

