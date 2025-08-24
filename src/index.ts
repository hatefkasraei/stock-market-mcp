#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { MarketDataService } from './services/marketData.js';
import { TechnicalAnalysisService } from './services/technicalAnalysis.js';
import { OptionsService } from './services/options.js';
import { FundamentalService } from './services/fundamental.js';
import { MarketIntelligenceService } from './services/marketIntelligence.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the project root (go up from src/ to project root)
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

// Debug logging to confirm environment loading
if (result.error) {
  console.error('Warning: Could not load .env file from', envPath);
  console.error('Error:', result.error.message);
} else {
  console.error('Loaded .env file from:', envPath);
  console.error('API Key configured:', !!process.env.ALPHA_VANTAGE_API_KEY);
  console.error('Data Provider:', process.env.DATA_PROVIDER || 'not set');
}

const server = new Server(
  {
    name: 'stock-market-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize services
const marketData = new MarketDataService();
const technicalAnalysis = new TechnicalAnalysisService();
const options = new OptionsService();
const fundamental = new FundamentalService();
const marketIntelligence = new MarketIntelligenceService();

// Tool schemas
const tools: Tool[] = [
  // Market Data Tools
  {
    name: 'get_quote',
    description: 'Get real-time quote for a stock symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock symbol (e.g., AAPL)' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_historical_data',
    description: 'Get historical OHLCV data for a symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        period: { 
          type: 'string', 
          enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
          description: 'Time period for historical data'
        },
        interval: {
          type: 'string',
          enum: ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'],
          description: 'Data interval'
        }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_market_depth',
    description: 'Get Level 2 market depth data',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' }
      },
      required: ['symbol']
    }
  },
  
  // Technical Analysis Tools
  {
    name: 'calculate_indicators',
    description: 'Calculate technical indicators for a symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        indicators: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['RSI', 'MACD', 'BB', 'SMA', 'EMA', 'STOCH', 'ADX', 'ATR', 'OBV', 'VWAP']
          },
          description: 'List of indicators to calculate'
        },
        period: { type: 'string', default: '3mo' }
      },
      required: ['symbol', 'indicators']
    }
  },
  {
    name: 'identify_patterns',
    description: 'Identify chart patterns in price data',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        patterns: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['head_shoulders', 'triangle', 'flag', 'wedge', 'double_top', 'double_bottom', 'cup_handle']
          },
          description: 'Patterns to search for (empty for all)'
        },
        period: { type: 'string', default: '6mo' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'find_support_resistance',
    description: 'Find support and resistance levels',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        period: { type: 'string', default: '3mo' },
        sensitivity: { 
          type: 'number', 
          minimum: 1, 
          maximum: 10, 
          default: 5,
          description: 'Sensitivity for level detection (1-10)'
        }
      },
      required: ['symbol']
    }
  },
  
  // Options Trading Tools
  {
    name: 'get_options_chain',
    description: 'Get options chain for a symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        expiration: { 
          type: 'string', 
          description: 'Expiration date (YYYY-MM-DD) or "all"' 
        },
        type: { 
          type: 'string', 
          enum: ['call', 'put', 'both'],
          default: 'both'
        },
        moneyness: {
          type: 'string',
          enum: ['itm', 'atm', 'otm', 'all'],
          default: 'all'
        }
      },
      required: ['symbol']
    }
  },
  {
    name: 'calculate_greeks',
    description: 'Calculate option Greeks',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        strike: { type: 'number' },
        expiration: { type: 'string' },
        type: { type: 'string', enum: ['call', 'put'] }
      },
      required: ['symbol', 'strike', 'expiration', 'type']
    }
  },
  {
    name: 'find_unusual_options',
    description: 'Find unusual options activity',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol or "all" for market-wide scan' },
        min_volume_ratio: { 
          type: 'number', 
          default: 2,
          description: 'Minimum volume/OI ratio'
        },
        min_premium: {
          type: 'number',
          default: 10000,
          description: 'Minimum premium value'
        }
      }
    }
  },
  
  // Fundamental Analysis Tools
  {
    name: 'get_financials',
    description: 'Get financial statements',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        statement: {
          type: 'string',
          enum: ['income', 'balance', 'cash_flow', 'all']
        },
        period: {
          type: 'string',
          enum: ['annual', 'quarterly'],
          default: 'quarterly'
        }
      },
      required: ['symbol', 'statement']
    }
  },
  {
    name: 'get_earnings',
    description: 'Get earnings history and estimates',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        include_estimates: { type: 'boolean', default: true }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_analyst_ratings',
    description: 'Get analyst ratings and price targets',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_insider_trading',
    description: 'Get insider trading activity',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        days: { type: 'number', default: 90 }
      },
      required: ['symbol']
    }
  },
  
  // Market Intelligence Tools
  {
    name: 'get_news_sentiment',
    description: 'Get news and sentiment analysis',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        days: { type: 'number', default: 7 },
        min_relevance: { type: 'number', default: 0.5 }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_social_sentiment',
    description: 'Get social media sentiment analysis',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['reddit', 'twitter', 'stocktwits', 'all'] },
          default: ['all']
        }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_sector_performance',
    description: 'Get sector rotation and performance data',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', default: '1d' }
      }
    }
  },
  {
    name: 'get_market_breadth',
    description: 'Get market breadth indicators',
    inputSchema: {
      type: 'object',
      properties: {
        indicators: {
          type: 'array',
          items: { 
            type: 'string', 
            enum: ['advance_decline', 'new_highs_lows', 'mcclellan', 'put_call_ratio'] 
          },
          default: ['advance_decline']
        }
      }
    }
  },
  {
    name: 'analyze_stock',
    description: 'Comprehensive analysis combining technical, fundamental, and sentiment data',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        include: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['technical', 'fundamental', 'sentiment', 'options', 'all']
          },
          default: ['all']
        }
      },
      required: ['symbol']
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!args) {
    throw new Error('No arguments provided');
  }
  
  try {
    switch (name) {
      // Market Data
      case 'get_quote':
        return await marketData.getQuote(args.symbol as string);
      
      case 'get_historical_data':
        return await marketData.getHistoricalData(
          args.symbol as string, 
          (args.period as string) || '3mo',
          (args.interval as string) || '1d'
        );
      
      case 'get_market_depth':
        return await marketData.getMarketDepth(args.symbol as string);
      
      // Technical Analysis
      case 'calculate_indicators':
        return await technicalAnalysis.calculateIndicators(
          args.symbol as string,
          args.indicators as string[],
          (args.period as string) || '3mo'
        );
      
      case 'identify_patterns':
        return await technicalAnalysis.identifyPatterns(
          args.symbol as string,
          (args.patterns as string[]) || [],
          (args.period as string) || '6mo'
        );
      
      case 'find_support_resistance':
        return await technicalAnalysis.findSupportResistance(
          args.symbol as string,
          (args.period as string) || '3mo',
          (args.sensitivity as number) || 5
        );
      
      // Options
      case 'get_options_chain':
        return await options.getOptionsChain(
          args.symbol as string,
          args.expiration as string | undefined,
          (args.type as string) || 'both',
          (args.moneyness as string) || 'all'
        );
      
      case 'calculate_greeks':
        return await options.calculateGreeks(
          args.symbol as string,
          args.strike as number,
          args.expiration as string,
          args.type as string
        );
      
      case 'find_unusual_options':
        return await options.findUnusualOptions(
          args.symbol as string | undefined,
          (args.min_volume_ratio as number) || 2,
          (args.min_premium as number) || 10000
        );
      
      // Fundamental
      case 'get_financials':
        return await fundamental.getFinancials(
          args.symbol as string,
          args.statement as string,
          (args.period as string) || 'quarterly'
        );
      
      case 'get_earnings':
        return await fundamental.getEarnings(
          args.symbol as string,
          (args.include_estimates as boolean) !== false
        );
      
      case 'get_analyst_ratings':
        return await fundamental.getAnalystRatings(args.symbol as string);
      
      case 'get_insider_trading':
        return await fundamental.getInsiderTrading(
          args.symbol as string,
          (args.days as number) || 90
        );
      
      // Market Intelligence
      case 'get_news_sentiment':
        return await marketIntelligence.getNewsSentiment(
          args.symbol as string,
          (args.days as number) || 7,
          (args.min_relevance as number) || 0.5
        );
      
      case 'get_social_sentiment':
        return await marketIntelligence.getSocialSentiment(
          args.symbol as string,
          (args.sources as string[]) || ['all']
        );
      
      case 'get_sector_performance':
        return await marketIntelligence.getSectorPerformance(
          (args.period as string) || '1d'
        );
      
      case 'get_market_breadth':
        return await marketIntelligence.getMarketBreadth(
          (args.indicators as string[]) || ['advance_decline']
        );
      
      case 'analyze_stock':
        return await analyzeStock(
          args.symbol as string,
          (args.include as string[]) || ['all']
        );
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
});

// Comprehensive stock analysis
async function analyzeStock(symbol: string, include: string[]) {
  const includeAll = include.includes('all');
  const results: any = { symbol };
  
  if (includeAll || include.includes('technical')) {
    const [indicators, patterns, levels] = await Promise.all([
      technicalAnalysis.calculateIndicators(symbol, ['RSI', 'MACD', 'BB'], '3mo'),
      technicalAnalysis.identifyPatterns(symbol, [], '6mo'),
      technicalAnalysis.findSupportResistance(symbol, '3mo', 5)
    ]);
    results.technical = { indicators, patterns, levels };
  }
  
  if (includeAll || include.includes('fundamental')) {
    const [financials, earnings, ratings] = await Promise.all([
      fundamental.getFinancials(symbol, 'income', 'quarterly'),
      fundamental.getEarnings(symbol, true),
      fundamental.getAnalystRatings(symbol)
    ]);
    results.fundamental = { financials, earnings, ratings };
  }
  
  if (includeAll || include.includes('sentiment')) {
    const [news, social] = await Promise.all([
      marketIntelligence.getNewsSentiment(symbol, 7, 0.5),
      marketIntelligence.getSocialSentiment(symbol, ['all'])
    ]);
    results.sentiment = { news, social };
  }
  
  if (includeAll || include.includes('options')) {
    const [chain, unusual] = await Promise.all([
      options.getOptionsChain(symbol, undefined, 'both', 'atm'),
      options.findUnusualOptions(symbol, 2, 10000)
    ]);
    results.options = { chain, unusual };
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }
    ]
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stock Market MCP Server running on stdio');
}

main().catch(console.error);