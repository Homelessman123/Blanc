export const generateBlogIdeas = async (topic: string): Promise<string[]> => {
  const safeTopic = topic || 'Contest content';
  return [
    `Cập nhật nổi bật: ${safeTopic}`,
    `Lịch diễn ra ${safeTopic}`,
    `Kinh nghiệm tham gia ${safeTopic}`,
    `FAQ nhanh về ${safeTopic}`,
    `Thông báo quan trọng: ${safeTopic}`,
  ];
};

export const improveText = async (text: string): Promise<string> => {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length < 6) return trimmed;
  return `${trimmed} - updated`;
};

export const generateSummary = async (content: string): Promise<string> => {
  if (!content) return '';
  const clean = content.replace(/\s+/g, ' ').trim();
  return clean.length > 140 ? `${clean.slice(0, 137)}...` : clean;
};
