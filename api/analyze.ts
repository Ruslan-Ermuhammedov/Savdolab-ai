import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

function getTargetLanguage(lang = 'UZ') {
  if (lang === 'RU') return 'Russian';
  if (lang === 'EN') return 'English';
  return 'Uzbek';
}

function getAnalyzeConfig(mode: string, text: string, targetLangStr: string) {
  switch (mode) {
    case 'trending-products':
      return {
        systemPrompt: `Find the top trending products right now based on the user's category or interest: "${text}". Analyze marketplace, social media, and search signals. Return the top products with growth metrics. Provide response in ${targetLangStr}.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryAnalyzed: { type: Type.STRING },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  trendScore: { type: Type.NUMBER, description: '0-100' },
                  growthRate: { type: Type.STRING },
                  competitionLevel: { type: Type.STRING },
                  estimatedMargin: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  isPromising: { type: Type.BOOLEAN },
                  trendData: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        month: { type: Type.STRING },
                        popularity: { type: Type.NUMBER },
                      },
                    },
                  },
                },
              },
            },
          },
          required: ['categoryAnalyzed', 'products'],
        },
      };
    case 'competitor-spy':
      return {
        systemPrompt: `Analyze the competitor store or brand provided by the user: "${text}". Identify their top products, business model, marketing strategy, brand positioning, weaknesses, and growth opportunities for competing against them. Provide response in ${targetLangStr}.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING },
            topProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            businessModel: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['storeName', 'topProducts', 'businessModel', 'targetAudience', 'weaknesses', 'growthOpportunities'],
        },
      };
    case 'ad-analyzer':
      return {
        systemPrompt: `Analyze the ad text, image, or concept provided: "${text}". Evaluate its hook, offer, CTA, emotional triggers, and target audience. Give scores and suggest better new ad variants. Provide response in ${targetLangStr}.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hookScore: { type: Type.NUMBER, description: '0-100' },
            creativityScore: { type: Type.NUMBER, description: '0-100' },
            conversionScore: { type: Type.NUMBER, description: '0-100' },
            trustScore: { type: Type.NUMBER, description: '0-100' },
            hookAnalysis: { type: Type.STRING },
            offerAnalysis: { type: Type.STRING },
            ctaAnalysis: { type: Type.STRING },
            emotionTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetAudience: { type: Type.STRING },
            newAdVariants: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['hookScore', 'creativityScore', 'conversionScore', 'trustScore', 'hookAnalysis', 'offerAnalysis', 'ctaAnalysis', 'emotionTriggers', 'targetAudience', 'newAdVariants'],
        },
      };
    case 'winning-product':
    default:
      return {
        systemPrompt: `Analyze the product based on the prompt or image: "${text || 'See attached image'}". Identify its category, target audience, problem solved, and calculate viability scores. Evaluate its TikTok and FB Ads potential, saturation level, and provide a final recommendation (SELL, TEST, AVOID) with reasons. Provide response in ${targetLangStr}.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            category: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            problemSolved: { type: Type.STRING },
            trendScore: { type: Type.NUMBER, description: '0-100' },
            demandScore: { type: Type.NUMBER, description: '0-100' },
            competitionScore: { type: Type.NUMBER, description: '0-100' },
            profitScore: { type: Type.NUMBER, description: '0-100' },
            recommendation: { type: Type.STRING, enum: ['SELL', 'TEST', 'AVOID'] },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            tiktokPotential: { type: Type.STRING },
            fbAdsPotential: { type: Type.STRING },
            saturationLevel: { type: Type.STRING },
            trendData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  popularity: { type: Type.NUMBER },
                },
              },
            },
            marketPriceRange: { type: Type.STRING },
          },
          required: ['productName', 'category', 'targetAudience', 'problemSolved', 'trendScore', 'demandScore', 'competitionScore', 'profitScore', 'recommendation', 'reasons', 'tiktokPotential', 'fbAdsPotential', 'saturationLevel', 'marketPriceRange'],
        },
      };
  }
}

async function getRequestBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server configuration error: GEMINI_API_KEY environment variable is not defined. Iltimos Vercel Environment Variables ichida GEMINI_API_KEY ni o'rnating.",
    });
  }

  try {
    const { text = '', image, lang = 'UZ', mode = 'winning-product' } = await getRequestBody(req);

    if (!text && !image) {
      return res.status(400).json({ error: 'Please provide text or an image.' });
    }

    const targetLangStr = getTargetLanguage(lang);
    const { systemPrompt, responseSchema } = getAnalyzeConfig(mode, text, targetLangStr);
    const parts: any[] = [];

    if (image?.data && image?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    parts.push({ text: systemPrompt });

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = Array.from(new Set(chunks.map((chunk: any) => chunk?.web?.uri).filter(Boolean)));
    let parsedData = {};

    try {
      parsedData = JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('Failed to parse JSON response model:', error);
    }

    return res.status(200).json({
      mode,
      data: parsedData,
      sources,
    });
  } catch (error: any) {
    console.error('Error analyzing product:', error);

    let errorMessage = error.message || 'Internal server error';
    if (typeof errorMessage === 'string' && (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED'))) {
      errorMessage = "API so'rovlar chegarasiga yetildi (Rate Limit 429). Iltimos, bir oz kuting yoki boshqa API kalitdan foydalaning.";
    }

    return res.status(500).json({ error: errorMessage });
  }
}
