export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  timestamp: Date;
}

export interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface MarketDepth {
  symbol: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  timestamp: Date;
}

export interface TechnicalIndicator {
  name: string;
  value: number | number[];
  signal?: 'BUY' | 'SELL' | 'NEUTRAL';
  timestamp: Date;
}

export interface Pattern {
  type: string;
  startDate: Date;
  endDate: Date;
  confidence: number;
  priceTarget?: number;
  description: string;
}

export interface SupportResistance {
  level: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;
  touches: number;
  lastTested: Date;
}

export interface OptionContract {
  symbol: string;
  strike: number;
  expiration: Date;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
}

export interface FinancialStatement {
  period: string;
  date: Date;
  revenue?: number;
  netIncome?: number;
  eps?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  cashFlow?: number;
  freeCashFlow?: number;
}

export interface AnalystRating {
  firm: string;
  analyst?: string;
  rating: 'BUY' | 'HOLD' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  priceTarget: number;
  date: Date;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment: number; // -1 to 1
  relevance: number; // 0 to 1
  tickers: string[];
}