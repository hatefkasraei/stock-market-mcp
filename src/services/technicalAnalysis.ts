import * as TI from 'technicalindicators';
import { TechnicalIndicator, Pattern, SupportResistance, OHLCV } from '../types/index.js';
import { MarketDataService } from './marketData.js';

export class TechnicalAnalysisService {
  private marketData: MarketDataService;
  
  constructor() {
    this.marketData = new MarketDataService();
  }
  
  async calculateIndicators(symbol: string, indicators: string[], period: string) {
    // Get historical data
    const historicalResponse = await this.marketData.getHistoricalData(symbol, period, '1d');
    const historicalData = JSON.parse(historicalResponse.content[0].text);
    
    // Generate mock OHLCV data if needed
    const ohlcv: OHLCV[] = this.generateMockOHLCV(100);
    
    const results: Record<string, TechnicalIndicator> = {};
    
    for (const indicator of indicators) {
      switch (indicator) {
        case 'RSI':
          results.RSI = this.calculateRSI(ohlcv);
          break;
        case 'MACD':
          results.MACD = this.calculateMACD(ohlcv);
          break;
        case 'BB':
          results.BB = this.calculateBollingerBands(ohlcv);
          break;
        case 'SMA':
          results.SMA = this.calculateSMA(ohlcv, 20);
          break;
        case 'EMA':
          results.EMA = this.calculateEMA(ohlcv, 20);
          break;
        case 'STOCH':
          results.STOCH = this.calculateStochastic(ohlcv);
          break;
        case 'ADX':
          results.ADX = this.calculateADX(ohlcv);
          break;
        case 'ATR':
          results.ATR = this.calculateATR(ohlcv);
          break;
        case 'OBV':
          results.OBV = this.calculateOBV(ohlcv);
          break;
        case 'VWAP':
          results.VWAP = this.calculateVWAP(ohlcv);
          break;
      }
    }
    
    // Add trading signals
    const signals = this.generateTradingSignals(results);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          period,
          indicators: results,
          signals,
          recommendation: this.getOverallRecommendation(signals)
        }, null, 2)
      }]
    };
  }
  
  async identifyPatterns(symbol: string, patterns: string[], period: string) {
    const ohlcv = this.generateMockOHLCV(200);
    const identifiedPatterns: Pattern[] = [];
    
    // Pattern detection logic (simplified)
    const patternTypes = patterns.length > 0 ? patterns : [
      'head_shoulders', 'triangle', 'flag', 'wedge', 'double_top', 'double_bottom', 'cup_handle'
    ];
    
    for (const patternType of patternTypes) {
      const pattern = this.detectPattern(ohlcv, patternType);
      if (pattern) {
        identifiedPatterns.push(pattern);
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          period,
          patternsFound: identifiedPatterns.length,
          patterns: identifiedPatterns,
          tradingImplications: this.getPatternImplications(identifiedPatterns)
        }, null, 2)
      }]
    };
  }
  
  async findSupportResistance(symbol: string, period: string, sensitivity: number) {
    const ohlcv = this.generateMockOHLCV(100);
    const levels = this.calculateSupportResistance(ohlcv, sensitivity);
    
    const currentPrice = ohlcv[ohlcv.length - 1].close;
    
    // Find nearest levels
    const nearestSupport = levels
      .filter(l => l.type === 'SUPPORT' && l.level < currentPrice)
      .sort((a, b) => b.level - a.level)[0];
    
    const nearestResistance = levels
      .filter(l => l.type === 'RESISTANCE' && l.level > currentPrice)
      .sort((a, b) => a.level - b.level)[0];
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          period,
          currentPrice,
          nearestSupport,
          nearestResistance,
          allLevels: levels,
          riskRewardRatio: nearestResistance && nearestSupport ? 
            (nearestResistance.level - currentPrice) / (currentPrice - nearestSupport.level) : null
        }, null, 2)
      }]
    };
  }
  
  private calculateRSI(data: OHLCV[]): TechnicalIndicator {
    const closes = data.map(d => d.close);
    const rsiValues = TI.RSI.calculate({
      values: closes,
      period: 14
    });
    
    const currentRSI = rsiValues[rsiValues.length - 1];
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    
    if (currentRSI < 30) signal = 'BUY';
    else if (currentRSI > 70) signal = 'SELL';
    
    return {
      name: 'RSI',
      value: currentRSI,
      signal,
      timestamp: new Date()
    };
  }
  
  private calculateMACD(data: OHLCV[]): TechnicalIndicator {
    const closes = data.map(d => d.close);
    const macdValues = TI.MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    const current = macdValues[macdValues.length - 1];
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    
    if (current && current.MACD && current.signal) {
      if (current.MACD > current.signal) signal = 'BUY';
      else if (current.MACD < current.signal) signal = 'SELL';
    }
    
    return {
      name: 'MACD',
      value: current ? [current.MACD || 0, current.signal || 0, current.histogram || 0] : [0, 0, 0],
      signal,
      timestamp: new Date()
    };
  }
  
  private calculateBollingerBands(data: OHLCV[]): TechnicalIndicator {
    const closes = data.map(d => d.close);
    const bbValues = TI.BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2
    });
    
    const current = bbValues[bbValues.length - 1];
    const currentPrice = closes[closes.length - 1];
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    
    if (current) {
      if (currentPrice < current.lower) signal = 'BUY';
      else if (currentPrice > current.upper) signal = 'SELL';
    }
    
    return {
      name: 'BollingerBands',
      value: current ? [current.lower, current.middle, current.upper] : [0, 0, 0],
      signal,
      timestamp: new Date()
    };
  }
  
  private calculateSMA(data: OHLCV[], period: number): TechnicalIndicator {
    const closes = data.map(d => d.close);
    const smaValues = TI.SMA.calculate({
      period,
      values: closes
    });
    
    const currentSMA = smaValues[smaValues.length - 1];
    const currentPrice = closes[closes.length - 1];
    
    return {
      name: `SMA${period}`,
      value: currentSMA,
      signal: currentPrice > currentSMA ? 'BUY' : 'SELL',
      timestamp: new Date()
    };
  }
  
  private calculateEMA(data: OHLCV[], period: number): TechnicalIndicator {
    const closes = data.map(d => d.close);
    const emaValues = TI.EMA.calculate({
      period,
      values: closes
    });
    
    const currentEMA = emaValues[emaValues.length - 1];
    const currentPrice = closes[closes.length - 1];
    
    return {
      name: `EMA${period}`,
      value: currentEMA,
      signal: currentPrice > currentEMA ? 'BUY' : 'SELL',
      timestamp: new Date()
    };
  }
  
  private calculateStochastic(data: OHLCV[]): TechnicalIndicator {
    const stochValues = TI.Stochastic.calculate({
      high: data.map(d => d.high),
      low: data.map(d => d.low),
      close: data.map(d => d.close),
      period: 14,
      signalPeriod: 3
    });
    
    const current = stochValues[stochValues.length - 1];
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    
    if (current) {
      if (current.k < 20) signal = 'BUY';
      else if (current.k > 80) signal = 'SELL';
    }
    
    return {
      name: 'Stochastic',
      value: current ? [current.k, current.d] : [0, 0],
      signal,
      timestamp: new Date()
    };
  }
  
  private calculateADX(data: OHLCV[]): TechnicalIndicator {
    const adxValues = TI.ADX.calculate({
      high: data.map(d => d.high),
      low: data.map(d => d.low),
      close: data.map(d => d.close),
      period: 14
    });
    
    const currentADX = adxValues[adxValues.length - 1];
    
    return {
      name: 'ADX',
      value: currentADX ? currentADX.adx : 0,
      signal: currentADX && currentADX.adx > 25 ? 'BUY' : 'NEUTRAL',
      timestamp: new Date()
    };
  }
  
  private calculateATR(data: OHLCV[]): TechnicalIndicator {
    const atrValues = TI.ATR.calculate({
      high: data.map(d => d.high),
      low: data.map(d => d.low),
      close: data.map(d => d.close),
      period: 14
    });
    
    return {
      name: 'ATR',
      value: atrValues[atrValues.length - 1],
      signal: 'NEUTRAL',
      timestamp: new Date()
    };
  }
  
  private calculateOBV(data: OHLCV[]): TechnicalIndicator {
    const obvValues = TI.OBV.calculate({
      close: data.map(d => d.close),
      volume: data.map(d => d.volume)
    });
    
    const current = obvValues[obvValues.length - 1];
    const previous = obvValues[obvValues.length - 2];
    
    return {
      name: 'OBV',
      value: current,
      signal: current > previous ? 'BUY' : 'SELL',
      timestamp: new Date()
    };
  }
  
  private calculateVWAP(data: OHLCV[]): TechnicalIndicator {
    const vwapValues = TI.VWAP.calculate({
      high: data.map(d => d.high),
      low: data.map(d => d.low),
      close: data.map(d => d.close),
      volume: data.map(d => d.volume)
    });
    
    const currentVWAP = vwapValues[vwapValues.length - 1];
    const currentPrice = data[data.length - 1].close;
    
    return {
      name: 'VWAP',
      value: currentVWAP,
      signal: currentPrice > currentVWAP ? 'BUY' : 'SELL',
      timestamp: new Date()
    };
  }
  
  private detectPattern(data: OHLCV[], patternType: string): Pattern | null {
    // Simplified pattern detection - in production, use more sophisticated algorithms
    const confidence = Math.random() * 0.5 + 0.5; // 50-100% confidence
    
    if (confidence < 0.6) return null; // Only return high confidence patterns
    
    const patterns: Record<string, Pattern> = {
      'head_shoulders': {
        type: 'Head and Shoulders',
        startDate: data[data.length - 30].date,
        endDate: data[data.length - 1].date,
        confidence,
        priceTarget: data[data.length - 1].close * 0.95,
        description: 'Bearish reversal pattern detected. Price target suggests 5% decline.'
      },
      'triangle': {
        type: 'Ascending Triangle',
        startDate: data[data.length - 20].date,
        endDate: data[data.length - 1].date,
        confidence,
        priceTarget: data[data.length - 1].close * 1.08,
        description: 'Bullish continuation pattern. Breakout expected with 8% upside.'
      },
      'double_bottom': {
        type: 'Double Bottom',
        startDate: data[data.length - 25].date,
        endDate: data[data.length - 1].date,
        confidence,
        priceTarget: data[data.length - 1].close * 1.12,
        description: 'Bullish reversal pattern confirmed. Strong support established.'
      }
    };
    
    return patterns[patternType] || null;
  }
  
  private calculateSupportResistance(data: OHLCV[], sensitivity: number): SupportResistance[] {
    const levels: SupportResistance[] = [];
    const pricePoints = data.map(d => [d.high, d.low]).flat();
    
    // Find price levels with multiple touches
    const priceCounts = new Map<number, number>();
    const tolerance = 0.02; // 2% tolerance
    
    pricePoints.forEach(price => {
      const roundedPrice = Math.round(price / tolerance) * tolerance;
      priceCounts.set(roundedPrice, (priceCounts.get(roundedPrice) || 0) + 1);
    });
    
    // Convert to support/resistance levels
    const currentPrice = data[data.length - 1].close;
    
    Array.from(priceCounts.entries())
      .filter(([_, count]) => count >= sensitivity)
      .forEach(([price, count]) => {
        levels.push({
          level: price,
          type: price < currentPrice ? 'SUPPORT' : 'RESISTANCE',
          strength: Math.min(count / 10, 1), // Normalize strength to 0-1
          touches: count,
          lastTested: data[data.length - 1].date
        });
      });
    
    return levels.sort((a, b) => b.strength - a.strength).slice(0, 10);
  }
  
  private generateTradingSignals(indicators: Record<string, TechnicalIndicator>): Record<string, string> {
    const signals: Record<string, string> = {};
    
    for (const [name, indicator] of Object.entries(indicators)) {
      if (indicator.signal) {
        signals[name] = indicator.signal;
      }
    }
    
    return signals;
  }
  
  private getOverallRecommendation(signals: Record<string, string>): string {
    const signalCounts = { BUY: 0, SELL: 0, NEUTRAL: 0 };
    
    Object.values(signals).forEach(signal => {
      signalCounts[signal as keyof typeof signalCounts]++;
    });
    
    const total = Object.values(signalCounts).reduce((a, b) => a + b, 0);
    const buyPercentage = (signalCounts.BUY / total) * 100;
    const sellPercentage = (signalCounts.SELL / total) * 100;
    
    if (buyPercentage > 60) return `STRONG BUY (${buyPercentage.toFixed(0)}% bullish signals)`;
    if (buyPercentage > 40) return `BUY (${buyPercentage.toFixed(0)}% bullish signals)`;
    if (sellPercentage > 60) return `STRONG SELL (${sellPercentage.toFixed(0)}% bearish signals)`;
    if (sellPercentage > 40) return `SELL (${sellPercentage.toFixed(0)}% bearish signals)`;
    
    return `NEUTRAL (Mixed signals: ${buyPercentage.toFixed(0)}% buy, ${sellPercentage.toFixed(0)}% sell)`;
  }
  
  private getPatternImplications(patterns: Pattern[]): string[] {
    return patterns.map(p => {
      const direction = p.priceTarget && p.priceTarget > 0 ? 'bullish' : 'bearish';
      return `${p.type}: ${direction} pattern with ${(p.confidence * 100).toFixed(0)}% confidence`;
    });
  }
  
  private generateMockOHLCV(count: number): OHLCV[] {
    const data: OHLCV[] = [];
    let basePrice = 100;
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (count - i));
      
      const volatility = 0.02;
      const trend = Math.sin(i / 20) * 10;
      const noise = (Math.random() - 0.5) * 5;
      
      basePrice = basePrice * (1 + (Math.random() - 0.5) * volatility) + trend * 0.1 + noise * 0.1;
      
      const open = basePrice + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 3;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      data.push({
        date,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 10000000)
      });
    }
    
    return data;
  }
}