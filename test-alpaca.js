import { MarketDataService } from './dist/services/marketData.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAlpacaQuote() {
  // Set the provider to alpaca
  process.env.DATA_PROVIDER = 'alpaca';
  
  const service = new MarketDataService();
  
  try {
    console.log('Testing Alpaca getQuote endpoint...\n');
    
    // Test with a popular stock symbol
    const symbol = 'AAPL';
    console.log(`Fetching quote for ${symbol}...`);
    
    const result = await service.getQuote(symbol);
    const quote = JSON.parse(result.content[0].text);
    
    console.log('\nQuote Data:');
    console.log('===========');
    console.log(`Symbol: ${quote.symbol}`);
    console.log(`Price: $${quote.price.toFixed(2)}`);
    console.log(`Bid: $${quote.bid.toFixed(2)} (Size: ${quote.bidSize})`);
    console.log(`Ask: $${quote.ask.toFixed(2)} (Size: ${quote.askSize})`);
    console.log(`Open: $${quote.open.toFixed(2)}`);
    console.log(`High: $${quote.high.toFixed(2)}`);
    console.log(`Low: $${quote.low.toFixed(2)}`);
    console.log(`Previous Close: $${quote.previousClose.toFixed(2)}`);
    console.log(`Change: $${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)`);
    console.log(`Volume: ${quote.volume.toLocaleString()}`);
    console.log(`Timestamp: ${quote.timestamp}`);
    
  } catch (error) {
    console.error('Error fetching quote:', error.message);
    console.error('\nMake sure you have set the following environment variables in .env:');
    console.error('- ALPACA_API_KEY_ID');
    console.error('- ALPACA_API_SECRET_KEY');
    console.error('- DATA_PROVIDER=alpaca');
  }
}

// Test historical data
async function testAlpacaHistorical() {
  process.env.DATA_PROVIDER = 'alpaca';
  
  const service = new MarketDataService();
  
  try {
    console.log('\n\nTesting Alpaca historical data endpoint...\n');
    
    const symbol = 'AAPL';
    const period = '5d';
    const interval = '1d';
    
    console.log(`Fetching ${period} historical data for ${symbol} with ${interval} interval...`);
    
    const result = await service.getHistoricalData(symbol, period, interval);
    const data = JSON.parse(result.content[0].text);
    
    console.log('\nHistorical Data Summary:');
    console.log('========================');
    console.log(`Symbol: ${data.symbol}`);
    console.log(`Period: ${data.period}`);
    console.log(`Interval: ${data.interval}`);
    console.log(`Data Points: ${data.dataPoints}`);
    console.log(`Start Date: ${data.summary.startDate}`);
    console.log(`End Date: ${data.summary.endDate}`);
    console.log(`Highest Close: $${data.summary.highestClose.toFixed(2)}`);
    console.log(`Lowest Close: $${data.summary.lowestClose.toFixed(2)}`);
    console.log(`Total Volume: ${data.summary.totalVolume.toLocaleString()}`);
    
    console.log('\nFirst 3 data points:');
    data.data.slice(0, 3).forEach((bar, i) => {
      console.log(`${i + 1}. Date: ${bar.date}, O: $${bar.open.toFixed(2)}, H: $${bar.high.toFixed(2)}, L: $${bar.low.toFixed(2)}, C: $${bar.close.toFixed(2)}, V: ${bar.volume.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
  }
}

// Run tests
console.log('Alpaca Markets API Integration Test');
console.log('====================================\n');

testAlpacaQuote().then(() => testAlpacaHistorical());