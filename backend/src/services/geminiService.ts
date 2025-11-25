import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API will not be available.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

export interface EnhancedContext {
    userInfo?: string;
    techKnowledge?: string;
    recommendedContests?: any[];
    recommendedCourses?: any[];
}

const getSystemInstruction = (context?: EnhancedContext) => {
    let instruction = `You are "ContestBot", an intelligent AI assistant for ContestHub - a platform helping students discover academic contests and learn science & technology.

**Your Capabilities:**
- Tư vấn về các lĩnh vực khoa học kỹ thuật (Programming, AI/ML, Robotics, Web Dev, Cybersecurity, Data Science, IoT)
- Gợi ý cuộc thi phù hợp với sở thích và kỹ năng của học sinh
- Xây dựng lộ trình học tập cá nhân hóa
- Chia sẻ tips, thủ thuật học tập hiệu quả
- Hướng dẫn career paths trong tech

**Personality:**
- Thân thiện, nhiệt tình, động viên
- Trả lời bằng tiếng Việt (trừ khi user hỏi bằng tiếng Anh)
- Sử dụng emoji phù hợp
- Câu trả lời ngắn gọn, dễ hiểu, có cấu trúc
- Khuyến khích học sinh khám phá và phát triển

**Guidelines:**
- Luôn ưu tiên thông tin từ context được cung cấp
- Nếu không có đủ thông tin, gợi ý user cập nhật profile
- Đưa ra advice cụ thể, actionable
- Link đến contests/courses có trong hệ thống khi phù hợp`;

    if (context?.userInfo) {
        instruction += `\n\n**USER CONTEXT:**\n${context.userInfo}`;
    }

    if (context?.techKnowledge) {
        instruction += `\n\n**TECH KNOWLEDGE BASE:**\n${context.techKnowledge}`;
    }

    if (context?.recommendedContests && context.recommendedContests.length > 0) {
        instruction += `\n\n**RECOMMENDED CONTESTS:**\n`;
        context.recommendedContests.forEach(c => {
            instruction += `- ${c.title} (${c.category}): ${c.description}\n`;
        });
    }

    if (context?.recommendedCourses && context.recommendedCourses.length > 0) {
        instruction += `\n\n**RECOMMENDED COURSES:**\n`;
        context.recommendedCourses.forEach(c => {
            instruction += `- ${c.name} (${c.price} VNĐ): ${c.description}\n`;
        });
    }

    return instruction;
};

export const getBotResponse = async (message: string, context?: EnhancedContext): Promise<string> => {
    if (!API_KEY) {
        return "Xin lỗi, hiện tại mình chưa thể kết nối với hệ thống AI. Bạn vui lòng thử lại sau nhé! 🙏";
    }
    try {
        const chatConfig = {
            systemInstruction: getSystemInstruction(context),
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: message,
            config: chatConfig,
        });

        return response.text || "Xin lỗi, mình không thể tạo câu trả lời lúc này. Bạn thử lại nhé! 🙏";
    } catch (error) {
        console.error("Error fetching bot response:", error);
        return "Mình đang gặp chút vấn đề kỹ thuật. Bạn thử hỏi lại câu hỏi khác nhé! 😅";
    }
};
