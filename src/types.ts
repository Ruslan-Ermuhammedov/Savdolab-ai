export type AppMode = 'winning-product' | 'trending-products' | 'competitor-spy' | 'ad-analyzer';

export interface WinningProductData {
  productName: string;
  category: string;
  targetAudience: string;
  problemSolved: string;
  trendScore: number;
  demandScore: number;
  competitionScore: number;
  profitScore: number;
  recommendation: 'SELL' | 'TEST' | 'AVOID';
  reasons: string[];
  tiktokPotential: string;
  fbAdsPotential: string;
  saturationLevel: string;
  trendData?: { month: string; popularity: number }[];
  marketPriceRange: string;
}

export interface TrendingProduct {
  name: string;
  trendScore: number;
  growthRate: string;
  competitionLevel: string;
  estimatedMargin: string;
  targetAudience: string;
  isPromising: boolean;
  trendData?: { month: string; popularity: number }[];
}

export interface TrendingProductsData {
  categoryAnalyzed: string;
  products: TrendingProduct[];
}

export interface CompetitorSpyData {
  storeName: string;
  topProducts: string[];
  businessModel: string;
  targetAudience: string;
  weaknesses: string[];
  growthOpportunities: string[];
}

export interface AdAnalyzerData {
  hookScore: number;
  creativityScore: number;
  conversionScore: number;
  trustScore: number;
  hookAnalysis: string;
  offerAnalysis: string;
  ctaAnalysis: string;
  emotionTriggers: string[];
  targetAudience: string;
  newAdVariants: string[];
}

export interface AnalysisResponse {
  mode: AppMode;
  data: any;
  sources: string[];
}
