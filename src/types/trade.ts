export type Direction = 'BUY' | 'SELL';
export type Outcome = 'WIN' | 'LOSS' | 'BREAKEVEN';
export type CurrencyUnit = '$' | '฿' | 'pt';

export interface Trade {
  id: string;
  datetime: string;
  symbol: string;
  direction: Direction;
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  orderCount: number;
  technicalNote: string;
  pnl: number;
  pnlPercent: number;
  outcome: Outcome;
  rr: number;
}

export interface WeeklySummary {
  weekKey: string;
  label: string;
  tradesCount: number;
  wins: number;
  losses: number;
  totalPnL: number;
}

export interface MonthlySummary {
  monthKey: string;
  label: string;
  tradesCount: number;
  wins: number;
  losses: number;
  totalPnL: number;
}

export interface AllTimeStats {
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: string;
  tradesPerDay: string;
}
