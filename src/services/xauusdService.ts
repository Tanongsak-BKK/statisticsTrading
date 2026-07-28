import { Trade } from '@/types/trade';
import { calculateTradeMetrics } from '@/utils/tradeUtils';

const XAUUSD_CACHE_KEY = 'statistics_xauusd_price_cache';
const ONE_HOUR_MS = 60 * 60 * 1000;

export interface XAUUSDPriceResult {
  price: number;
  lastUpdated: string;
  isMock?: boolean;
}

export const xauusdService = {
  // Fetch Gold price from CommodityPriceAPI with 1-hour interval caching
  fetchPrice: async (forceRefresh = false): Promise<XAUUSDPriceResult | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_COMMODITY_PRICE_API_KEY;

      // Check cache first if not forced
      if (!forceRefresh) {
        const cached = localStorage.getItem(XAUUSD_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as XAUUSDPriceResult;
          const timeDiff = Date.now() - new Date(parsed.lastUpdated).getTime();
          if (timeDiff < ONE_HOUR_MS) {
            return parsed;
          }
        }
      }

      if (!apiKey) {
        console.log('CommodityPriceAPI key not configured in .env.local');
        return null;
      }

      // Fetch from commoditypriceapi.com
      const res = await fetch(`https://commoditypriceapi.com/api/v1/latest?symbol=XAU&api_key=${apiKey}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      // Extract price (handling various response formats from commoditypriceapi)
      const fetchedPrice = data?.data?.price || data?.data?.rates?.XAU || data?.price;
      
      if (fetchedPrice && !isNaN(fetchedPrice)) {
        const result: XAUUSDPriceResult = {
          price: parseFloat(fetchedPrice),
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(XAUUSD_CACHE_KEY, JSON.stringify(result));
        return result;
      }

      return null;
    } catch (err) {
      console.error('Error fetching XAUUSD price from CommodityPriceAPI:', err);
      // Return cached fallback if available
      const cached = localStorage.getItem(XAUUSD_CACHE_KEY);
      if (cached) return JSON.parse(cached);
      return null;
    }
  },

  // Auto-check XAUUSD trades against current price for SL/TP hits
  checkAutoSLTP: (trades: Trade[], currentPrice: number): { updatedTrades: Trade[]; hasChanges: boolean } => {
    if (!currentPrice || currentPrice <= 0) return { updatedTrades: trades, hasChanges: false };

    let hasChanges = false;
    const updatedTrades = trades.map(trade => {
      const symbolUpper = trade.symbol.toUpperCase();
      const isGold = symbolUpper === 'XAUUSD' || symbolUpper === 'GOLD' || symbolUpper === 'XAU';
      
      if (!isGold) return trade;

      let triggeredExitPrice: number | null = null;
      let triggerReason = '';

      if (trade.direction === 'BUY') {
        // BUY: TP hit if price >= TP
        if (trade.takeProfit !== null && currentPrice >= trade.takeProfit) {
          triggeredExitPrice = trade.takeProfit;
          triggerReason = `[Auto TP Triggered @ ${currentPrice}]`;
        }
        // BUY: SL hit if price <= SL
        else if (trade.stopLoss !== null && currentPrice <= trade.stopLoss) {
          triggeredExitPrice = trade.stopLoss;
          triggerReason = `[Auto SL Triggered @ ${currentPrice}]`;
        }
      } else if (trade.direction === 'SELL') {
        // SELL: TP hit if price <= TP
        if (trade.takeProfit !== null && currentPrice <= trade.takeProfit) {
          triggeredExitPrice = trade.takeProfit;
          triggerReason = `[Auto TP Triggered @ ${currentPrice}]`;
        }
        // SELL: SL hit if price >= SL
        else if (trade.stopLoss !== null && currentPrice >= trade.stopLoss) {
          triggeredExitPrice = trade.stopLoss;
          triggerReason = `[Auto SL Triggered @ ${currentPrice}]`;
        }
      }

      if (triggeredExitPrice !== null && trade.exitPrice !== triggeredExitPrice) {
        hasChanges = true;
        const metrics = calculateTradeMetrics(
          trade.entryPrice,
          triggeredExitPrice,
          trade.lotSize,
          trade.direction,
          trade.stopLoss,
          trade.takeProfit,
          null
        );

        const newNote = trade.technicalNote
          ? `${trade.technicalNote} ${triggerReason}`
          : triggerReason;

        return {
          ...trade,
          exitPrice: triggeredExitPrice,
          pnl: metrics.pnl,
          pnlPercent: metrics.pnlPercent,
          outcome: metrics.outcome,
          rr: metrics.rr,
          technicalNote: newNote
        };
      }

      return trade;
    });

    return { updatedTrades, hasChanges };
  }
};
