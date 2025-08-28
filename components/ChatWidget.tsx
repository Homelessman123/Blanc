
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { getBotResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'bot', text: 'Hello! I am ContestBot. How can I help you today?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        const botResponseText = await getBotResponse(userInput);
        const newBotMessage: ChatMessage = { sender: 'bot', text: botResponseText };
        setMessages(prev => [...prev, newBotMessage]);
        setIsLoading(false);
    };

    return (
        <>
            <div className="fixed bottom-5 right-5 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
                    aria-label="Open chat"
                >
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                </button>
            </div>
            {isOpen && (
                <div className="fixed bottom-20 right-5 w-80 h-[28rem] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right animate-fade-in-up">
                    <div className="p-4 bg-gray-900/50 rounded-t-lg">
                        <h3 className="font-bold text-white text-lg">ContestHub Support</h3>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex justify-start">
                                 <div className="bg-gray-700 text-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                     <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse delay-75"></span>
                                     <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse delay-150"></span>
                                     <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse delay-300"></span>
                                 </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask something..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-blue-600 rounded-full p-3 text-white hover:bg-blue-700 disabled:bg-gray-500" disabled={isLoading}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
