import { OptionContract } from '../types/index.js';
import { addDays, addMonths, format } from 'date-fns';

export class OptionsService {
  
  async getOptionsChain(symbol: string, expiration?: string, type: string = 'both', moneyness: string = 'all') {
    // Generate mock options chain
    const expirations = this.getExpirationDates();
    const selectedExpirations = expiration === 'all' ? expirations : 
                               expiration ? [new Date(expiration)] : 
                               [expirations[0]]; // Next expiration
    
    const currentPrice = 150; // Mock current price
    const chains: Record<string, OptionContract[]> = {};
    
    for (const exp of selectedExpirations) {
      const contracts = this.generateOptionsContracts(symbol, currentPrice, exp, type, moneyness);
      chains[format(exp, 'yyyy-MM-dd')] = contracts;
    }
    
    // Calculate summary statistics
    const allContracts = Object.values(chains).flat();
    const totalVolume = allContracts.reduce((sum, c) => sum + c.volume, 0);
    const totalOI = allContracts.reduce((sum, c) => sum + c.openInterest, 0);
    const putCallRatio = this.calculatePutCallRatio(allContracts);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          currentPrice,
          expirations: Object.keys(chains),
          summary: {
            totalContracts: allContracts.length,
            totalVolume,
            totalOpenInterest: totalOI,
            putCallRatio,
            maxPain: this.calculateMaxPain(allContracts, currentPrice),
            unusualActivity: this.findUnusualActivity(allContracts)
          },
          chains: Object.fromEntries(
            Object.entries(chains).map(([date, contracts]) => [
              date,
              contracts.slice(0, 10) // Limit output for brevity
            ])
          )
        }, null, 2)
      }]
    };
  }
  
  async calculateGreeks(symbol: string, strike: number, expiration: string, type: string) {
    const currentPrice = 150; // Mock current price
    const riskFreeRate = 0.05;
    const volatility = 0.25;
    const daysToExpiration = this.getDaysToExpiration(new Date(expiration));
    const timeToExpiration = daysToExpiration / 365;
    
    // Black-Scholes Greeks calculation (simplified)
    const d1 = (Math.log(currentPrice / strike) + (riskFreeRate + volatility ** 2 / 2) * timeToExpiration) / 
               (volatility * Math.sqrt(timeToExpiration));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiration);
    
    const greeks = {
      delta: type === 'call' ? this.normalCDF(d1) : this.normalCDF(d1) - 1,
      gamma: this.normalPDF(d1) / (currentPrice * volatility * Math.sqrt(timeToExpiration)),
      theta: type === 'call' ? 
        -(currentPrice * this.normalPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiration)) -
        riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(d2) :
        -(currentPrice * this.normalPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiration)) +
        riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(-d2),
      vega: currentPrice * this.normalPDF(d1) * Math.sqrt(timeToExpiration) / 100,
      rho: type === 'call' ?
        strike * timeToExpiration * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(d2) / 100 :
        -strike * timeToExpiration * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(-d2) / 100
    };
    
    // Calculate theoretical price
    const theoreticalPrice = type === 'call' ?
      currentPrice * this.normalCDF(d1) - strike * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(d2) :
      strike * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(-d2) - currentPrice * this.normalCDF(-d1);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          symbol,
          strike,
          expiration,
          type,
          currentPrice,
          daysToExpiration,
          theoreticalPrice: theoreticalPrice.toFixed(2),
          greeks: {
            delta: greeks.delta.toFixed(4),
            gamma: greeks.gamma.toFixed(4),
            theta: (greeks.theta / 365).toFixed(4), // Daily theta
            vega: greeks.vega.toFixed(4),
            rho: greeks.rho.toFixed(4)
          },
          interpretation: this.interpretGreeks(greeks, type)
        }, null, 2)
      }]
    };
  }
  
  async findUnusualOptions(symbol?: string, minVolumeRatio: number = 2, minPremium: number = 10000) {
    // Generate mock unusual options activity
    const unusualContracts: any[] = [];
    const symbols = symbol && symbol !== 'all' ? [symbol] : ['AAPL', 'TSLA', 'NVDA', 'SPY', 'META'];
    
    for (const sym of symbols) {
      const contracts = this.generateUnusualContracts(sym, minVolumeRatio, minPremium);
      unusualContracts.push(...contracts);
    }
    
    // Sort by volume/OI ratio
    unusualContracts.sort((a, b) => b.volumeOIRatio - a.volumeOIRatio);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          scanCriteria: {
            minVolumeRatio,
            minPremium
          },
          totalFound: unusualContracts.length,
          topContracts: unusualContracts.slice(0, 20),
          summary: {
            bullishFlow: unusualContracts.filter(c => c.sentiment === 'BULLISH').length,
            bearishFlow: unusualContracts.filter(c => c.sentiment === 'BEARISH').length,
            totalPremium: unusualContracts.reduce((sum, c) => sum + c.premium, 0),
            avgVolumeRatio: unusualContracts.reduce((sum, c) => sum + c.volumeOIRatio, 0) / unusualContracts.length
          }
        }, null, 2)
      }]
    };
  }
  
  private getExpirationDates(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    
    // Weekly expirations for next month
    for (let i = 0; i < 4; i++) {
      dates.push(addDays(today, 7 * (i + 1)));
    }
    
    // Monthly expirations
    for (let i = 1; i <= 6; i++) {
      dates.push(addMonths(today, i));
    }
    
    return dates;
  }
  
  private generateOptionsContracts(
    symbol: string, 
    currentPrice: number, 
    expiration: Date, 
    type: string, 
    moneyness: string
  ): OptionContract[] {
    const contracts: OptionContract[] = [];
    const strikes = this.generateStrikes(currentPrice, moneyness);
    
    for (const strike of strikes) {
      if (type === 'call' || type === 'both') {
        contracts.push(this.createContract(symbol, strike, expiration, 'CALL', currentPrice));
      }
      if (type === 'put' || type === 'both') {
        contracts.push(this.createContract(symbol, strike, expiration, 'PUT', currentPrice));
      }
    }
    
    return contracts;
  }
  
  private createContract(
    symbol: string, 
    strike: number, 
    expiration: Date, 
    type: 'CALL' | 'PUT',
    currentPrice: number
  ): OptionContract {
    const daysToExp = this.getDaysToExpiration(expiration);
    const moneyness = type === 'CALL' ? 
      (currentPrice - strike) / currentPrice : 
      (strike - currentPrice) / currentPrice;
    
    // Mock pricing based on moneyness and time
    const intrinsicValue = Math.max(0, type === 'CALL' ? currentPrice - strike : strike - currentPrice);
    const timeValue = Math.max(0.5, daysToExp / 365 * 5) * Math.exp(-Math.abs(moneyness) * 2);
    const theoreticalPrice = intrinsicValue + timeValue;
    
    const spread = 0.05 + Math.abs(moneyness) * 0.1;
    
    return {
      symbol,
      strike,
      expiration,
      type,
      bid: Math.max(0, theoreticalPrice - spread),
      ask: theoreticalPrice + spread,
      last: theoreticalPrice,
      volume: Math.floor(Math.random() * 5000 * Math.exp(-Math.abs(moneyness) * 2)),
      openInterest: Math.floor(Math.random() * 10000 * Math.exp(-Math.abs(moneyness))),
      impliedVolatility: 0.2 + Math.random() * 0.3 + Math.abs(moneyness) * 0.1,
      delta: type === 'CALL' ? 
        Math.max(0.01, Math.min(0.99, 0.5 + moneyness * 2)) :
        Math.max(-0.99, Math.min(-0.01, -0.5 + moneyness * 2)),
      gamma: 0.01 * Math.exp(-Math.abs(moneyness) * 4),
      theta: -0.05 * timeValue / daysToExp,
      vega: 0.1 * Math.sqrt(daysToExp / 365),
      rho: 0.01 * daysToExp / 365
    };
  }
  
  private generateStrikes(currentPrice: number, moneyness: string): number[] {
    const strikes: number[] = [];
    const strikeInterval = currentPrice > 100 ? 5 : currentPrice > 50 ? 2.5 : 1;
    
    const range = moneyness === 'atm' ? 0.05 : 
                  moneyness === 'itm' ? 0.2 : 
                  moneyness === 'otm' ? 0.2 : 0.3;
    
    const minStrike = currentPrice * (1 - range);
    const maxStrike = currentPrice * (1 + range);
    
    for (let strike = minStrike; strike <= maxStrike; strike += strikeInterval) {
      const rounded = Math.round(strike / strikeInterval) * strikeInterval;
      
      if (moneyness === 'all' ||
          (moneyness === 'atm' && Math.abs(rounded - currentPrice) / currentPrice < 0.05) ||
          (moneyness === 'itm' && rounded < currentPrice) ||
          (moneyness === 'otm' && rounded > currentPrice)) {
        strikes.push(rounded);
      }
    }
    
    return strikes;
  }
  
  private generateUnusualContracts(symbol: string, minVolumeRatio: number, minPremium: number): any[] {
    const contracts: any[] = [];
    const currentPrice = 100 + Math.random() * 200;
    
    // Generate 2-5 unusual contracts per symbol
    const count = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < count; i++) {
      const type = Math.random() > 0.5 ? 'CALL' : 'PUT';
      const strike = currentPrice * (1 + (Math.random() - 0.5) * 0.3);
      const volume = Math.floor(minVolumeRatio * 1000 + Math.random() * 10000);
      const openInterest = Math.floor(volume / (minVolumeRatio + Math.random()));
      const price = Math.random() * 10 + 1;
      const premium = volume * price * 100;
      
      if (premium >= minPremium) {
        contracts.push({
          symbol,
          strike: Math.round(strike),
          expiration: format(addDays(new Date(), Math.floor(Math.random() * 60)), 'yyyy-MM-dd'),
          type,
          volume,
          openInterest,
          volumeOIRatio: volume / Math.max(1, openInterest),
          price,
          premium,
          sentiment: type === 'CALL' ? 'BULLISH' : 'BEARISH',
          unusualType: volume > 5000 ? 'BLOCK_TRADE' : 'HIGH_VOLUME',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return contracts;
  }
  
  private calculatePutCallRatio(contracts: OptionContract[]): number {
    const puts = contracts.filter(c => c.type === 'PUT');
    const calls = contracts.filter(c => c.type === 'CALL');
    
    const putVolume = puts.reduce((sum, c) => sum + c.volume, 0);
    const callVolume = calls.reduce((sum, c) => sum + c.volume, 0);
    
    return callVolume > 0 ? putVolume / callVolume : 0;
  }
  
  private calculateMaxPain(contracts: OptionContract[], currentPrice: number): number {
    // Simplified max pain calculation
    const strikes = [...new Set(contracts.map(c => c.strike))];
    let maxPain = currentPrice;
    let minTotalValue = Infinity;
    
    for (const strike of strikes) {
      const callsITM = contracts.filter(c => c.type === 'CALL' && strike > c.strike);
      const putsITM = contracts.filter(c => c.type === 'PUT' && strike < c.strike);
      
      const totalValue = 
        callsITM.reduce((sum, c) => sum + (strike - c.strike) * c.openInterest, 0) +
        putsITM.reduce((sum, c) => sum + (c.strike - strike) * c.openInterest, 0);
      
      if (totalValue < minTotalValue) {
        minTotalValue = totalValue;
        maxPain = strike;
      }
    }
    
    return maxPain;
  }
  
  private findUnusualActivity(contracts: OptionContract[]): any[] {
    return contracts
      .filter(c => c.volume > c.openInterest * 2)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(c => ({
        strike: c.strike,
        type: c.type,
        volume: c.volume,
        openInterest: c.openInterest,
        ratio: (c.volume / Math.max(1, c.openInterest)).toFixed(2)
      }));
  }
  
  private getDaysToExpiration(expiration: Date): number {
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1 + sign * y);
  }
  
  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }
  
  private interpretGreeks(greeks: any, type: string): string[] {
    const interpretations: string[] = [];
    
    if (Math.abs(greeks.delta) > 0.7) {
      interpretations.push(`High delta (${greeks.delta.toFixed(2)}): Option moves strongly with stock price`);
    } else if (Math.abs(greeks.delta) < 0.3) {
      interpretations.push(`Low delta (${greeks.delta.toFixed(2)}): Option is less sensitive to stock price`);
    }
    
    if (greeks.gamma > 0.05) {
      interpretations.push(`High gamma: Delta will change rapidly as stock moves`);
    }
    
    if (greeks.theta < -0.1) {
      interpretations.push(`High theta decay: Losing ${Math.abs(greeks.theta).toFixed(2)} per day to time decay`);
    }
    
    if (greeks.vega > 0.2) {
      interpretations.push(`High vega: Very sensitive to implied volatility changes`);
    }
    
    return interpretations;
  }
}