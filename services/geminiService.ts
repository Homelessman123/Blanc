
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API will not be available.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const chatConfig = {
  systemInstruction: `You are "ContestBot", a friendly and helpful customer support agent for ContestHub. 
  ContestHub is a platform for students to find and join academic and extracurricular contests. 
  They can also buy courses and materials. Your role is to answer questions about the platform, 
  help users find contests, and explain how features work. 
  Keep your answers concise, friendly, and encouraging.
  If you don't know an answer, say "I'm not sure about that, but you can contact our human support team at support@contesthub.com".`,
};


export const getBotResponse = async (message: string): Promise<string> => {
    if (!API_KEY) {
        return "I'm sorry, my connection to the AI service is currently unavailable. Please try again later.";
    }
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: message,
            config: chatConfig,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error fetching bot response:", error);
        return "I'm having a little trouble thinking right now. Please try asking again in a moment.";
    }
};
