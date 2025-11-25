import type { User } from '@prisma/client';

/**
 * ContestBot Auto-Response Logic
 * This module handles automatic responses from ContestBot based on user messages
 */

interface BotResponse {
    message: string;
    shouldRespond: boolean;
}

// Get ContestBot user ID (should be fetched from DB in real implementation)
export const CONTESTBOT_EMAIL = 'contestbot@contesthub.com';

// Keywords and their responses
const BOT_RESPONSES: Record<string, string[]> = {
    greeting: [
        '👋 Xin chào! Mình có thể giúp gì cho bạn?',
        '🌟 Chào bạn! Hãy hỏi mình về cuộc thi hoặc tìm đồng đội nhé!',
        '✨ Hello! Bạn muốn tìm hiểu về điều gì?',
    ],
    help: [
        `📚 **Mình có thể giúp bạn:**
• Tìm cuộc thi phù hợp với sở thích
• Tìm đồng đội có cùng mục tiêu
• Gợi ý khóa học và tài liệu
• Giải đáp thắc mắc về cuộc thi`,
        `💡 **Hướng dẫn sử dụng:**
1. Cập nhật profile với sở thích và năng khiếu
2. Duyệt trang /match để tìm đồng đội
3. Tham gia các cuộc thi yêu thích
4. Chat với mình để được tư vấn!`,
    ],
    profile: [
        `🎯 **Hoàn thiện profile giúp bạn:**
• Tìm được đồng đội phù hợp hơn
• Nhận gợi ý cuộc thi chính xác
• Kết nối với người có cùng sở thích

Hãy vào trang Profile và thêm:
✅ Sở thích
✅ Năng khiếu/Lĩnh vực giỏi  
✅ Ngành học dự định`,
        `💫 **Profile tốt = Matching tốt!**
Hãy chia sẻ với mình:
• Bạn thích lĩnh vực nào?
• Bạn giỏi kỹ năng gì?
• Bạn muốn theo đuổi ngành nào?`,
    ],
    teammate: [
        `🤝 **Tìm đồng đội:**
• Vào trang /match để xem gợi ý
• Lọc theo kỹ năng và sở thích
• Kết nối qua chat hoặc team channel

Mình sẽ gợi ý những người phù hợp nhất dựa trên profile của bạn!`,
        `👥 **Mẹo tìm đồng đội tốt:**
1. Hoàn thiện profile trước
2. Tìm người có sở thích tương tự
3. Tham gia team recruitment
4. Chat để tìm hiểu thêm!`,
    ],
    contest: [
        `🏆 **Khám phá cuộc thi:**
• Duyệt trang /contests
• Lọc theo category và level
• Đăng ký trước deadline
• Tham gia để học hỏi và gặp gỡ!

Bạn quan tâm lĩnh vực nào? Mình sẽ gợi ý cuộc thi phù hợp!`,
        `🎯 **Gợi ý tham gia cuộc thi:**
• Olympic Tin học - Dành cho bạn yêu lập trình
• IELTS Challenge - Cho bạn đam mê tiếng Anh
• Khoa học kỹ thuật - Cho nhà nghiên cứu tương lai!`,
    ],
    thanks: [
        '😊 Không có gì! Cần gì cứ hỏi mình nhé!',
        '✨ Rất vui được giúp bạn! Chúc bạn thành công!',
        '🌟 Luôn sẵn sàng hỗ trợ bạn!',
    ],
};

const KEYWORD_PATTERNS: Record<string, RegExp[]> = {
    greeting: [
        /^(xin ch[àa]o|ch[àa]o|hi|hello|hey)/i,
        /^(ch[àa]o b[ạa]n|h[ẹe]y|xin ch[àa]o)/i,
    ],
    help: [
        /(gi[úu]p|h[ướư][oóồ]ng d[ẫa]n|tr[oợ] gi[úu]p|h[ỗo] tr[ợo]|help)/i,
        /(l[àa]m.*th[ếeèê] n[àa]o|c[aá]ch|h[ướư][oóồ]ng)/i,
    ],
    profile: [
        /(profile|th[ôo]ng tin c[aá] nh[aâ]n|c[aậ]p nh[aậ]t|s[oở] th[iíì]ch|n[aă]ng khi[eếê]u)/i,
        /(hoàn thi[eệ]n.*profile|c[aậ]p nh[aậ]t.*profile)/i,
    ],
    teammate: [
        /(t[ìi]m.*[đd][ôồ]ng [đd][ội]|teammate|t[ìi]m b[ạa]n|k[ếe]t n[ối]i)/i,
        /([đd][ôồ]ng [đd][ội]|team|nhóm)/i,
    ],
    contest: [
        /(cu[ộo]c thi|contest|competition|[đd][aă]ng k[ýy])/i,
        /(thi [đd][ấa]u|olympic|challenge)/i,
    ],
    thanks: [
        /(c[aả]m [oơ]n|thanks|thank you|c[aả]m [ơo]n)/i,
        /(c[aả]m [ơo]n b[ạa]n)/i,
    ],
};

/**
 * Generate a bot response based on user message
 */
export function generateBotResponse(message: string, user?: User): BotResponse {
    const lowerMessage = message.toLowerCase().trim();

    // Don't respond to very short messages (< 2 chars)
    if (lowerMessage.length < 2) {
        return { message: '', shouldRespond: false };
    }

    // Check for keyword matches
    for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(lowerMessage)) {
                const responses = BOT_RESPONSES[category];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];

                // Personalize if user info available
                let personalizedResponse = randomResponse;
                if (user?.displayName) {
                    personalizedResponse = `Chào ${user.displayName}! ${randomResponse}`;
                }

                return {
                    message: personalizedResponse,
                    shouldRespond: true,
                };
            }
        }
    }

    // Default response for unrecognized messages
    if (lowerMessage.includes('?') || lowerMessage.length > 10) {
        const defaultResponses = [
            `🤔 Hmm, hiện tại mình chưa tìm thấy ai có profile phù hợp với bạn.

💡 Gợi ý:
• Hãy cập nhật thêm sở thích và năng khiếu trong trang Profile
• Thường xuyên ghé thăm để tìm thêm đồng đội mới
• Tham gia các cuộc thi để gặp gỡ nhiều người hơn! 🏠`,
            `💬 Mình chưa hiểu rõ câu hỏi của bạn. 

Bạn có thể hỏi mình về:
• Tìm đồng đội
• Gợi ý cuộc thi
• Hoàn thiện profile
• Hướng dẫn sử dụng`,
        ];
        return {
            message: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
            shouldRespond: true,
        };
    }

    return { message: '', shouldRespond: false };
}

/**
 * Check if a message should trigger ContestBot response
 */
export function shouldBotRespond(message: string, channelType: string): boolean {
    // Only respond in BOT channels
    if (channelType !== 'BOT') {
        return false;
    }

    // Don't respond to very short messages
    if (message.trim().length < 2) {
        return false;
    }

    return true;
}

/**
 * Generate matching suggestions based on user profile
 */
export function generateMatchingSuggestions(user: User): string {
    const interests = Array.isArray(user.interests)
        ? user.interests
        : (typeof user.interests === 'string' ? JSON.parse(user.interests || '[]') : []);

    const talents = Array.isArray(user.talents)
        ? user.talents
        : (typeof user.talents === 'string' ? JSON.parse(user.talents || '[]') : []);

    if (interests.length === 0 && talents.length === 0) {
        return `👋 Chào ${user.displayName || 'bạn'}!

Mình thấy bạn chưa cập nhật sở thích và năng khiếu. Hãy vào trang Profile để:
✅ Thêm sở thích
✅ Thêm năng khiếu
✅ Chọn ngành học dự định

Sau đó mình sẽ giúp bạn tìm đồng đội phù hợp! 🎯`;
    }

    let suggestions = `🎯 **Profile của ${user.displayName || 'bạn'}:**\n`;

    if (interests.length > 0) {
        suggestions += `\n💡 **Sở thích:** ${interests.slice(0, 5).join(', ')}`;
    }

    if (talents.length > 0) {
        suggestions += `\n⭐ **Năng khiếu:** ${talents.slice(0, 5).join(', ')}`;
    }

    if (user.futureMajor) {
        suggestions += `\n🎓 **Ngành học:** ${user.futureMajor}`;
    }

    suggestions += `\n\n🤝 **Gợi ý:**
• Tìm đồng đội có cùng sở thích trên trang /match
• Tham gia team recruitment phù hợp
• Kết nối qua community chat!`;

    return suggestions;
}
