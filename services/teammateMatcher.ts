import type { User } from '../types';
import { areKeywordsRelated, ensureStringArray, normalizeForMatch } from './matchingUtils';

export interface MatchedTeammate extends User {
    matchScore: number;
    matchReasons: string[];
    commonInterests: string[];
    commonTalents: string[];
    commonContests: string[];
}

const INTEREST_WEIGHT = 3;
const TALENT_WEIGHT = 4;
const MAX_INTEREST_MATCHES = 3;
const MAX_TALENT_MATCHES = 3;
const COMPLEMENT_WEIGHT = 1.5;
const SYNERGY_BONUS = 2;

export const MAX_TEAMMATE_SCORE =
    (INTEREST_WEIGHT * MAX_INTEREST_MATCHES) +
    (TALENT_WEIGHT * MAX_TALENT_MATCHES) +
    5 + // Matching future major
    SYNERGY_BONUS +
    (COMPLEMENT_WEIGHT * 2); // Top two complementary talents

const formatDisplayValue = (value: string): string =>
    value.trim().replace(/\s+/g, ' ');

export const matchTeammatesForUser = async (currentUser: User): Promise<MatchedTeammate[]> => {
    try {
        const response = await fetch('http://localhost:3001/api/auth/users', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const allUsers: User[] = await response.json();
        const otherUsers = allUsers.filter(user => user.id !== currentUser.id);

        if (otherUsers.length === 0) {
            return [];
        }

        const userInterests = ensureStringArray(currentUser.interests);
        const userTalents = ensureStringArray(currentUser.talents);

        const matchedTeammates: MatchedTeammate[] = [];

        for (const teammate of otherUsers) {
            const teammateInterests = ensureStringArray(teammate.interests);
            const teammateTalents = ensureStringArray(teammate.talents);

            let matchScore = 0;
            const matchReasons: string[] = [];
            const commonInterestMap = new Map<string, string>();
            const commonTalentMap = new Map<string, string>();

            for (const interest of userInterests) {
                if (commonInterestMap.size >= MAX_INTEREST_MATCHES) {
                    break;
                }

                const normalizedInterest = normalizeForMatch(interest);
                if (!normalizedInterest) {
                    continue;
                }

                for (const teammateInterest of teammateInterests) {
                    if (!teammateInterest) {
                        continue;
                    }

                    if (areKeywordsRelated(interest, teammateInterest)) {
                        if (!commonInterestMap.has(normalizedInterest)) {
                            matchScore += INTEREST_WEIGHT;
                            const displayValue = formatDisplayValue(interest || teammateInterest);
                            if (displayValue) {
                                commonInterestMap.set(normalizedInterest, displayValue);
                            }
                        }
                        break;
                    }
                }
            }

            for (const talent of userTalents) {
                if (commonTalentMap.size >= MAX_TALENT_MATCHES) {
                    break;
                }

                const normalizedTalent = normalizeForMatch(talent);
                if (!normalizedTalent) {
                    continue;
                }

                for (const teammateTalent of teammateTalents) {
                    if (!teammateTalent) {
                        continue;
                    }

                    if (areKeywordsRelated(talent, teammateTalent)) {
                        if (!commonTalentMap.has(normalizedTalent)) {
                            matchScore += TALENT_WEIGHT;
                            const displayValue = formatDisplayValue(talent || teammateTalent);
                            if (displayValue) {
                                commonTalentMap.set(normalizedTalent, displayValue);
                            }
                        }
                        break;
                    }
                }
            }

            if (currentUser.futureMajor && teammate.futureMajor) {
                if (areKeywordsRelated(currentUser.futureMajor, teammate.futureMajor)) {
                    matchScore += 5;
                    matchReasons.push(`Same target major: ${formatDisplayValue(currentUser.futureMajor)}`);
                }
            }

            const commonInterests = Array.from(commonInterestMap.values());
            const commonTalents = Array.from(commonTalentMap.values());

            if (commonInterests.length > 0) {
                matchReasons.push(`Shared interests: ${commonInterests.slice(0, 2).join(', ')}`);
            }

            if (commonTalents.length > 0) {
                matchReasons.push(`Shared strengths: ${commonTalents.slice(0, 2).join(', ')}`);
            }

            if (commonInterests.length > 0 && commonTalents.length > 0) {
                matchScore += SYNERGY_BONUS;
                matchReasons.push('Balanced overlap across interests and strengths');
            }

            const teammateComplementTalents = teammateTalents.filter(
                talent =>
                    talent &&
                    !userTalents.some(userTalent => areKeywordsRelated(userTalent, talent))
            );

            if (teammateComplementTalents.length > 0) {
                const topComplements = teammateComplementTalents.slice(0, 2).map(formatDisplayValue).filter(Boolean);
                if (topComplements.length > 0) {
                    const complementBonus = Math.min(topComplements.length * COMPLEMENT_WEIGHT, COMPLEMENT_WEIGHT * 2);
                    matchScore += complementBonus;
                    matchReasons.push(`Teammate adds new skills: ${topComplements.join(', ')}`);
                }
            }

            if (matchScore >= INTEREST_WEIGHT) {
                const deduplicatedReasons = Array.from(new Set(matchReasons));

                matchedTeammates.push({
                    ...teammate,
                    matchScore,
                    matchReasons: deduplicatedReasons.length > 0 ? deduplicatedReasons : ['Profile similarity'],
                    commonInterests: commonInterests.slice(0, 3),
                    commonTalents: commonTalents.slice(0, 3),
                    commonContests: []
                });
            }
        }

        matchedTeammates.sort((a, b) => b.matchScore - a.matchScore);
        return matchedTeammates.slice(0, 10);
    } catch (error) {
        console.error('Error matching teammates:', error);
        throw error;
    }
};
