import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON and urlencoded data
  // Increased limit for base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.post('/api/analyze', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Server configuration error: GEMINI_API_KEY environment variable is not defined. Iltimos serverda GEMINI_API_KEY ni o'rnating."
      });
    }

    try {
      const { text, image, lang = 'UZ', mode = 'winning-product' } = req.body;

      if (!text && !image) {
        return res.status(400).json({ error: 'Please provide text or an image.' });
      }

      let targetLangStr = 'Uzbek';
      if (lang === 'RU') targetLangStr = 'Russian';
      else if (lang === 'EN') targetLangStr = 'English';

      const parts: any[] = [];
      if (image && image.data && image.mimeType) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        });
      }

      let responseSchema: any = {};
      let systemPrompt = '';

      switch (mode) {
        case 'trending-products':
          systemPrompt = `Find the top trending products right now based on the user's category or interest: "${text}". Analyze marketplace, social media, and search signals. Return the top products with growth metrics. Provide response in ${targetLangStr}.`;
          responseSchema = {
            type: Type.OBJECT,
            properties: {
              categoryAnalyzed: { type: Type.STRING },
              products: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    trendScore: { type: Type.NUMBER, description: "0-100" },
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
                          popularity: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["categoryAnalyzed", "products"]
          };
          break;
        case 'competitor-spy':
          systemPrompt = `Analyze the competitor store or brand provided by the user: "${text}". Identify their top products, business model, marketing strategy, brand positioning, weaknesses, and growth opportunities for competing against them. Provide response in ${targetLangStr}.`;
          responseSchema = {
            type: Type.OBJECT,
            properties: {
              storeName: { type: Type.STRING },
              topProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
              businessModel: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              growthOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["storeName", "topProducts", "businessModel", "targetAudience", "weaknesses", "growthOpportunities"]
          };
          break;
        case 'ad-analyzer':
          systemPrompt = `Analyze the ad text, image, or concept provided: "${text}". Evaluate its hook, offer, CTA, emotional triggers, and target audience. Give scores and suggest better new ad variants. Provide response in ${targetLangStr}.`;
          responseSchema = {
            type: Type.OBJECT,
            properties: {
              hookScore: { type: Type.NUMBER, description: "0-100" },
              creativityScore: { type: Type.NUMBER, description: "0-100" },
              conversionScore: { type: Type.NUMBER, description: "0-100" },
              trustScore: { type: Type.NUMBER, description: "0-100" },
              hookAnalysis: { type: Type.STRING },
              offerAnalysis: { type: Type.STRING },
              ctaAnalysis: { type: Type.STRING },
              emotionTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetAudience: { type: Type.STRING },
              newAdVariants: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["hookScore", "creativityScore", "conversionScore", "trustScore", "hookAnalysis", "offerAnalysis", "ctaAnalysis", "emotionTriggers", "targetAudience", "newAdVariants"]
          };
          break;
        case 'winning-product':
        default:
          systemPrompt = `Analyze the product based on the prompt or image: "${text || 'See attached image'}". Identify its category, target audience, problem solved, and calculate viability scores. Evaluate its TikTok and FB Ads potential, saturation level, and provide a final recommendation (SELL, TEST, AVOID) with reasons. Provide response in ${targetLangStr}.`;
          responseSchema = {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              category: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              problemSolved: { type: Type.STRING },
              trendScore: { type: Type.NUMBER, description: "0-100" },
              demandScore: { type: Type.NUMBER, description: "0-100" },
              competitionScore: { type: Type.NUMBER, description: "0-100" },
              profitScore: { type: Type.NUMBER, description: "0-100" },
              recommendation: { type: Type.STRING, enum: ["SELL", "TEST", "AVOID"] },
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
                    popularity: { type: Type.NUMBER }
                  }
                }
              },
              marketPriceRange: { type: Type.STRING }
            },
            required: ["productName", "category", "targetAudience", "problemSolved", "trendScore", "demandScore", "competitionScore", "profitScore", "recommendation", "reasons", "tiktokPotential", "fbAdsPotential", "saturationLevel", "marketPriceRange"]
          };
          break;
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
          responseSchema
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = Array.from(new Set(chunks.map((c: any) => c?.web?.uri).filter(Boolean)));

      let parsedData = {};
      try {
        parsedData = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error("Failed to parse JSON response model:", e);
      }

      res.json({
        mode,
        data: parsedData,
        sources
      });
    } catch (error: any) {
      console.error('Error analyzing product:', error);
      let errorMessage = error.message || 'Internal server error';
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        errorMessage = "Tarif rejangizdagi so'rovlar limiti tugadi (API 429). Iltimos, keyinroq urining yoki tizim sozlamalaridan API kalitni almashtiring.";
      }
      res.status(500).json({ error: errorMessage });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4 in the project we use '*'
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
