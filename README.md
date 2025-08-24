# Stock Market MCP Server

A comprehensive Model Context Protocol (MCP) server providing advanced stock market data, analysis, and trading intelligence for AI agents.

## Features

### 📊 Real-Time Market Data
- **Live Quotes**: Current prices, volume, bid/ask spreads
- **Historical Data**: OHLCV data with customizable timeframes
- **Market Depth**: Level 2 order book data
- **Intraday Data**: Minute-level resolution

### 📈 Technical Analysis
- **Indicators**: RSI, MACD, Bollinger Bands, Moving Averages, Stochastic, ADX, ATR, OBV, VWAP
- **Pattern Recognition**: Head & Shoulders, Triangles, Flags, Wedges, Double Tops/Bottoms
- **Support/Resistance**: Dynamic level detection with strength analysis
- **Trading Signals**: Buy/Sell/Hold recommendations based on multiple indicators

### 💰 Options Analytics
- **Options Chains**: Complete chains with Greeks for all strikes and expirations
- **Greeks Calculation**: Delta, Gamma, Theta, Vega, Rho with interpretations
- **Unusual Activity**: Detect abnormal options flow and block trades
- **Implied Volatility**: IV rank, percentile, and smile analysis

### 📋 Fundamental Analysis
- **Financial Statements**: Income, Balance Sheet, Cash Flow
- **Earnings**: Historical data, estimates, and surprise analysis
- **Analyst Ratings**: Consensus ratings and price targets
- **Insider Trading**: Recent transactions and sentiment analysis

### 🧠 Market Intelligence
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
# API Keys (get free keys from providers)
ALPHA_VANTAGE_API_KEY=your_api_key_here
POLYGON_API_KEY=your_api_key_here
IEX_CLOUD_API_KEY=your_api_key_here

# Settings
DATA_PROVIDER=alpha_vantage  # Options: alpha_vantage, polygon, iex, yahoo
CACHE_TTL_SECONDS=300
MAX_REQUESTS_PER_MINUTE=60
```

### API Key Providers
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (Free tier available)
- **Polygon.io**: https://polygon.io (Free tier with 5 API calls/min)
- **IEX Cloud**: https://iexcloud.io (Free tier with 50,000 messages/month)

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

```
"Analyze AAPL for potential entry points using technical indicators"
"Find unusual options activity in tech stocks"
"What's the sentiment around TSLA based on recent news?"
"Show me support and resistance levels for SPY"
"Compare fundamentals of MSFT vs GOOGL"
"Identify stocks with bullish chart patterns"
"What's the current market breadth telling us?"
"Find stocks with high insider buying"
```

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

## Roadmap

- [ ] WebSocket support for real-time streaming
- [ ] Additional data providers (Yahoo Finance, Finnhub)
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