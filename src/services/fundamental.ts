import { FinancialStatement, AnalystRating } from '../types/index.js';
import { subQuarters, subYears, subDays, format } from 'date-fns';

export class FundamentalService {
  
  async getFinancials(symbol: string, statement: string, period: string) {
    const statements = statement === 'all' ? 
      ['income', 'balance', 'cash_flow'] : [statement];
    
    const results: Record<string, FinancialStatement[]> = {};
    
    for (const stmt of statements) {
      results[stmt] = this.generateFinancialStatements(symbol, stmt, period);
    }
    
    // Calculate key metrics
    const latestIncome = results.income?.[0];
    const latestBalance = results.balance?.[0];
    const latestCashFlow = results.cash_flow?.[0];
    
    const metrics = {
      profitMargin: latestIncome ? (latestIncome.netIncome! / latestIncome.revenue!) * 100 : 0,
      roe: latestIncome && latestBalance ? 
        (latestIncome.netIncome! / (latestBalance.totalAssets! - latestBalance.totalLiabilities!)) * 100 : 0,
      debtToEquity: latestBalance ? 
        latestBalance.totalLiabilities! / (latestBalance.totalAssets! - latestBalance.totalLiabilities!) : 0,
      fcfYield: latestCashFlow ? latestCashFlow.freeCashFlow! / 1000000 : 0,
      revenueGrowth: this.calculateGrowthRate(results.income?.map(s => s.revenue!) || []),
      epsGrowth: this.calculateGrowthRate(results.income?.map(s => s.eps!) || [])
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          period,
          statements: results,
          keyMetrics: {
            profitMargin: `${metrics.profitMargin.toFixed(2)}%`,
            returnOnEquity: `${metrics.roe.toFixed(2)}%`,
            debtToEquity: metrics.debtToEquity.toFixed(2),
            freeCashFlowYield: `$${metrics.fcfYield.toFixed(2)}M`,
            revenueGrowth: `${metrics.revenueGrowth.toFixed(2)}%`,
            epsGrowth: `${metrics.epsGrowth.toFixed(2)}%`
          },
          analysis: this.analyzeFinancials(metrics)
        }, null, 2)
      }]
    };
  }
  
  async getEarnings(symbol: string, includeEstimates: boolean) {
    const historicalEarnings = this.generateEarningsHistory(symbol);
    const estimates = includeEstimates ? this.generateEarningsEstimates(symbol) : [];
    
    // Calculate earnings surprises
    const surprises = historicalEarnings.map(e => ({
      date: e.date,
      reported: e.reported,
      expected: e.expected,
      surprise: e.reported - e.expected,
      surprisePercent: ((e.reported - e.expected) / Math.abs(e.expected)) * 100
    }));
    
    const avgSurprise = surprises.reduce((sum, s) => sum + s.surprisePercent, 0) / surprises.length;
    const beatRate = surprises.filter(s => s.surprise > 0).length / surprises.length * 100;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          historical: historicalEarnings,
          estimates,
          analysis: {
            averageSurprise: `${avgSurprise.toFixed(2)}%`,
            beatRate: `${beatRate.toFixed(0)}%`,
            trend: this.determineEarningsTrend(historicalEarnings),
            nextEarningsDate: estimates[0]?.date,
            consensus: estimates[0]?.consensus
          },
          recentSurprises: surprises.slice(0, 4)
        }, null, 2)
      }]
    };
  }
  
  async getAnalystRatings(symbol: string) {
    const ratings = this.generateAnalystRatings(symbol);
    
    // Calculate consensus
    const ratingCounts = {
      STRONG_BUY: 0,
      BUY: 0,
      HOLD: 0,
      SELL: 0,
      STRONG_SELL: 0
    };
    
    let totalPriceTarget = 0;
    
    ratings.forEach(r => {
      ratingCounts[r.rating]++;
      totalPriceTarget += r.priceTarget;
    });
    
    const avgPriceTarget = totalPriceTarget / ratings.length;
    const currentPrice = 150; // Mock current price
    const upside = ((avgPriceTarget - currentPrice) / currentPrice) * 100;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          currentPrice,
          consensus: this.getConsensusRating(ratingCounts),
          averagePriceTarget: avgPriceTarget.toFixed(2),
          upside: `${upside.toFixed(2)}%`,
          distribution: ratingCounts,
          recentRatings: ratings.slice(0, 10),
          summary: {
            totalAnalysts: ratings.length,
            bullishPercent: ((ratingCounts.STRONG_BUY + ratingCounts.BUY) / ratings.length * 100).toFixed(0),
            neutralPercent: (ratingCounts.HOLD / ratings.length * 100).toFixed(0),
            bearishPercent: ((ratingCounts.SELL + ratingCounts.STRONG_SELL) / ratings.length * 100).toFixed(0)
          }
        }, null, 2)
      }]
    };
  }
  
  async getInsiderTrading(symbol: string, days: number) {
    const transactions = this.generateInsiderTransactions(symbol, days);
    
    // Analyze insider sentiment
    const buys = transactions.filter(t => t.type === 'BUY');
    const sells = transactions.filter(t => t.type === 'SELL');
    
    const totalBuyValue = buys.reduce((sum, t) => sum + t.value, 0);
    const totalSellValue = sells.reduce((sum, t) => sum + t.value, 0);
    
    const netActivity = totalBuyValue - totalSellValue;
    const sentiment = netActivity > 1000000 ? 'BULLISH' : 
                     netActivity < -1000000 ? 'BEARISH' : 'NEUTRAL';
    
    // Group by insider
    const insiderActivity = new Map<string, number>();
    transactions.forEach(t => {
      const current = insiderActivity.get(t.insider) || 0;
      insiderActivity.set(t.insider, current + (t.type === 'BUY' ? t.value : -t.value));
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          period: `${days} days`,
          summary: {
            totalTransactions: transactions.length,
            buys: buys.length,
            sells: sells.length,
            totalBuyValue: `$${(totalBuyValue / 1000000).toFixed(2)}M`,
            totalSellValue: `$${(totalSellValue / 1000000).toFixed(2)}M`,
            netActivity: `$${(netActivity / 1000000).toFixed(2)}M`,
            sentiment
          },
          topInsiders: Array.from(insiderActivity.entries())
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 5)
            .map(([insider, netValue]) => ({
              insider,
              netActivity: `$${(netValue / 1000000).toFixed(2)}M`,
              direction: netValue > 0 ? 'BUYING' : 'SELLING'
            })),
          recentTransactions: transactions.slice(0, 10)
        }, null, 2)
      }]
    };
  }
  
  private generateFinancialStatements(symbol: string, type: string, period: string): FinancialStatement[] {
    const statements: FinancialStatement[] = [];
    const periods = period === 'annual' ? 4 : 8;
    
    for (let i = 0; i < periods; i++) {
      const date = period === 'annual' ? 
        subYears(new Date(), i) : 
        subQuarters(new Date(), i);
      
      const baseRevenue = 1000000000 * (1 + Math.random());
      const growthFactor = Math.pow(0.95, i); // Simulate growth
      
      statements.push({
        period: period === 'annual' ? `FY${date.getFullYear()}` : `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
        date,
        revenue: baseRevenue * growthFactor,
        netIncome: baseRevenue * growthFactor * (0.1 + Math.random() * 0.15),
        eps: (baseRevenue * growthFactor * 0.12) / 100000000,
        totalAssets: baseRevenue * 5,
        totalLiabilities: baseRevenue * 2,
        cashFlow: baseRevenue * growthFactor * 0.15,
        freeCashFlow: baseRevenue * growthFactor * 0.1
      });
    }
    
    return statements;
  }
  
  private generateEarningsHistory(symbol: string): any[] {
    const history = [];
    
    for (let i = 0; i < 8; i++) {
      const date = subQuarters(new Date(), i);
      const expected = 2 + Math.random() * 2;
      const surprise = (Math.random() - 0.3) * 0.5; // Bias towards beats
      
      history.push({
        date: format(date, 'yyyy-MM-dd'),
        quarter: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
        expected,
        reported: expected + surprise,
        revenue: (25 + Math.random() * 10) * 1000000000,
        revenueBeat: Math.random() > 0.4
      });
    }
    
    return history;
  }
  
  private generateEarningsEstimates(symbol: string): any[] {
    const estimates = [];
    
    for (let i = 1; i <= 4; i++) {
      const date = subQuarters(new Date(), -i);
      const consensus = 2.5 + Math.random() * 2 + i * 0.1; // Growth trend
      
      estimates.push({
        date: format(date, 'yyyy-MM-dd'),
        quarter: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
        consensus,
        low: consensus * 0.9,
        high: consensus * 1.1,
        numberOfEstimates: Math.floor(15 + Math.random() * 10),
        revenueEstimate: (28 + i * 2 + Math.random() * 5) * 1000000000
      });
    }
    
    return estimates;
  }
  
  private generateAnalystRatings(symbol: string): AnalystRating[] {
    const ratings: AnalystRating[] = [];
    const firms = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Barclays', 
                   'Credit Suisse', 'Deutsche Bank', 'UBS', 'Citi', 'Wells Fargo'];
    const ratingOptions: AnalystRating['rating'][] = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
    
    const currentPrice = 150;
    
    for (const firm of firms) {
      // Bias towards bullish ratings
      const ratingIndex = Math.min(Math.floor(Math.random() * Math.random() * 5), 4);
      const rating = ratingOptions[ratingIndex];
      
      let priceTargetMultiplier = 1;
      switch (rating) {
        case 'STRONG_BUY': priceTargetMultiplier = 1.2 + Math.random() * 0.2; break;
        case 'BUY': priceTargetMultiplier = 1.1 + Math.random() * 0.1; break;
        case 'HOLD': priceTargetMultiplier = 0.95 + Math.random() * 0.1; break;
        case 'SELL': priceTargetMultiplier = 0.85 + Math.random() * 0.1; break;
        case 'STRONG_SELL': priceTargetMultiplier = 0.7 + Math.random() * 0.1; break;
      }
      
      ratings.push({
        firm,
        rating,
        priceTarget: currentPrice * priceTargetMultiplier,
        date: subDays(new Date(), Math.floor(Math.random() * 30))
      });
    }
    
    return ratings.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  private generateInsiderTransactions(symbol: string, days: number): any[] {
    const transactions = [];
    const insiders = [
      { name: 'CEO', title: 'Chief Executive Officer' },
      { name: 'CFO', title: 'Chief Financial Officer' },
      { name: 'COO', title: 'Chief Operating Officer' },
      { name: 'Director 1', title: 'Board Director' },
      { name: 'Director 2', title: 'Board Director' },
      { name: 'VP Sales', title: 'Vice President of Sales' }
    ];
    
    const transactionCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < transactionCount; i++) {
      const insider = insiders[Math.floor(Math.random() * insiders.length)];
      const daysAgo = Math.floor(Math.random() * days);
      const type = Math.random() > 0.6 ? 'BUY' : 'SELL'; // Slight bias towards selling
      const shares = Math.floor(Math.random() * 50000) + 1000;
      const price = 140 + Math.random() * 20;
      
      transactions.push({
        date: format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'),
        insider: insider.name,
        title: insider.title,
        type,
        shares,
        price: price.toFixed(2),
        value: shares * price,
        remainingHoldings: Math.floor(Math.random() * 1000000)
      });
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values[0];
    const older = values[Math.min(3, values.length - 1)];
    return ((recent - older) / Math.abs(older)) * 100;
  }
  
  private analyzeFinancials(metrics: any): string[] {
    const analysis = [];
    
    if (metrics.profitMargin > 20) {
      analysis.push('Excellent profit margins indicating strong pricing power');
    } else if (metrics.profitMargin > 10) {
      analysis.push('Healthy profit margins');
    } else if (metrics.profitMargin > 0) {
      analysis.push('Low but positive profit margins');
    } else {
      analysis.push('Currently unprofitable');
    }
    
    if (metrics.roe > 20) {
      analysis.push('Outstanding return on equity');
    } else if (metrics.roe > 10) {
      analysis.push('Good return on equity');
    }
    
    if (metrics.debtToEquity < 0.5) {
      analysis.push('Conservative balance sheet with low debt');
    } else if (metrics.debtToEquity > 2) {
      analysis.push('High debt levels - monitor for risk');
    }
    
    if (metrics.revenueGrowth > 20) {
      analysis.push('Strong revenue growth momentum');
    } else if (metrics.revenueGrowth < 0) {
      analysis.push('Declining revenues - concerning trend');
    }
    
    return analysis;
  }
  
  private determineEarningsTrend(earnings: any[]): string {
    if (earnings.length < 2) return 'INSUFFICIENT_DATA';
    
    const recent = earnings.slice(0, 4).map(e => e.reported);
    const older = earnings.slice(4, 8).map(e => e.reported);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    
    const growth = ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100;
    
    if (growth > 10) return 'STRONG_GROWTH';
    if (growth > 0) return 'MODERATE_GROWTH';
    if (growth > -10) return 'STABLE';
    return 'DECLINING';
  }
  
  private getConsensusRating(counts: Record<string, number>): string {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const weightedSum = 
      counts.STRONG_BUY * 5 +
      counts.BUY * 4 +
      counts.HOLD * 3 +
      counts.SELL * 2 +
      counts.STRONG_SELL * 1;
    
    const avgRating = weightedSum / total;
    
    if (avgRating >= 4.5) return 'STRONG BUY';
    if (avgRating >= 3.5) return 'BUY';
    if (avgRating >= 2.5) return 'HOLD';
    if (avgRating >= 1.5) return 'SELL';
    return 'STRONG SELL';
  }
  
}