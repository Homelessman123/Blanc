const synonymGroups: Array<{ base: string; synonyms: string[] }> = [
    {
        base: 'toan',
        synonyms: ['toan hoc', 'math', 'mathematics', 'so hoc', 'algebra', 'geometry', 'calculus', 'sat math']
    },
    {
        base: 'khoa hoc',
        synonyms: ['science', 'stem', 'khoa hoc tu nhien', 'vat ly', 'hoa hoc', 'sinh hoc']
    },
    {
        base: 'science',
        synonyms: ['khoa hoc', 'stem', 'vat ly', 'hoa hoc', 'sinh hoc']
    },
    {
        base: 'stem',
        synonyms: ['khoa hoc', 'science', 'cong nghe', 'ky thuat', 'toan']
    },
    {
        base: 'cong nghe',
        synonyms: ['technology', 'tech', 'cntt', 'it', 'lap trinh', 'coding']
    },
    {
        base: 'tin hoc',
        synonyms: ['computer', 'cong nghe', 'lap trinh', 'it', 'cntt', 'coding']
    },
    {
        base: 'lap trinh',
        synonyms: ['coding', 'programming', 'developer', 'python', 'javascript', 'web']
    },
    {
        base: 'coding',
        synonyms: ['lap trinh', 'programming', 'developer', 'hackathon']
    },
    {
        base: 'ky thuat',
        synonyms: ['engineering', 'cong nghe', 'stem', 'robot', 'arduino']
    },
    {
        base: 'engineering',
        synonyms: ['ky thuat', 'cong nghe', 'stem']
    },
    {
        base: 'robot',
        synonyms: ['robotics', 'ky thuat', 'arduino', 'stem', 'cong nghe']
    },
    {
        base: 'nghe thuat',
        synonyms: ['art', 'design', 'sang tao', 've', 'drawing', 'creative']
    },
    {
        base: 'thiet ke',
        synonyms: ['design', 'creative', 'sang tao', 'web design', 'ui', 'ux']
    },
    {
        base: 'sang tao',
        synonyms: ['creative', 'design', 'nghe thuat', 'innovation']
    },
    {
        base: 'ngoai ngu',
        synonyms: ['language', 'english', 'tieng anh', 'speaking', 'communication']
    },
    {
        base: 'tieng anh',
        synonyms: ['english', 'language', 'speaking', 'communication', 'sat']
    },
    {
        base: 'thuyet trinh',
        synonyms: ['presentation', 'speaking', 'communication', 'public speaking']
    },
    {
        base: 'kinh te',
        synonyms: ['economics', 'business', 'kinh doanh', 'finance']
    },
    {
        base: 'kinh doanh',
        synonyms: ['business', 'economics', 'entrepreneurship', 'startup']
    },
    {
        base: 'hoc tap',
        synonyms: ['learning', 'education', 'study', 'academic']
    },
    {
        base: 'sat',
        synonyms: ['test', 'exam', 'toan', 'tieng anh', 'academic']
    },
    {
        base: 'web',
        synonyms: ['website', 'web development', 'html', 'css', 'javascript', 'lap trinh']
    },
    {
        base: 'animation',
        synonyms: ['hoat hinh', 'creative', 'design', 'javascript', 'web']
    },
    {
        base: 'data',
        synonyms: ['data science', 'phan tich', 'python', 'khoa hoc du lieu']
    },
    {
        base: 'python',
        synonyms: ['lap trinh', 'coding', 'data science', 'programming']
    }
];

const normalizedKeywordMap = new Map<string, Set<string>>();

const getSynonymSet = (keyword: string): Set<string> => {
    let set = normalizedKeywordMap.get(keyword);
    if (!set) {
        set = new Set<string>();
        normalizedKeywordMap.set(keyword, set);
    }
    return set;
};

const addRelation = (a: string, b: string): void => {
    if (!a || !b || a === b) {
        return;
    }
    getSynonymSet(a).add(b);
    getSynonymSet(b).add(a);
};

export const normalizeForMatch = (value: string): string => {
    if (!value) {
        return '';
    }

    return value
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0111/g, 'd')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

synonymGroups.forEach(({ base, synonyms }) => {
    const normalizedBase = normalizeForMatch(base);
    if (!normalizedBase) {
        return;
    }

    const normalizedSynonyms = synonyms
        .map(s => normalizeForMatch(s))
        .filter((s): s is string => Boolean(s));

    normalizedSynonyms.forEach(synonym => addRelation(normalizedBase, synonym));

    for (let i = 0; i < normalizedSynonyms.length; i++) {
        for (let j = i + 1; j < normalizedSynonyms.length; j++) {
            addRelation(normalizedSynonyms[i], normalizedSynonyms[j]);
        }
    }
});

export const getKeywordVariants = (keyword: string): string[] => {
    const normalized = normalizeForMatch(keyword);
    if (!normalized) {
        return [];
    }

    const set = new Set<string>([normalized]);
    const synonyms = normalizedKeywordMap.get(normalized);
    if (synonyms) {
        synonyms.forEach(s => set.add(s));
    }
    return Array.from(set);
};

export const areKeywordsRelated = (keyword1: string, keyword2: string): boolean => {
    const normalized1 = normalizeForMatch(keyword1);
    const normalized2 = normalizeForMatch(keyword2);

    if (!normalized1 || !normalized2) {
        return false;
    }

    if (normalized1 === normalized2) {
        return true;
    }

    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return true;
    }

    const variants1 = getKeywordVariants(normalized1);
    const variants2 = getKeywordVariants(normalized2);
    const variantSet2 = new Set<string>(variants2);

    for (const variant1 of variants1) {
        if (variantSet2.has(variant1)) {
            return true;
        }

        for (const variant2 of variants2) {
            if (!variant1 || !variant2) {
                continue;
            }
            if (variant1.includes(variant2) || variant2.includes(variant1)) {
                return true;
            }
        }
    }

    return false;
};

export const ensureStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        if (!value.trim()) {
            return [];
        }

        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === 'string');
            }
        } catch {
            // Ignore JSON parse errors and fallback to comma separated values.
        }

        return value
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);
    }

    return [];
};

