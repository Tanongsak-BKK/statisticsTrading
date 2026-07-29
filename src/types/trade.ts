export type Direction = 'BUY' | 'SELL';
export type Outcome = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
export type CurrencyUnit = '$' | '฿' | 'pt';

export type TradingSession = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'OTHER';

export interface Trade {
  id: string;
  datetime: string;
  symbol: string;
  direction: Direction;
  lotSize: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  orderCount: number;
  technicalNote: string;
  pnl: number;
  pnlPercent: number;
  outcome: Outcome;
  rr: number;

  // New Enhanced Fields
  commission?: number;
  swap?: number;
  strategy?: string;
  session?: TradingSession | string;
  chartUrl?: string;
  isDeleted?: boolean;
  deletedAt?: string;
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

export interface DailySummary {
  dateStr: string;
  totalPnL: number;
  tradesCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  trades: Trade[];
}

export interface AllTimeStats {
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: string;
  tradesPerDay: string;
}

