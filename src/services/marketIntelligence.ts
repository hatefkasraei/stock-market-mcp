import { NewsItem } from '../types/index.js';
import { subDays, format } from 'date-fns';

export class MarketIntelligenceService {
  
  async getNewsSentiment(symbol: string, days: number, minRelevance: number) {
    const news = this.generateNewsItems(symbol, days);
    const filteredNews = news.filter(n => n.relevance >= minRelevance);
    
    // Calculate aggregate sentiment
    const totalSentiment = filteredNews.reduce((sum, n) => sum + n.sentiment * n.relevance, 0);
    const totalRelevance = filteredNews.reduce((sum, n) => sum + n.relevance, 0);
    const avgSentiment = totalRelevance > 0 ? totalSentiment / totalRelevance : 0;
    
    // Group by sentiment
    const positive = filteredNews.filter(n => n.sentiment > 0.2);
    const negative = filteredNews.filter(n => n.sentiment < -0.2);
    const neutral = filteredNews.filter(n => n.sentiment >= -0.2 && n.sentiment <= 0.2);
    
    // Identify key themes
    const themes = this.extractThemes(filteredNews);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          period: `${days} days`,
          totalArticles: filteredNews.length,
          sentimentScore: avgSentiment.toFixed(3),
          sentimentLabel: this.getSentimentLabel(avgSentiment),
          distribution: {
            positive: positive.length,
            negative: negative.length,
            neutral: neutral.length
          },
          keyThemes: themes,
          topNews: filteredNews.slice(0, 10),
          sentimentTrend: this.calculateSentimentTrend(filteredNews),
          tradingImplication: this.getSentimentTradingSignal(avgSentiment, filteredNews.length)
        }, null, 2)
      }]
    };
  }
  
  async getSocialSentiment(symbol: string, sources: string[]) {
    const includeSources = sources.includes('all') ? 
      ['reddit', 'twitter', 'stocktwits'] : sources;
    
    const socialData: Record<string, any> = {};
    
    for (const source of includeSources) {
      socialData[source] = this.generateSocialData(symbol, source);
    }
    
    // Calculate combined metrics
    const combinedSentiment = Object.values(socialData)
      .reduce((sum, data) => sum + data.sentiment, 0) / includeSources.length;
    
    const totalMentions = Object.values(socialData)
      .reduce((sum, data) => sum + data.mentions, 0);
    
    const momentum = this.calculateSocialMomentum(socialData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          sources: includeSources,
          aggregateSentiment: combinedSentiment.toFixed(3),
          sentimentLabel: this.getSentimentLabel(combinedSentiment),
          totalMentions,
          momentum,
          platforms: socialData,
          tradingSignal: this.getSocialTradingSignal(combinedSentiment, momentum, totalMentions),
          unusualActivity: this.detectUnusualSocialActivity(socialData),
          topicsDiscussed: this.getTopDiscussionTopics(symbol)
        }, null, 2)
      }]
    };
  }
  
  async getSectorPerformance(period: string) {
    const sectors = [
      'Technology', 'Healthcare', 'Financial', 'Consumer Discretionary',
      'Consumer Staples', 'Energy', 'Materials', 'Industrials',
      'Real Estate', 'Utilities', 'Communication Services'
    ];
    
    const performance = sectors.map(sector => {
      const basePerformance = (Math.random() - 0.5) * 10;
      const volume = Math.floor(Math.random() * 1000000000);
      
      return {
        sector,
        performance: basePerformance,
        volume,
        topGainers: this.generateTopMovers(sector, 'gainers'),
        topLosers: this.generateTopMovers(sector, 'losers'),
        momentum: Math.random() - 0.5,
        relativeStrength: 50 + (Math.random() - 0.5) * 40
      };
    });
    
    // Sort by performance
    performance.sort((a, b) => b.performance - a.performance);
    
    // Identify rotation
    const rotation = this.identifySectorRotation(performance);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          period,
          timestamp: new Date().toISOString(),
          leaders: performance.slice(0, 3),
          laggards: performance.slice(-3),
          rotation,
          marketBreadth: {
            advancingSectors: performance.filter(s => s.performance > 0).length,
            decliningSectors: performance.filter(s => s.performance < 0).length,
            averagePerformance: (performance.reduce((sum, s) => sum + s.performance, 0) / sectors.length).toFixed(2)
          },
          recommendation: this.getSectorRecommendation(rotation, performance)
        }, null, 2)
      }]
    };
  }
  
  async getMarketBreadth(indicators: string[]) {
    const breadthData: Record<string, any> = {};
    
    for (const indicator of indicators) {
      switch (indicator) {
        case 'advance_decline':
          breadthData.advanceDecline = this.calculateAdvanceDecline();
          break;
        case 'new_highs_lows':
          breadthData.newHighsLows = this.calculateNewHighsLows();
          break;
        case 'mcclellan':
          breadthData.mcclellan = this.calculateMcClellan();
          break;
        case 'put_call_ratio':
          breadthData.putCallRatio = this.calculatePutCallRatio();
          break;
      }
    }
    
    // Generate market health score
    const healthScore = this.calculateMarketHealth(breadthData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          timestamp: new Date().toISOString(),
          indicators: breadthData,
          marketHealth: {
            score: healthScore,
            label: this.getHealthLabel(healthScore),
            trend: this.getMarketTrend(breadthData)
          },
          signals: this.generateBreadthSignals(breadthData),
          recommendation: this.getBreadthRecommendation(healthScore, breadthData)
        }, null, 2)
      }]
    };
  }
  
  private generateNewsItems(symbol: string, days: number): NewsItem[] {
    const news: NewsItem[] = [];
    const sources = ['Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'MarketWatch', 'Seeking Alpha'];
    const newsCount = Math.floor(Math.random() * 20) + 10;
    
    for (let i = 0; i < newsCount; i++) {
      const daysAgo = Math.random() * days;
      const sentiment = (Math.random() - 0.5) * 2; // -1 to 1
      const relevance = 0.5 + Math.random() * 0.5; // 0.5 to 1
      
      news.push({
        title: this.generateNewsTitle(symbol, sentiment),
        summary: this.generateNewsSummary(symbol, sentiment),
        url: `https://example.com/news/${Math.random().toString(36).substring(7)}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        publishedAt: subDays(new Date(), daysAgo),
        sentiment,
        relevance,
        tickers: [symbol, ...this.getRelatedTickers(symbol)]
      });
    }
    
    return news.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
  
  private generateNewsTitle(symbol: string, sentiment: number): string {
    const positive = [
      `${symbol} Surges on Strong Earnings Beat`,
      `Analysts Upgrade ${symbol} to Buy`,
      `${symbol} Announces Major Partnership Deal`,
      `Breaking: ${symbol} Revenue Exceeds Expectations`
    ];
    
    const negative = [
      `${symbol} Falls on Weak Guidance`,
      `Concerns Mount Over ${symbol} Growth Prospects`,
      `${symbol} Faces Regulatory Headwinds`,
      `Analysts Downgrade ${symbol} Following Results`
    ];
    
    const neutral = [
      `${symbol} Trading Steady Ahead of Earnings`,
      `Market Watch: ${symbol} in Focus`,
      `${symbol} Announces Executive Changes`,
      `Trading Update: ${symbol} Volume Increases`
    ];
    
    if (sentiment > 0.3) return positive[Math.floor(Math.random() * positive.length)];
    if (sentiment < -0.3) return negative[Math.floor(Math.random() * negative.length)];
    return neutral[Math.floor(Math.random() * neutral.length)];
  }
  
  private generateNewsSummary(symbol: string, sentiment: number): string {
    if (sentiment > 0.3) {
      return `Positive developments for ${symbol} as the company shows strong momentum in key markets. Investors are optimistic about future growth prospects.`;
    }
    if (sentiment < -0.3) {
      return `${symbol} faces challenges as market conditions deteriorate. Analysts express concerns about near-term performance.`;
    }
    return `${symbol} continues to navigate market conditions with mixed signals from various business segments.`;
  }
  
  private generateSocialData(symbol: string, source: string): any {
    const baseSentiment = (Math.random() - 0.5) * 2;
    const mentions = Math.floor(Math.random() * 10000);
    
    return {
      sentiment: baseSentiment,
      mentions,
      trending: Math.random() > 0.7,
      volumeChange24h: (Math.random() - 0.5) * 100,
      topPosts: this.generateTopPosts(symbol, source),
      influencerSentiment: baseSentiment + (Math.random() - 0.5) * 0.3,
      retailSentiment: baseSentiment + (Math.random() - 0.5) * 0.5
    };
  }
  
  private generateTopPosts(symbol: string, source: string): any[] {
    const posts = [];
    for (let i = 0; i < 3; i++) {
      posts.push({
        author: `User${Math.floor(Math.random() * 1000)}`,
        content: `Discussion about ${symbol} on ${source}`,
        likes: Math.floor(Math.random() * 1000),
        sentiment: (Math.random() - 0.5) * 2,
        timestamp: subDays(new Date(), Math.random() * 7)
      });
    }
    return posts;
  }
  
  private generateTopMovers(sector: string, type: string): any[] {
    const movers = [];
    for (let i = 0; i < 3; i++) {
      const change = type === 'gainers' ? 
        Math.random() * 10 + 2 : 
        -(Math.random() * 10 + 2);
      
      movers.push({
        symbol: `${sector.substring(0, 3).toUpperCase()}${i}`,
        change: change.toFixed(2),
        volume: Math.floor(Math.random() * 10000000)
      });
    }
    return movers;
  }
  
  private calculateAdvanceDecline(): any {
    const advancing = Math.floor(Math.random() * 2000) + 500;
    const declining = Math.floor(Math.random() * 2000) + 500;
    const unchanged = Math.floor(Math.random() * 200);
    
    return {
      advancing,
      declining,
      unchanged,
      ratio: (advancing / declining).toFixed(2),
      line: advancing - declining,
      signal: advancing > declining * 1.5 ? 'BULLISH' : 
              declining > advancing * 1.5 ? 'BEARISH' : 'NEUTRAL'
    };
  }
  
  private calculateNewHighsLows(): any {
    const newHighs = Math.floor(Math.random() * 300);
    const newLows = Math.floor(Math.random() * 300);
    
    return {
      newHighs,
      newLows,
      ratio: newLows > 0 ? (newHighs / newLows).toFixed(2) : 'N/A',
      net: newHighs - newLows,
      signal: newHighs > newLows * 2 ? 'BULLISH' :
              newLows > newHighs * 2 ? 'BEARISH' : 'NEUTRAL'
    };
  }
  
  private calculateMcClellan(): any {
    const value = (Math.random() - 0.5) * 200;
    
    return {
      value: value.toFixed(2),
      signal: value > 50 ? 'OVERBOUGHT' :
              value < -50 ? 'OVERSOLD' : 'NEUTRAL',
      trend: Math.random() > 0.5 ? 'IMPROVING' : 'DETERIORATING'
    };
  }
  
  private calculatePutCallRatio(): any {
    const ratio = 0.7 + Math.random() * 0.8;
    
    return {
      value: ratio.toFixed(3),
      signal: ratio > 1.2 ? 'EXTREME_FEAR' :
              ratio < 0.7 ? 'EXTREME_GREED' :
              ratio > 1.0 ? 'FEAR' :
              ratio < 0.9 ? 'GREED' : 'NEUTRAL',
      percentile: Math.floor(Math.random() * 100)
    };
  }
  
  private extractThemes(news: NewsItem[]): string[] {
    const themes = [
      'Earnings Performance',
      'Product Launch',
      'Market Share',
      'Regulatory Updates',
      'Strategic Partnership',
      'Technology Innovation'
    ];
    
    return themes.slice(0, Math.floor(Math.random() * 3) + 2);
  }
  
  private calculateSentimentTrend(news: NewsItem[]): string {
    if (news.length < 2) return 'INSUFFICIENT_DATA';
    
    const recent = news.slice(0, Math.floor(news.length / 2));
    const older = news.slice(Math.floor(news.length / 2));
    
    const recentAvg = recent.reduce((sum, n) => sum + n.sentiment, 0) / recent.length;
    const olderAvg = older.reduce((sum, n) => sum + n.sentiment, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.2) return 'IMPROVING';
    if (recentAvg < olderAvg - 0.2) return 'DETERIORATING';
    return 'STABLE';
  }
  
  private calculateSocialMomentum(data: Record<string, any>): string {
    const totalChange = Object.values(data)
      .reduce((sum, d) => sum + d.volumeChange24h, 0) / Object.keys(data).length;
    
    if (totalChange > 50) return 'SURGING';
    if (totalChange > 20) return 'INCREASING';
    if (totalChange < -50) return 'PLUMMETING';
    if (totalChange < -20) return 'DECREASING';
    return 'STABLE';
  }
  
  private detectUnusualSocialActivity(data: Record<string, any>): any[] {
    const unusual = [];
    
    for (const [platform, metrics] of Object.entries(data)) {
      if (metrics.volumeChange24h > 75) {
        unusual.push({
          platform,
          type: 'VOLUME_SPIKE',
          change: `+${metrics.volumeChange24h.toFixed(0)}%`,
          significance: 'HIGH'
        });
      }
      if (metrics.trending) {
        unusual.push({
          platform,
          type: 'TRENDING',
          rank: Math.floor(Math.random() * 10) + 1,
          significance: 'MEDIUM'
        });
      }
    }
    
    return unusual;
  }
  
  private getTopDiscussionTopics(symbol: string): string[] {
    const topics = [
      'Earnings expectations',
      'Technical breakout',
      'Short squeeze potential',
      'New product rumors',
      'Competitor comparison',
      'Management changes'
    ];
    
    return topics.slice(0, Math.floor(Math.random() * 3) + 2);
  }
  
  private identifySectorRotation(performance: any[]): any {
    const defensive = ['Consumer Staples', 'Utilities', 'Healthcare'];
    const cyclical = ['Technology', 'Consumer Discretionary', 'Financial'];
    
    const defensiveAvg = performance
      .filter(s => defensive.includes(s.sector))
      .reduce((sum, s) => sum + s.performance, 0) / defensive.length;
    
    const cyclicalAvg = performance
      .filter(s => cyclical.includes(s.sector))
      .reduce((sum, s) => sum + s.performance, 0) / cyclical.length;
    
    return {
      current: cyclicalAvg > defensiveAvg ? 'RISK_ON' : 'RISK_OFF',
      defensiveStrength: defensiveAvg.toFixed(2),
      cyclicalStrength: cyclicalAvg.toFixed(2),
      recommendation: cyclicalAvg > defensiveAvg ? 
        'Favor growth and cyclical sectors' : 
        'Rotate to defensive sectors for safety'
    };
  }
  
  private calculateMarketHealth(data: Record<string, any>): number {
    let score = 50; // Start neutral
    
    if (data.advanceDecline?.advancing > data.advanceDecline?.declining) score += 15;
    if (data.newHighsLows?.newHighs > data.newHighsLows?.newLows) score += 15;
    if (data.mcclellan?.value > 0) score += 10;
    if (data.putCallRatio?.value < 1.0) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private getSentimentLabel(sentiment: number): string {
    if (sentiment > 0.5) return 'VERY_BULLISH';
    if (sentiment > 0.2) return 'BULLISH';
    if (sentiment < -0.5) return 'VERY_BEARISH';
    if (sentiment < -0.2) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  private getHealthLabel(score: number): string {
    if (score > 80) return 'VERY_HEALTHY';
    if (score > 60) return 'HEALTHY';
    if (score > 40) return 'NEUTRAL';
    if (score > 20) return 'UNHEALTHY';
    return 'VERY_UNHEALTHY';
  }
  
  private getMarketTrend(data: Record<string, any>): string {
    const bullishSignals = Object.values(data)
      .filter((d: any) => d.signal === 'BULLISH').length;
    const bearishSignals = Object.values(data)
      .filter((d: any) => d.signal === 'BEARISH').length;
    
    if (bullishSignals > bearishSignals * 2) return 'STRONG_UPTREND';
    if (bullishSignals > bearishSignals) return 'UPTREND';
    if (bearishSignals > bullishSignals * 2) return 'STRONG_DOWNTREND';
    if (bearishSignals > bullishSignals) return 'DOWNTREND';
    return 'SIDEWAYS';
  }
  
  private generateBreadthSignals(data: Record<string, any>): string[] {
    const signals = [];
    
    if (data.advanceDecline?.signal === 'BULLISH') {
      signals.push('Broad market participation in rally');
    }
    if (data.newHighsLows?.signal === 'BEARISH') {
      signals.push('Increasing number of stocks making new lows');
    }
    if (data.mcclellan?.signal === 'OVERSOLD') {
      signals.push('Market may be due for a bounce');
    }
    if (data.putCallRatio?.signal === 'EXTREME_FEAR') {
      signals.push('Contrarian buy signal from extreme put buying');
    }
    
    return signals;
  }
  
  private getSentimentTradingSignal(sentiment: number, articleCount: number): string {
    if (articleCount < 5) return 'Insufficient news data for signal';
    
    if (sentiment > 0.5) return 'Strong positive sentiment - potential momentum play';
    if (sentiment > 0.2) return 'Positive sentiment - consider long positions';
    if (sentiment < -0.5) return 'Extreme negative sentiment - potential contrarian opportunity';
    if (sentiment < -0.2) return 'Negative sentiment - exercise caution';
    return 'Neutral sentiment - no clear directional bias';
  }
  
  private getSocialTradingSignal(sentiment: number, momentum: string, mentions: number): string {
    if (mentions < 100) return 'Low social activity - limited signal';
    
    if (sentiment > 0.5 && momentum === 'SURGING') {
      return 'Strong bullish social momentum - potential breakout';
    }
    if (sentiment < -0.5 && momentum === 'PLUMMETING') {
      return 'Extreme bearish sentiment - possible oversold';
    }
    if (momentum === 'SURGING') {
      return 'Unusual social activity detected - monitor closely';
    }
    return 'Normal social activity levels';
  }
  
  private getSectorRecommendation(rotation: any, performance: any[]): string {
    if (rotation.current === 'RISK_ON') {
      const topSector = performance[0];
      return `Risk-on environment. Consider ${topSector.sector} sector (${topSector.performance.toFixed(2)}% gain)`;
    } else {
      return 'Risk-off environment. Consider defensive sectors and quality stocks';
    }
  }
  
  private getBreadthRecommendation(healthScore: number, data: Record<string, any>): string {
    if (healthScore > 70) {
      return 'Market internals strong - favorable for long positions';
    }
    if (healthScore < 30) {
      return 'Market internals weak - consider defensive positioning';
    }
    return 'Mixed market signals - maintain balanced approach';
  }
  
  private getRelatedTickers(symbol: string): string[] {
    const related = ['SPY', 'QQQ', 'IWM'];
    return related.slice(0, Math.floor(Math.random() * 2) + 1);
  }
}