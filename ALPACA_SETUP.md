# Alpaca Markets API Integration

This project now supports Alpaca Markets API for real-time stock quotes and historical market data.

## Features

- Real-time stock quotes with bid/ask prices
- Historical price data (OHLCV)
- Support for multiple timeframes (1min, 5min, 15min, 30min, 1hour, 1day, 1week)
- Automatic error handling and rate limit management
- Caching to reduce API calls

## Setup

### 1. Get Alpaca API Credentials

1. Sign up for an Alpaca account at [https://alpaca.markets](https://alpaca.markets)
2. Navigate to your API Keys section in the dashboard
3. Generate API keys (you can use paper trading keys for testing)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Alpaca API Configuration
ALPACA_API_KEY_ID=your_alpaca_key_id_here
ALPACA_API_SECRET_KEY=your_alpaca_secret_key_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # Use paper URL for testing

# Set Alpaca as the data provider
DATA_PROVIDER=alpaca
```

### 3. Build the Project

```bash
npm run build
```

## Usage

### Get Real-Time Quote

The `getQuote` method fetches real-time quote data including:
- Current price
- Bid/Ask prices and sizes
- Day's high/low/open
- Previous close
- Volume
- Change and change percentage

```javascript
const service = new MarketDataService();
const quote = await service.getQuote('AAPL');
```

### Get Historical Data

The `getHistoricalData` method fetches historical OHLCV data:

```javascript
const service = new MarketDataService();
const historicalData = await service.getHistoricalData('AAPL', '5d', '1d');
```

Supported periods:
- `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `max`

Supported intervals:
- `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1w`

## Testing

Run the test script to verify your Alpaca integration:

```bash
node test-alpaca.js
```

This will test both quote and historical data endpoints.

## API Response Format

### Quote Response
```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "bid": 150.24,
  "ask": 150.26,
  "bidSize": 100,
  "askSize": 200,
  "volume": 50000000,
  "high": 152.00,
  "low": 149.50,
  "open": 151.00,
  "previousClose": 150.00,
  "change": 0.25,
  "changePercent": 0.17,
  "timestamp": "2024-08-24T15:30:00Z"
}
```

### Historical Data Response
```json
{
  "symbol": "AAPL",
  "period": "5d",
  "interval": "1d",
  "dataPoints": 5,
  "data": [
    {
      "date": "2024-08-20T00:00:00Z",
      "open": 150.00,
      "high": 152.00,
      "low": 149.50,
      "close": 151.00,
      "volume": 45000000
    }
  ],
  "summary": {
    "startDate": "2024-08-20T00:00:00Z",
    "endDate": "2024-08-24T00:00:00Z",
    "highestClose": 152.00,
    "lowestClose": 149.00,
    "totalVolume": 250000000
  }
}
```

## Rate Limits

Alpaca Markets API has the following rate limits:
- **Paper Trading**: 200 requests per minute
- **Live Trading**: 200 requests per minute
- **Burst Limit**: 10 requests per second

The implementation includes automatic rate limit handling and will return appropriate error messages when limits are exceeded.

## Error Handling

The integration includes comprehensive error handling for:
- Invalid API credentials (401)
- Symbol not found (404)
- Rate limit exceeded (429)
- Network errors
- Missing or invalid data

## Switching Between Data Providers

You can easily switch between different data providers by changing the `DATA_PROVIDER` environment variable:

- `alpaca` - Alpaca Markets
- `alpha_vantage` - Alpha Vantage
- `polygon` - Polygon.io (if implemented)
- `iex` - IEX Cloud (if implemented)

## Support

For issues related to:
- Alpaca API: Visit [Alpaca Support](https://alpaca.markets/support)
- This integration: Open an issue in this repository