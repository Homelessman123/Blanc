import { Request, Response } from 'express';
import { getBotResponse } from '../services/geminiService';
import { 
    getUserContext, 
    getRecommendedContests, 
    getRecommendedProducts,
    formatUserContextForAI 
} from '../services/userContextService';
import { 
    TECH_FIELDS, 
    GENERAL_LEARNING_TIPS, 
    CONTEST_PREP_TIPS,
    findRelevantFields 
} from '../knowledge/scienceTechKnowledge';

/**
 * POST /api/chatbot/message
 * Send message to chatbot with full context
 */
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const userId = req.user?.id; // From auth middleware

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                success: false,
                message: 'Message is required' 
            });
        }

        // Build context
        let context: any = {};

        // Get user context if logged in
        if (userId) {
            const userContext = await getUserContext(userId);
            
            if (userContext) {
                context.userInfo = formatUserContextForAI(userContext);

                // Get recommendations based on interests
                if (userContext.interests.length > 0) {
                    const contests = await getRecommendedContests(userContext.interests, 3);
                    const products = await getRecommendedProducts(userContext.interests, 3);
                    
                    context.recommendedContests = contests;
                    context.recommendedCourses = products;
                }

                // Add relevant tech knowledge
                if (userContext.interests.length > 0 || userContext.talents.length > 0) {
                    const relevantFields = findRelevantFields(
                        userContext.interests, 
                        userContext.talents
                    );
                    
                    if (relevantFields.length > 0) {
                        let techKnowledge = '';
                        relevantFields.forEach(field => {
                            techKnowledge += `\n**${field.name}:**\n`;
                            techKnowledge += `${field.description}\n`;
                            techKnowledge += `Key skills: ${field.keySkills.join(', ')}\n`;
                            techKnowledge += `Learning tips:\n${field.learningTips.join('\n')}\n`;
                        });
                        context.techKnowledge = techKnowledge;
                    }
                }
            }
        }

        // If user asks about general learning tips or contest prep
        if (message.toLowerCase().includes('học') || message.toLowerCase().includes('tips')) {
            if (!context.techKnowledge) {
                context.techKnowledge = GENERAL_LEARNING_TIPS.join('\n');
            }
        }

        if (message.toLowerCase().includes('cuộc thi') || message.toLowerCase().includes('thi đấu')) {
            context.techKnowledge = (context.techKnowledge || '') + '\n\n' + CONTEST_PREP_TIPS.join('\n');
        }

        // Get AI response
        const botResponse = await getBotResponse(message, context);

        res.json({
            success: true,
            data: {
                message: botResponse,
                hasContext: !!userId,
                recommendations: {
                    contests: context.recommendedContests || [],
                    courses: context.recommendedCourses || []
                }
            }
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process chatbot message',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * GET /api/chatbot/suggestions
 * Get quick suggestions for user
 */
export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        const suggestions = [
            '🏆 Cuộc thi nào phù hợp với tôi?',
            '💡 Tôi muốn tham gia cuộc thi nhưng chưa biết bắt đầu từ đâu',
            '📚 Làm sao để học lập trình hiệu quả?',
            '🤝 Tìm đồng đội'
        ];

        if (userId) {
            const userContext = await getUserContext(userId);
            if (userContext) {
                if (userContext.interests.length > 0) {
                    suggestions.unshift(`🎯 Xây dựng lộ trình học ${userContext.interests[0]}`);
                }
                if (userContext.profileCompleteness < 100) {
                    suggestions.push('📝 Hoàn thiện profile của tôi');
                }
            }
        }

        res.json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get suggestions'
        });
    }
};

/**
 * GET /api/chatbot/tech-fields
 * Get all tech fields knowledge
 */
export const getTechFields = async (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            data: TECH_FIELDS
        });
    } catch (error) {
        console.error('Get tech fields error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tech fields'
        });
    }
};
