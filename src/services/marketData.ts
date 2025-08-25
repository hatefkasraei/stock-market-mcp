import axios from 'axios';
import NodeCache from 'node-cache';
import { Quote, OHLCV, MarketDepth } from '../types/index.js';
import { format, subDays, subMonths, subYears } from 'date-fns';

export class MarketDataService {
  private cache: NodeCache;
  private apiKey: string;
  private provider: string;
  private alpacaKeyId: string;
  private alpacaSecretKey: string;
  private alpacaBaseUrl: string;
  
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300'),
      checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600')
    });
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.provider = process.env.DATA_PROVIDER || 'alpha_vantage';
    this.alpacaKeyId = process.env.ALPACA_API_KEY_ID || '';
    this.alpacaSecretKey = process.env.ALPACA_API_SECRET_KEY || '';
    this.alpacaBaseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';
    
    // Debug log initialization
    console.error('MarketDataService initialized:');
    console.error('- Provider:', this.provider);
    console.error('- API Key present:', !!this.apiKey);
    console.error('- Alpaca Key present:', !!this.alpacaKeyId);
    console.error('- Cache TTL:', process.env.CACHE_TTL_SECONDS || '300');
  }
  
  async getQuote(symbol: string) {
    const cacheKey = `quote_${symbol}`;
    const cached = this.cache.get<Quote>(cacheKey);
    
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(cached, null, 2)
        }]
      };
    }
    
    try {
      let quote: Quote;
      
      if (this.provider === 'alpha_vantage') {
        quote = await this.getAlphaVantageQuote(symbol);
      } else if (this.provider === 'alpaca') {
        quote = await this.getAlpacaQuote(symbol);
      } else {
        // Fallback to mock data for demonstration
        quote = this.getMockQuote(symbol);
      }
      
      this.cache.set(cacheKey, quote);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(quote, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch quote: ${error}`);
    }
  }
  
  async getHistoricalData(symbol: string, period: string, interval: string) {
    const cacheKey = `historical_${symbol}_${period}_${interval}`;
    const cached = this.cache.get<OHLCV[]>(cacheKey);
    
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            symbol,
            period,
            interval,
            data: cached
          }, null, 2)
        }]
      };
    }
    
    try {
      let data: OHLCV[];
      
      if (this.provider === 'alpha_vantage' && this.apiKey) {
        data = await this.getAlphaVantageHistorical(symbol, period, interval);
      } else if (this.provider === 'alpaca') {
        data = await this.getAlpacaHistorical(symbol, period, interval);
      } else {
        // Generate mock historical data
        data = this.generateMockHistoricalData(period, interval);
      }
      
      this.cache.set(cacheKey, data);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            symbol,
            period,
            interval,
            dataPoints: data.length,
            data: data.slice(0, 10), // Show first 10 for brevity
            summary: {
              startDate: data[0]?.date,
              endDate: data[data.length - 1]?.date,
              highestClose: Math.max(...data.map(d => d.close)),
              lowestClose: Math.min(...data.map(d => d.close)),
              totalVolume: data.reduce((sum, d) => sum + d.volume, 0)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch historical data: ${error}`);
    }
  }
  
  async getMarketDepth(symbol: string) {
    const cacheKey = `depth_${symbol}`;
    const cached = this.cache.get<MarketDepth>(cacheKey);
    
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(cached, null, 2)
        }]
      };
    }
    
    // Market depth usually requires premium data feeds
    // Generating mock data for demonstration
    const depth: MarketDepth = {
      symbol,
      bids: this.generateMockOrders('bid'),
      asks: this.generateMockOrders('ask'),
      timestamp: new Date()
    };
    
    this.cache.set(cacheKey, depth);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...depth,
          spread: depth.asks[0].price - depth.bids[0].price,
          midPrice: (depth.asks[0].price + depth.bids[0].price) / 2,
          totalBidVolume: depth.bids.reduce((sum, b) => sum + b.size, 0),
          totalAskVolume: depth.asks.reduce((sum, a) => sum + a.size, 0)
        }, null, 2)
      }]
    };
  }
  
  private async getAlpacaQuote(symbol: string): Promise<Quote> {
    if (!this.alpacaKeyId || !this.alpacaSecretKey) {
      console.error('No Alpaca API credentials found');
      throw new Error('Alpaca API credentials not configured');
    }
    
    const url = `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`;
    console.error(`Fetching from Alpaca: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'APCA-API-KEY-ID': this.alpacaKeyId,
          'APCA-API-SECRET-KEY': this.alpacaSecretKey
        }
      });
      
      console.error('Alpaca response:', JSON.stringify(response.data));
      
      const quote = response.data.quote;
      const latestTrade = response.data.latestTrade;
      
      if (!quote) {
        throw new Error('No quote data available');
      }
      
      // Calculate price from bid/ask midpoint or use latest trade price
      const price = latestTrade?.p || ((quote.ap + quote.bp) / 2);
      
      // Fetch additional data for daily stats
      const barsUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/bars/latest?feed=sip`;
      const barsResponse = await axios.get(barsUrl, {
        headers: {
          'APCA-API-KEY-ID': this.alpacaKeyId,
          'APCA-API-SECRET-KEY': this.alpacaSecretKey
        }
      });
      
      const bar = barsResponse.data.bar;
      
      return {
        symbol,
        price: price,
        change: bar ? price - bar.c : 0,
        changePercent: bar ? ((price - bar.c) / bar.c) * 100 : 0,
        volume: bar?.v || 0,
        high: bar?.h || price,
        low: bar?.l || price,
        open: bar?.o || price,
        previousClose: bar?.c || price,
        bid: quote.bp || price - 0.01,
        ask: quote.ap || price + 0.01,
        bidSize: quote.bs || 0,
        askSize: quote.as || 0,
        timestamp: new Date(quote.t)
      };
    } catch (error: any) {
      console.error('Alpaca API error:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Alpaca API rate limit reached. Please wait before retrying.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Alpaca API credentials');
      } else if (error.response?.status === 404) {
        throw new Error(`Symbol ${symbol} not found`);
      }
      
      throw new Error(`Failed to fetch Alpaca quote: ${error.message}`);
    }
  }
  
  private async getAlphaVantageQuote(symbol: string): Promise<Quote> {
    if (!this.apiKey) {
      console.error('No Alpha Vantage API key found');
      throw new Error('API key not configured');
    }
    
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
    console.error(`Fetching from Alpha Vantage: ${url.replace(this.apiKey, 'HIDDEN')}`);
    
    const response = await axios.get(url);
    console.error('Alpha Vantage response keys:', Object.keys(response.data));
    
    // Check for rate limit message
    if (response.data['Note']) {
      console.error('Alpha Vantage rate limit:', response.data['Note']);
      throw new Error('API rate limit reached. Please wait 1 minute.');
    }
    
    if (response.data['Error Message']) {
      console.error('Alpha Vantage error:', response.data['Error Message']);
      throw new Error(`Invalid symbol: ${symbol}`);
    }
    
    const data = response.data['Global Quote'];
    
    if (!data || Object.keys(data).length === 0) {
      console.error('Empty response from Alpha Vantage:', JSON.stringify(response.data));
      throw new Error('No data available for symbol');
    }
    
    return {
      symbol,
      price: parseFloat(data['05. price']),
      change: parseFloat(data['09. change']),
      changePercent: parseFloat(data['10. change percent'].replace('%', '')),
      volume: parseInt(data['06. volume']),
      high: parseFloat(data['03. high']),
      low: parseFloat(data['04. low']),
      open: parseFloat(data['02. open']),
      previousClose: parseFloat(data['08. previous close']),
      bid: parseFloat(data['05. price']) - 0.01, // Mock bid
      ask: parseFloat(data['05. price']) + 0.01, // Mock ask
      bidSize: 100,
      askSize: 100,
      timestamp: new Date()
    };
  }
  
  private async getAlpacaHistorical(symbol: string, period: string, interval: string): Promise<OHLCV[]> {
    if (!this.alpacaKeyId || !this.alpacaSecretKey) {
      throw new Error('Alpaca API credentials not configured');
    }
    
    // Convert period to start date
    const endDate = new Date();
    let startDate = new Date();
    
    const periodMap: Record<string, () => Date> = {
      '1d': () => subDays(endDate, 1),
      '5d': () => subDays(endDate, 5),
      '1mo': () => subMonths(endDate, 1),
      '3mo': () => subMonths(endDate, 3),
      '6mo': () => subMonths(endDate, 6),
      '1y': () => subYears(endDate, 1),
      '2y': () => subYears(endDate, 2),
      '5y': () => subYears(endDate, 5),
      'max': () => subYears(endDate, 10)
    };
    
    if (periodMap[period]) {
      startDate = periodMap[period]();
    }
    
    // Convert interval to Alpaca timeframe
    const timeframeMap: Record<string, string> = {
      '1m': '1Min',
      '5m': '5Min',
      '15m': '15Min',
      '30m': '30Min',
      '1h': '1Hour',
      '1d': '1Day',
      '1w': '1Week'
    };
    
    const timeframe = timeframeMap[interval] || '1Day';
    
    const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars`;
    const params = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timeframe: timeframe,
      limit: 10000,
      feed: 'sip'
    };
    
    try {
      const response = await axios.get(url, {
        headers: {
          'APCA-API-KEY-ID': this.alpacaKeyId,
          'APCA-API-SECRET-KEY': this.alpacaSecretKey
        },
        params
      });
      
      const bars = response.data.bars || [];
      
      return bars.map((bar: any) => ({
        date: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v
      }));
    } catch (error: any) {
      console.error('Alpaca historical data error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch Alpaca historical data: ${error.message}`);
    }
  }
  
  private async getAlphaVantageHistorical(symbol: string, period: string, interval: string): Promise<OHLCV[]> {
    let func = 'TIME_SERIES_DAILY';
    if (interval === '1m' || interval === '5m' || interval === '15m' || interval === '30m' || interval === '1h') {
      func = 'TIME_SERIES_INTRADAY';
    }
    
    const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${this.apiKey}${func === 'TIME_SERIES_INTRADAY' ? `&interval=${interval}` : ''}`;
    const response = await axios.get(url);
    
    const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
      throw new Error('No time series data available');
    }
    
    const timeSeries = response.data[timeSeriesKey];
    const data: OHLCV[] = [];
    
    for (const [date, values] of Object.entries(timeSeries)) {
      data.push({
        date: new Date(date),
        open: parseFloat((values as any)['1. open']),
        high: parseFloat((values as any)['2. high']),
        low: parseFloat((values as any)['3. low']),
        close: parseFloat((values as any)['4. close']),
        volume: parseInt((values as any)['5. volume'])
      });
    }
    
    return data;
  }
  
  private getMockQuote(symbol: string): Quote {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    
    return {
      symbol,
      price: basePrice,
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 50000000),
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      open: basePrice + (Math.random() - 0.5) * 3,
      previousClose: basePrice - change,
      bid: basePrice - 0.01,
      ask: basePrice + 0.01,
      bidSize: Math.floor(Math.random() * 1000),
      askSize: Math.floor(Math.random() * 1000),
      marketCap: basePrice * 1000000000,
      pe: 15 + Math.random() * 20,
      eps: basePrice / (15 + Math.random() * 20),
      timestamp: new Date()
    };
  }
  
  private generateMockHistoricalData(period: string, interval: string): OHLCV[] {
    const data: OHLCV[] = [];
    let dataPoints = 100;
    let currentDate = new Date();
    
    // Determine number of data points based on period and interval
    const periodMap: Record<string, number> = {
      '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180,
      '1y': 365, '2y': 730, '5y': 1825, 'max': 3650
    };
    
    dataPoints = periodMap[period] || 100;
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = subDays(currentDate, i);
      const basePrice = 100 + Math.sin(i / 10) * 20 + Math.random() * 10;
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
  
  private generateMockOrders(type: 'bid' | 'ask'): Array<{ price: number; size: number }> {
    const orders = [];
    const basePrice = 100;
    
    for (let i = 0; i < 10; i++) {
      const priceOffset = (i + 1) * 0.01;
      orders.push({
        price: type === 'bid' ? basePrice - priceOffset : basePrice + priceOffset,
        size: Math.floor(Math.random() * 10000)
      });
    }
    
    return orders;
  }
}