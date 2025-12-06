import { GoogleGenAI } from "@google/genai";

// Curated list of traditional 4-character phrasing blessings (2 lines)
const BLESSINGS = [
  "新春大吉\n万事如意",
  "龙马精神\n身体健康",
  "岁岁平安\n年年有余",
  "阖家欢乐\n喜气洋洋",
  "财源广进\n恭喜发财",
  "吉星高照\n福满人间",
  "花开富贵\n竹报平安",
  "大展宏图\n前程似锦",
  "五福临门\n心想事成",
  "迎春接福\n吉祥如意",
  "瑞雪兆丰年\n红梅报新春",
  "辞旧迎新岁\n举杯庆团圆",
  "福气东来\n鸿运当头",
  "一帆风顺\n二龙腾飞"
];

// Keep the client initialization in case we add other AI features later
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // console.warn("Gemini API Key is missing.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateCNYBlessing = async (): Promise<string> => {
  // Simulate a short delay for "processing" feel
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Randomly select from the curated list
  const randomIndex = Math.floor(Math.random() * BLESSINGS.length);
  return BLESSINGS[randomIndex];
};
