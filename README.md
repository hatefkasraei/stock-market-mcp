# Stock Market MCP Server

A comprehensive Model Context Protocol (MCP) server providing advanced stock market data, analysis, and trading intelligence for AI agents.

> ⚠️ **IMPORTANT: Data Sources Notice**
> 
> This MCP server currently uses **real API data for stock quotes and historical prices only**. All other features (technical analysis, options, fundamentals, news) use **simulated/mock data** for demonstration purposes. See the [Data Sources](#data-sources) section below for details.

## Data Sources

| Feature | Data Source | Status |
|---------|------------|--------|
| **Stock Quotes** | Alpha Vantage API | ✅ **REAL DATA** |
| **Historical Prices** | Alpha Vantage API | ✅ **REAL DATA** |
| **Technical Indicators** | Calculated from mock data | ⚠️ Simulated |
| **Chart Patterns** | Pattern detection on mock data | ⚠️ Simulated |
| **Options Data** | Generated mock options chains | ⚠️ Simulated |
| **Financial Statements** | Static mock financials | ⚠️ Simulated |
| **Analyst Ratings** | Generated mock ratings | ⚠️ Simulated |
| **News Sentiment** | Generated mock news | ⚠️ Simulated |
| **Social Sentiment** | Random sentiment scores | ⚠️ Simulated |
| **Market Depth** | Generated order book | ⚠️ Simulated |
| **Insider Trading** | Mock transactions | ⚠️ Simulated |

### Why Mock Data?

- **Cost**: Real-time financial data APIs are expensive ($100-1000+/month)
- **Accessibility**: Most require business agreements and compliance
- **Development**: Allows testing all features without API limits
- **Demonstration**: Shows the full potential of the MCP architecture

### Making It Production-Ready

To use real data, you can integrate these providers:
- **Yahoo Finance** (via `yahoo-finance2`) - Free, unofficial
- **Polygon.io** - Good free tier
- **IEX Cloud** - Affordable, reliable
- **Financial Modeling Prep** - Fundamental data
- **NewsAPI** - Real news sentiment

The codebase is structured to easily swap mock functions with real API calls.

## Features

### 📊 Real-Time Market Data
- **Live Quotes**: Current prices, volume, bid/ask spreads *(Real API)*
- **Historical Data**: OHLCV data with customizable timeframes *(Real API)*
- **Market Depth**: Level 2 order book data *(Simulated)*
- **Intraday Data**: Minute-level resolution *(Simulated)*

### 📈 Technical Analysis *(All Simulated)*
- **Indicators**: RSI, MACD, Bollinger Bands, Moving Averages, Stochastic, ADX, ATR, OBV, VWAP
- **Pattern Recognition**: Head & Shoulders, Triangles, Flags, Wedges, Double Tops/Bottoms
- **Support/Resistance**: Dynamic level detection with strength analysis
- **Trading Signals**: Buy/Sell/Hold recommendations based on multiple indicators

### 💰 Options Analytics *(All Simulated)*
- **Options Chains**: Complete chains with Greeks for all strikes and expirations
- **Greeks Calculation**: Delta, Gamma, Theta, Vega, Rho with interpretations
- **Unusual Activity**: Detect abnormal options flow and block trades
- **Implied Volatility**: IV rank, percentile, and smile analysis

### 📋 Fundamental Analysis *(All Simulated)*
- **Financial Statements**: Income, Balance Sheet, Cash Flow
- **Earnings**: Historical data, estimates, and surprise analysis
- **Analyst Ratings**: Consensus ratings and price targets
- **Insider Trading**: Recent transactions and sentiment analysis

### 🧠 Market Intelligence *(All Simulated)*
- **News Sentiment**: NLP-analyzed news with relevance scoring
- **Social Sentiment**: Reddit, Twitter, StockTwits analysis
- **Sector Performance**: Rotation analysis and breadth indicators
- **Market Breadth**: Advance/Decline, New Highs/Lows, McClellan Oscillator

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stock-market-mcp.git
cd stock-market-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

## Configuration

Create a `.env` file with your API keys:

```env
# REQUIRED for real stock quotes (get free key from Alpha Vantage)
ALPHA_VANTAGE_API_KEY=your_api_key_here

# OPTIONAL - Not yet implemented, for future use
POLYGON_API_KEY=your_api_key_here  # Future implementation
IEX_CLOUD_API_KEY=your_api_key_here  # Future implementation

# Settings
DATA_PROVIDER=alpha_vantage  # Currently only alpha_vantage works
CACHE_TTL_SECONDS=300
MAX_REQUESTS_PER_MINUTE=60
```

### API Key Providers

#### Currently Supported:
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
  - ✅ Free tier: 5 API calls/minute, 500 calls/day
  - ✅ Provides: Real-time quotes and historical data
  - ✅ **This is the only required API key**

#### Planned for Future:
- **Polygon.io**: Free tier with 5 API calls/min (not yet implemented)
- **IEX Cloud**: Free tier with 50,000 messages/month (not yet implemented)
- **Yahoo Finance**: No API key needed (not yet implemented)

## Usage

### Running the Server

```bash
# Production
npm start

# Development
npm run dev

# With MCP Inspector
npm run inspect
```

### Connecting to Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "stock-market": {
      "command": "node",
      "args": ["/path/to/stock-market-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### Market Data Tools

#### `get_quote`
Get real-time quote for a stock symbol.
```json
{
  "symbol": "AAPL"
}
```

#### `get_historical_data`
Get historical OHLCV data.
```json
{
  "symbol": "AAPL",
  "period": "3mo",  // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
  "interval": "1d"  // 1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo
}
```

### Technical Analysis Tools

#### `calculate_indicators`
Calculate technical indicators.
```json
{
  "symbol": "AAPL",
  "indicators": ["RSI", "MACD", "BB"],
  "period": "3mo"
}
```

#### `identify_patterns`
Identify chart patterns.
```json
{
  "symbol": "AAPL",
  "patterns": ["head_shoulders", "triangle"],  // Optional, empty for all
  "period": "6mo"
}
```

### Options Tools

#### `get_options_chain`
Get options chain data.
```json
{
  "symbol": "AAPL",
  "expiration": "2024-12-20",  // Or "all"
  "type": "both",  // call, put, both
  "moneyness": "atm"  // itm, atm, otm, all
}
```

#### `find_unusual_options`
Find unusual options activity.
```json
{
  "symbol": "AAPL",  // Or "all" for market-wide
  "min_volume_ratio": 2,
  "min_premium": 10000
}
```

### Fundamental Analysis Tools

#### `get_financials`
Get financial statements.
```json
{
  "symbol": "AAPL",
  "statement": "income",  // income, balance, cash_flow, all
  "period": "quarterly"  // annual, quarterly
}
```

#### `get_analyst_ratings`
Get analyst ratings and price targets.
```json
{
  "symbol": "AAPL"
}
```

### Market Intelligence Tools

#### `get_news_sentiment`
Get news sentiment analysis.
```json
{
  "symbol": "AAPL",
  "days": 7,
  "min_relevance": 0.5
}
```

#### `analyze_stock`
Comprehensive analysis combining all data types.
```json
{
  "symbol": "AAPL",
  "include": ["technical", "fundamental", "sentiment", "options"]  // Or ["all"]
}
```

## Example Prompts for AI Agents

### Working with Real Data:
```
"What's the current price of AAPL?" ✅ Real API data
"Show me TSLA's price history for the last month" ✅ Real API data
"Get me a quote for SPY" ✅ Real API data
```

### Working with Simulated Data (Demo):
```
"Analyze AAPL for potential entry points using technical indicators" ⚠️ Mock data
"Find unusual options activity in tech stocks" ⚠️ Mock data
"What's the sentiment around TSLA based on recent news?" ⚠️ Mock data
"Show me support and resistance levels for SPY" ⚠️ Mock data
"Compare fundamentals of MSFT vs GOOGL" ⚠️ Mock data
"Identify stocks with bullish chart patterns" ⚠️ Mock data
"What's the current market breadth telling us?" ⚠️ Mock data
"Find stocks with high insider buying" ⚠️ Mock data
```

> **Note**: While simulated data doesn't reflect real market conditions, it demonstrates the full capabilities of the MCP architecture and how AI agents can interact with financial data.

## Architecture

```
stock-market-mcp/
├── src/
│   ├── index.ts           # Main MCP server
│   ├── services/          # Data services
│   │   ├── marketData.ts  # Real-time quotes & historical data
│   │   ├── technicalAnalysis.ts  # TA indicators & patterns
│   │   ├── options.ts     # Options analytics
│   │   ├── fundamental.ts # Financial statements & ratings
│   │   └── marketIntelligence.ts  # News & sentiment
│   └── types/             # TypeScript interfaces
├── dist/                  # Compiled JavaScript
└── package.json
```

## Performance

- **Caching**: All API responses cached for 5 minutes (configurable)
- **Rate Limiting**: Respects API provider limits
- **Batch Processing**: Multiple indicators calculated in parallel
- **Optimized Queries**: Minimal API calls through intelligent data aggregation

## Roadmap to Production

### Immediate Priorities - Real Data Integration
- [ ] **Yahoo Finance Integration** - Free real-time quotes and historical data
- [ ] **Polygon.io Integration** - Options chains and market data (free tier)
- [ ] **NewsAPI Integration** - Real news sentiment analysis
- [ ] **IEX Cloud Integration** - Reliable fundamental data

### How to Add Real Data Providers

1. **Replace Mock Functions**: Each service has mock data generators that can be swapped:
   ```typescript
   // Current: generateMockHistoricalData()
   // Replace with: fetchYahooFinanceData() or fetchPolygonData()
   ```

2. **Add Provider Configuration**: Extend `.env` with new API keys:
   ```env
   POLYGON_API_KEY=your_key
   IEX_CLOUD_API_KEY=your_key
   NEWS_API_KEY=your_key
   ```

3. **Update Service Classes**: Modify services in `src/services/` to call real APIs

### Future Enhancements
- [ ] WebSocket support for real-time streaming
- [ ] Machine learning-based pattern recognition
- [ ] Backtesting capabilities
- [ ] Portfolio optimization tools
- [ ] Risk management metrics (VaR, Sharpe ratio)
- [ ] Cryptocurrency support
- [ ] Economic indicators integration

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - See LICENSE file for details

## Disclaimer

This tool is for informational purposes only. Not financial advice. Always do your own research and consult with financial professionals before making investment decisions.

## Support

- Issues: https://github.com/yourusername/stock-market-mcp/issues
- Documentation: https://github.com/yourusername/stock-market-mcp/wiki
- Email: support@example.com