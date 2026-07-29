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
  // Fetch Gold price via internal API route (bypassing CORS) with 1-hour interval caching
  fetchPrice: async (forceRefresh = false): Promise<XAUUSDPriceResult | null> => {
    try {
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

      // Call internal Next.js API route
      const res = await fetch('/api/xauusd');
      if (!res.ok) {
        throw new Error(`API Route error: ${res.status}`);
      }

      const data = await res.json();
      if (data?.price && !isNaN(data.price)) {
        const result: XAUUSDPriceResult = {
          price: Number(data.price),
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(XAUUSD_CACHE_KEY, JSON.stringify(result));
        return result;
      }

      const cached = localStorage.getItem(XAUUSD_CACHE_KEY);
      if (cached) return JSON.parse(cached);
      return null;
    } catch (err) {
      console.error('Error fetching XAUUSD price:', err);
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
      
      // Only auto-trigger SL/TP for OPEN trades where exitPrice is null
      if (!isGold || trade.exitPrice !== null) return trade;

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
          null,
          trade.symbol
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
