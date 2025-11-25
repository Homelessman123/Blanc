import prisma from '../db';

/**
 * IMPROVED TEAMMATE RECOMMENDATION SERVICE v2.0
 * 
 * Cải tiến:
 * 1. Semantic Skill Matching - Nhận diện skills liên quan (React ~ Frontend)
 * 2. Weighted Scoring - Trọng số động dựa trên độ quan trọng
 * 3. Diversity Boost - Đảm bảo gợi ý đa dạng
 * 4. Mutual Benefit Score - Cả hai bên đều có lợi
 * 5. Relaxed Filtering - Không loại bỏ quá nhiều ứng viên
 * 6. Activity Bonus - Ưu tiên user active
 */

type RawUser = {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  location: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  profileColor: string | null;
  profileGif: string | null;
  interests: any;
  talents: any;
  futureMajor: string | null;
  streak?: number;
  lastLoginDate?: Date | null;
};

export type TeammateRecommendation = {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  location: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  profileColor: string | null;
  profileGif: string | null;
  interests: string[];
  talents: string[];
  futureMajor: string | null;
  matchScore: number;
  matchPercent: number;
  matchReasons: string[];
  commonInterests: string[];
  commonTalents: string[];
  complementaryTalents: string[];
  complementCategories: string[];
  supplyDemand?: {
    teammateFillsYourNeeds: string[];
    youFillTheirNeeds: string[];
  };
};

// ==================== SKILL CLUSTERS (Semantic Matching) ====================
const SKILL_CLUSTERS: Record<string, string[]> = {
  frontend: ['react', 'vue', 'angular', 'frontend', 'html', 'css', 'javascript', 'typescript', 'ui', 'web', 'nextjs', 'tailwind', 'lập trình web'],
  backend: ['nodejs', 'python', 'java', 'backend', 'api', 'database', 'sql', 'mongodb', 'express', 'django', 'spring', 'server', 'php'],
  ai_ml: ['ai', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'data science', 'neural', 'trí tuệ nhân tạo', 'học máy'],
  design: ['design', 'figma', 'ui/ux', 'ux', 'photoshop', 'illustrator', 'đồ họa', 'thiết kế', 'graphic', 'canva', 'adobe', 'vẽ'],
  mobile: ['android', 'ios', 'flutter', 'react native', 'mobile', 'swift', 'kotlin', 'app'],
  devops: ['devops', 'aws', 'docker', 'kubernetes', 'ci/cd', 'cloud', 'azure', 'gcp', 'linux'],
  data: ['data', 'analytics', 'sql', 'excel', 'tableau', 'powerbi', 'phân tích', 'thống kê', 'statistics', 'phân tích dữ liệu'],
  business: ['business', 'marketing', 'kinh doanh', 'startup', 'product', 'growth', 'seo', 'content', 'chiến lược'],
  communication: ['thuyết trình', 'presentation', 'viết', 'writing', 'giao tiếp', 'communication', 'public speaking', 'debate', 'viết lách'],
  research: ['nghiên cứu', 'research', 'học thuật', 'science', 'khoa học', 'toán', 'math', 'physics', 'vật lý', 'hóa học'],
  creative: ['sáng tạo', 'creative', 'video', 'photography', 'animation', 'nghệ thuật', 'art', 'âm nhạc'],
  leadership: ['lãnh đạo', 'leadership', 'quản lý', 'management', 'team lead', 'pm', 'project manager', 'làm việc nhóm'],
  robotics: ['robotics', 'robot', 'iot', 'arduino', 'raspberry', 'embedded', 'điện tử', 'electronics', 'olympic tin học'],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tech: ['dev', 'developer', 'code', 'coding', 'software', 'khoa hoc may tinh', 'computer', 'ai', 'machine learning', 'data', 'robotics', 'iot', 'it', 'program', 'lập trình', 'tin học'],
  design: ['design', 'ui', 'ux', 'ux/ui', 'figma', 'visual', 'đồ họa', 'hoạ', 'graphic', 'brand', 'animation', 'thiết kế', 'vẽ'],
  business: ['business', 'startup', 'kinh doanh', 'growth', 'product', 'pm', 'product manager', 'chiến lược', 'strategy'],
  communication: ['thuyết trình', 'presentation', 'communication', 'truyền thông', 'public speaking', 'debate', 'viết', 'writing'],
  marketing: ['marketing', 'ads', 'advertising', 'digital', 'seo', 'content', 'social', 'copywriting'],
  research: ['research', 'nghiên cứu', 'học thuật', 'phân tích', 'analysis', 'science', 'khoa học', 'toán học'],
};

// ==================== SCORING WEIGHTS ====================
// v2.1: Ưu tiên ĐA DẠNG thay vì GIỐNG NHAU để tạo đội hoàn hảo
const WEIGHTS = {
  commonInterest: 2,           // Sở thích chung (GIẢM - không quá quan trọng)
  commonTalentBonus: 0,        // Có talent chung (KHÔNG điểm - cần đa dạng)
  commonTalentPenalty: -5,     // Penalty nếu talent quá giống (tránh trùng lặp)
  complementaryTalent: 12,     // Talent bổ sung (TĂNG CAO - quan trọng nhất)
  complementaryCluster: 18,    // Cluster kỹ năng bổ sung (RẤT CAO - đa dạng đội)
  differentClusterBonus: 15,   // Bonus khi thuộc cluster hoàn toàn khác
  fillsYourNeeds: 10,          // Đáp ứng nhu cầu của bạn
  youFillTheirs: 8,            // Bạn đáp ứng nhu cầu của họ
  mutualBenefit: 12,           // Cả hai đều có lợi
  sameMajor: 2,                // Cùng ngành (GIẢM - không cần giống)
  relatedMajor: 1,             // Ngành liên quan
  differentMajorBonus: 8,      // Bonus ngành KHÁC (tạo đội đa dạng)
  sameLocation: 6,             // Cùng địa điểm (giảm nhẹ)
  nearLocation: 3,             // Gần địa điểm
  balancedProfile: 5,          // Profile cân bằng
  activeUser: 3,               // User active
  semanticMatch: 2,            // Semantic skill match bonus
  uniqueSkillBonus: 10,        // Bonus cho kỹ năng độc đáo mà user chưa có
};

// ==================== IDEAL TEAM ROLES ====================
// Một đội hoàn hảo nên có các vai trò này
const IDEAL_TEAM_ROLES = [
  'tech',         // Lập trình, kỹ thuật
  'data',         // Phân tích dữ liệu
  'design',       // Thiết kế
  'communication', // Thuyết trình, giao tiếp
  'research',     // Nghiên cứu
  'business',     // Kinh doanh, chiến lược
];

const sanitizeStrings = (value: any): string[] => {
  if (!value) return [];
  const rawArray = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? parseJsonArray(value)
      : [];

  const normalized: string[] = [];

  for (const item of rawArray) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (!normalized.includes(trimmed)) {
      normalized.push(trimmed);
    }
  }

  return normalized.slice(0, 25);
};

const parseJsonArray = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toComparable = (value: string) => value.normalize('NFC').toLowerCase().trim();

const intersectStrings = (left: string[], right: string[]): string[] => {
  const rightSet = new Set(right.map(toComparable));
  return left.filter((item) => rightSet.has(toComparable(item)));
};

// ==================== SEMANTIC MATCHING ====================

/**
 * Tìm skill cluster của một skill
 */
const findSkillCluster = (skill: string): string | null => {
  const normalized = toComparable(skill);
  for (const [cluster, keywords] of Object.entries(SKILL_CLUSTERS)) {
    if (keywords.some(kw => normalized.includes(kw) || kw.includes(normalized))) {
      return cluster;
    }
  }
  return null;
};

/**
 * Kiểm tra 2 skills có liên quan không (semantic matching)
 */
const areSkillsRelated = (skill1: string, skill2: string): boolean => {
  const s1 = toComparable(skill1);
  const s2 = toComparable(skill2);

  // Exact match
  if (s1 === s2) return true;

  // Partial match
  if (s1.includes(s2) || s2.includes(s1)) return true;

  // Same cluster
  const cluster1 = findSkillCluster(skill1);
  const cluster2 = findSkillCluster(skill2);
  if (cluster1 && cluster2 && cluster1 === cluster2) return true;

  return false;
};

/**
 * Tìm common skills với semantic matching
 */
const findSemanticCommonSkills = (skills1: string[], skills2: string[]): string[] => {
  const common: string[] = [];
  const used2 = new Set<number>();

  for (const s1 of skills1) {
    for (let i = 0; i < skills2.length; i++) {
      if (used2.has(i)) continue;
      if (areSkillsRelated(s1, skills2[i])) {
        common.push(s1);
        used2.add(i);
        break;
      }
    }
  }
  return common;
};

/**
 * Tìm complementary skills (không có trong user's skills)
 */
const findComplementarySkills = (userSkills: string[], teammateSkills: string[]): string[] => {
  return teammateSkills.filter(ts =>
    !userSkills.some(us => areSkillsRelated(us, ts))
  );
};

/**
 * Lấy skill clusters của user
 */
const getUserSkillClusters = (interests: string[], talents: string[]): Set<string> => {
  const clusters = new Set<string>();
  for (const skill of [...interests, ...talents]) {
    const cluster = findSkillCluster(skill);
    if (cluster) clusters.add(cluster);
  }
  return clusters;
};

const detectCategories = (values: string[]): string[] => {
  const categories = new Set<string>();

  for (const value of values) {
    const target = toComparable(value);
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => target.includes(keyword))) {
        categories.add(category);
      }
    }
  }

  return Array.from(categories);
};

const scoreCandidate = (current: RawUser, candidate: RawUser) => {
  const currentInterests = sanitizeStrings(current.interests);
  const currentTalents = sanitizeStrings(current.talents);
  const candidateInterests = sanitizeStrings(candidate.interests);
  const candidateTalents = sanitizeStrings(candidate.talents);

  // Skill clusters
  const currentClusters = getUserSkillClusters(currentInterests, currentTalents);
  const candidateClusters = getUserSkillClusters(candidateInterests, candidateTalents);

  const currentCategories = detectCategories([
    ...currentInterests,
    ...currentTalents,
    current.futureMajor || '',
  ]);
  const candidateCategories = detectCategories([
    ...candidateInterests,
    ...candidateTalents,
    candidate.futureMajor || '',
  ]);

  // Common skills với semantic matching
  const commonInterests = findSemanticCommonSkills(currentInterests, candidateInterests);
  const commonTalents = findSemanticCommonSkills(currentTalents, candidateTalents);

  // Complementary skills
  const complementaryTalents = findComplementarySkills(currentTalents, candidateTalents);

  // Complementary clusters (những cluster user chưa có)
  const complementaryClusters = Array.from(candidateClusters).filter(c => !currentClusters.has(c));

  const complementCategories = candidateCategories.filter(
    (category) => !currentCategories.includes(category)
  );

  // Supply/Demand analysis
  const userDemand = detectCategories([...currentInterests, current.futureMajor || '']);
  const userSupply = detectCategories([...currentTalents, current.futureMajor || '']);
  const candidateDemand = detectCategories([...candidateInterests, candidate.futureMajor || '']);
  const candidateSupply = detectCategories([...candidateTalents, candidate.futureMajor || '']);

  const teammateFillsYourNeeds = candidateSupply.filter(
    (cat) => userDemand.includes(cat) && !userSupply.includes(cat)
  );
  const youFillTheirNeeds = userSupply.filter(
    (cat) => candidateDemand.includes(cat) && !candidateSupply.includes(cat)
  );

  // ==================== CALCULATE SCORE ====================
  // v2.1: ƯU TIÊN ĐA DẠNG - Tạo đội hoàn hảo với các vai trò khác nhau
  let score = 0;
  const reasons: string[] = [];
  let mutualBenefitScore = 0;
  let diversityScore = 0;

  // 1. Common Interests (giảm trọng số - không quan trọng bằng đa dạng)
  if (commonInterests.length > 0) {
    score += Math.min(commonInterests.length, 2) * WEIGHTS.commonInterest;
  }

  // 2. Common Talents - PENALTY nếu quá giống (đội cần đa dạng, không cần 2 người cùng skill)
  if (commonTalents.length >= 2) {
    score += commonTalents.length * WEIGHTS.commonTalentPenalty;
    // Không thêm reason tiêu cực
  }

  // 3. ĐA DẠNG CLUSTER - Bonus CAO nếu candidate thuộc cluster hoàn toàn khác
  const hasNoCommonClusters = Array.from(candidateClusters).every(c => !currentClusters.has(c));
  if (hasNoCommonClusters && candidateClusters.size > 0) {
    score += WEIGHTS.differentClusterBonus;
    diversityScore += 40;
    const clusterNames = Array.from(candidateClusters).slice(0, 2).map(c => {
      const nameMap: Record<string, string> = {
        frontend: 'Frontend', backend: 'Backend', ai_ml: 'AI/ML', design: 'Thiết kế',
        mobile: 'Mobile', devops: 'DevOps', data: 'Phân tích dữ liệu', business: 'Kinh doanh',
        communication: 'Giao tiếp & Thuyết trình', research: 'Nghiên cứu khoa học',
        creative: 'Sáng tạo & Nghệ thuật', leadership: 'Lãnh đạo', robotics: 'Robotics'
      };
      return nameMap[c] || c;
    });
    reasons.push(`🌟 Mang đến kỹ năng mới: ${clusterNames.join(', ')}`);
  }

  // 4. Complementary Talents (điểm cao - kỹ năng bổ sung)
  if (complementaryTalents.length > 0) {
    score += Math.min(complementaryTalents.length, 5) * WEIGHTS.complementaryTalent;
    diversityScore += complementaryTalents.length * 10;
    if (!hasNoCommonClusters) {
      reasons.push(`Bổ sung cho bạn: ${complementaryTalents.slice(0, 3).join(', ')}`);
    }
  }

  // 5. Complementary Clusters (cluster mà user chưa có)
  if (complementaryClusters.length > 0 && !hasNoCommonClusters) {
    score += Math.min(complementaryClusters.length, 3) * WEIGHTS.complementaryCluster;
    const clusterNames = complementaryClusters.slice(0, 2).map(c => {
      const nameMap: Record<string, string> = {
        frontend: 'Frontend', backend: 'Backend', ai_ml: 'AI/ML', design: 'Thiết kế',
        mobile: 'Mobile', devops: 'DevOps', data: 'Data', business: 'Kinh doanh',
        communication: 'Giao tiếp', research: 'Nghiên cứu', creative: 'Sáng tạo',
        leadership: 'Lãnh đạo', robotics: 'Robotics'
      };
      return nameMap[c] || c;
    });
    reasons.push(`Kỹ năng bổ sung: ${clusterNames.join(', ')}`);
  }

  // 6. Supply/Demand - Mutual Benefit
  const hasMutualBenefit = teammateFillsYourNeeds.length > 0 && youFillTheirNeeds.length > 0;
  if (hasMutualBenefit) {
    score += WEIGHTS.mutualBenefit;
    mutualBenefitScore = 100;
    reasons.push('🤝 Cả hai đều bổ sung cho nhau');
  } else {
    if (teammateFillsYourNeeds.length > 0) {
      score += teammateFillsYourNeeds.length * WEIGHTS.fillsYourNeeds;
      mutualBenefitScore += teammateFillsYourNeeds.length * 30;
    }
    if (youFillTheirNeeds.length > 0) {
      score += youFillTheirNeeds.length * WEIGHTS.youFillTheirs;
      mutualBenefitScore += youFillTheirNeeds.length * 20;
    }
  }

  // 7. Complement Categories (category khác hoàn toàn)
  if (complementCategories.length > 0) {
    score += Math.min(complementCategories.length, 3) * 8;
    diversityScore += complementCategories.length * 15;
  }

  // 8. Major matching - ƯU TIÊN NGÀNH KHÁC cho đội đa dạng
  if (current.futureMajor && candidate.futureMajor) {
    const cMajor = toComparable(current.futureMajor);
    const tMajor = toComparable(candidate.futureMajor);
    const cCluster = findSkillCluster(current.futureMajor);
    const tCluster = findSkillCluster(candidate.futureMajor);

    // Bonus cao nếu ngành KHÁC cluster
    if (cCluster && tCluster && cCluster !== tCluster) {
      score += WEIGHTS.differentMajorBonus;
      diversityScore += 20;
      reasons.push(`📚 Ngành bổ sung: ${candidate.futureMajor}`);
    } else if (cMajor === tMajor) {
      score += WEIGHTS.sameMajor;
    } else if (cMajor.includes(tMajor) || tMajor.includes(cMajor)) {
      score += WEIGHTS.relatedMajor;
    }
  }

  // 9. Location matching (giữ nguyên)
  if (current.location && candidate.location) {
    const cLoc = toComparable(current.location);
    const tLoc = toComparable(candidate.location);
    if (cLoc === tLoc) {
      score += WEIGHTS.sameLocation;
      reasons.push(`📍 Cùng khu vực: ${candidate.location}`);
    } else if (cLoc.split(' ')[0] === tLoc.split(' ')[0] ||
      cLoc.includes(tLoc.split(' ')[0]) ||
      tLoc.includes(cLoc.split(' ')[0])) {
      score += WEIGHTS.nearLocation;
    }
  }

  // 10. Balanced profile bonus
  const hasTech = candidateCategories.includes('tech');
  const hasNonTech = candidateCategories.some((cat) => cat !== 'tech');
  if (hasTech && hasNonTech) {
    score += WEIGHTS.balancedProfile;
  }

  // 11. Activity bonus
  if (candidate.streak && candidate.streak > 3) {
    score += WEIGHTS.activeUser;
  }

  // 12. Unique Skill Bonus - kỹ năng mà chưa ai trong team có
  const uniqueSkillsCount = candidateTalents.filter(t =>
    !currentTalents.some(ct => areSkillsRelated(ct, t))
  ).length;
  if (uniqueSkillsCount >= 2) {
    score += WEIGHTS.uniqueSkillBonus;
    diversityScore += 15;
  }

  const finalReasons = reasons.length > 0 ? reasons : ['Hồ sơ đa dạng, bổ sung cho đội của bạn'];

  return {
    score: Math.max(0, score),
    diversityScore,
    commonInterests,
    commonTalents,
    complementaryTalents,
    complementCategories,
    complementaryClusters,
    supplyDemand: {
      teammateFillsYourNeeds,
      youFillTheirNeeds,
    },
    reasons: finalReasons,
    mutualBenefitScore,
    details: {
      interests: candidateInterests,
      talents: candidateTalents,
      categories: candidateCategories,
    },
  };
};

export const getTeammateRecommendations = async (userId: string): Promise<TeammateRecommendation[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      role: true,
      location: true,
      phoneNumber: true,
      avatar: true,
      profileColor: true,
      profileGif: true,
      interests: true,
      talents: true,
      futureMajor: true,
      streak: true,
      lastLoginDate: true,
    },
  });

  const currentUser = users.find((user) => user.id === userId);
  if (!currentUser) {
    return [];
  }

  // Lọc bỏ user hiện tại, bot, và users không có profile
  const candidates = users.filter(u =>
    u.id !== userId &&
    !u.name?.toLowerCase().includes('bot') &&
    !u.displayName?.toLowerCase().includes('bot') &&
    (sanitizeStrings(u.interests).length > 0 || sanitizeStrings(u.talents).length > 0)
  );

  if (candidates.length === 0) {
    return [];
  }

  // Get current user's clusters để tìm người ĐA DẠNG
  const currentClusters = getUserSkillClusters(
    sanitizeStrings(currentUser.interests),
    sanitizeStrings(currentUser.talents)
  );

  // Score tất cả candidates
  interface ScoredCandidate {
    user: typeof candidates[0];
    scored: ReturnType<typeof scoreCandidate>;
    primaryCluster: string | null;
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    const scored = scoreCandidate(currentUser, candidate);
    const candidateClusters = getUserSkillClusters(
      sanitizeStrings(candidate.interests),
      sanitizeStrings(candidate.talents)
    );

    // Tìm primary cluster (cluster đầu tiên không trùng với user)
    let primaryCluster: string | null = null;
    for (const cluster of candidateClusters) {
      if (!currentClusters.has(cluster)) {
        primaryCluster = cluster;
        break;
      }
    }
    // Nếu tất cả cluster đều trùng, lấy cluster đầu tiên
    if (!primaryCluster && candidateClusters.size > 0) {
      primaryCluster = Array.from(candidateClusters)[0];
    }

    // Chấp nhận TẤT CẢ candidates có profile (để có đội đa dạng)
    scoredCandidates.push({ user: candidate, scored, primaryCluster });
  }

  // ==================== TEAM BUILDING ALGORITHM ====================
  // Mục tiêu: Tạo đội đa dạng với các vai trò khác nhau

  // Sắp xếp theo diversityScore trước, sau đó theo score tổng
  scoredCandidates.sort((a, b) => {
    // Ưu tiên diversity score cao nhất
    const diversityA = a.scored.diversityScore || 0;
    const diversityB = b.scored.diversityScore || 0;
    if (diversityB !== diversityA) {
      return diversityB - diversityA;
    }
    // Sau đó theo score tổng
    return b.scored.score - a.scored.score;
  });

  // Ensure MAXIMUM DIVERSITY: mỗi cluster chỉ chọn 1 người
  const selectedCandidates: ScoredCandidate[] = [];
  const usedClusters = new Set<string>();

  // Round 1: Chọn người từ các cluster KHÁC với user (ưu tiên đa dạng)
  for (const candidate of scoredCandidates) {
    if (selectedCandidates.length >= 4) break;

    const cluster = candidate.primaryCluster;

    // Ưu tiên cluster hoàn toàn khác với user
    if (cluster && !currentClusters.has(cluster) && !usedClusters.has(cluster)) {
      selectedCandidates.push(candidate);
      usedClusters.add(cluster);
    }
  }

  // Round 2: Nếu chưa đủ, thêm từ các cluster còn lại (vẫn đảm bảo đa dạng)
  for (const candidate of scoredCandidates) {
    if (selectedCandidates.length >= 4) break;
    if (selectedCandidates.includes(candidate)) continue;

    const cluster = candidate.primaryCluster;
    if (!cluster || !usedClusters.has(cluster)) {
      selectedCandidates.push(candidate);
      if (cluster) usedClusters.add(cluster);
    }
  }

  // Round 3: Nếu vẫn chưa đủ, thêm theo score cao nhất
  for (const candidate of scoredCandidates) {
    if (selectedCandidates.length >= 4) break;
    if (!selectedCandidates.includes(candidate)) {
      selectedCandidates.push(candidate);
    }
  }

  // Normalize score thành percent
  const maxScore = Math.max(...selectedCandidates.map(c => c.scored.score), 1);

  const recommendations: TeammateRecommendation[] = selectedCandidates.map(({ user, scored }) => ({
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    location: user.location,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
    profileColor: user.profileColor,
    profileGif: user.profileGif,
    interests: sanitizeStrings(user.interests),
    talents: sanitizeStrings(user.talents),
    futureMajor: user.futureMajor,
    matchScore: scored.score,
    matchPercent: Math.max(40, Math.min(98, Math.round((scored.score / maxScore) * 100))),
    matchReasons: scored.reasons.slice(0, 4),
    commonInterests: scored.commonInterests.slice(0, 4),
    commonTalents: scored.commonTalents.slice(0, 4),
    complementaryTalents: scored.complementaryTalents.slice(0, 4),
    complementCategories: scored.complementCategories,
    supplyDemand: scored.supplyDemand,
  }));

  // Sort lại theo matchPercent
  return recommendations.sort((a, b) => b.matchPercent - a.matchPercent);
};
