import { Trade, Direction, Outcome, WeeklySummary, MonthlySummary, AllTimeStats, CurrencyUnit } from '@/types/trade';

export function getTradeDateDetails(dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const monthYearLabel = `${d.toLocaleString('th-TH', { month: 'short' })} ${year}`;

  // Calculate ISO Week Number
  const target = new Date(d.valueOf());
  const dayNumber = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNo = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
  
  const weekKey = `${year}-W${String(weekNo).padStart(2, '0')}`;
  const monthKey = `${year}-${month}`;

  return {
    year,
    monthKey,
    weekKey,
    monthYearLabel,
    weekLabel: `W${weekNo} (${year})`
  };
}

export function getContractSize(symbol: string): number {
  if (!symbol) return 100;
  const s = symbol.trim().toUpperCase();
  if (s === 'XAUUSD' || s === 'GOLD' || s === 'XAU') {
    return 100; // 1.0 Lot Gold = 100 oz
  }
  if (s === 'XAGUSD' || s === 'SILVER') {
    return 5000; // 1.0 Lot Silver = 5,000 oz
  }
  if ((s.length === 6 || s.includes('/')) && !s.includes('BTC') && !s.includes('ETH')) {
    return 100000; // Forex pairs (EURUSD, GBPUSD, etc.): 1.0 Lot = 100,000 units
  }
  return 100; // Default contract size
}

export function detectTradingSession(datetimeStr?: string): 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' {
  const d = datetimeStr ? new Date(datetimeStr) : new Date();
  if (isNaN(d.getTime())) return 'ASIAN';
  const hours = d.getHours();

  if (hours >= 19 && hours < 23) return 'OVERLAP';
  if (hours >= 23 || hours < 5) return 'NEW_YORK';
  if (hours >= 14 && hours < 19) return 'LONDON';
  return 'ASIAN';
}


export function calculateTradeMetrics(
  entry: number,
  exit: number | null,
  lot: number,
  dir: Direction,
  sl: number | null,
  tp: number | null,
  userPnl: number | null,
  symbol: string = 'XAUUSD',
  orderCount: number = 1,
  commission: number = 0,
  swap: number = 0
) {
  const contractSize = getContractSize(symbol);
  const totalLots = lot * (orderCount || 1);
  let pnl = 0;
  let pnlPercent = 0;
  let outcome: Outcome = 'OPEN';

  // If exit price is provided, order is CLOSED -> Calculate final PnL and outcome
  if (exit !== null && !isNaN(exit)) {
    if (userPnl !== null && !isNaN(userPnl)) {
      pnl = userPnl;
    } else {
      let grossPnL = 0;
      if (dir === 'BUY') {
        grossPnL = (exit - entry) * totalLots * contractSize;
      } else {
        grossPnL = (entry - exit) * totalLots * contractSize;
      }
      pnl = grossPnL - (commission || 0) + (swap || 0);
    }



    if (entry > 0) {
      if (dir === 'BUY') {
        pnlPercent = ((exit - entry) / entry) * 100;
      } else {
        pnlPercent = ((entry - exit) / entry) * 100;
      }
    }

    // Direction-based TP vs SL outcome comparison:
    // BUY: Exit > Entry => TP (WIN), Exit < Entry => SL (LOSS)
    // SELL: Exit < Entry => TP (WIN), Exit > Entry => SL (LOSS)
    if (dir === 'BUY') {
      if (exit > entry) outcome = 'WIN';
      else if (exit < entry) outcome = 'LOSS';
      else outcome = 'BREAKEVEN';
    } else {
      if (exit < entry) outcome = 'WIN';
      else if (exit > entry) outcome = 'LOSS';
      else outcome = 'BREAKEVEN';
    }
  }


  let rr = 0;
  if (sl && tp && sl !== entry) {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk > 0) {
      rr = parseFloat((reward / risk).toFixed(2));
    }
  }

  return {
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    outcome,
    rr,
    contractSize
  };
}



export function formatCurrency(val: number, currency: CurrencyUnit = '$'): string {
  const prefix = currency === 'pt' ? '' : currency;
  const suffix = currency === 'pt' ? ' pts' : '';
  const sign = val < 0 ? '-' : '';
  const absVal = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${prefix}${absVal}${suffix}`;
}

export function getWeeklySummaries(trades: Trade[]): WeeklySummary[] {
  const map: Record<string, WeeklySummary> = {};

  trades.forEach(t => {
    const details = getTradeDateDetails(t.datetime);
    const key = details.weekKey;

    if (!map[key]) {
      map[key] = {
        weekKey: key,
        label: details.weekLabel,
        tradesCount: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0
      };
    }

    map[key].tradesCount++;
    map[key].totalPnL += t.pnl;
    if (t.outcome === 'WIN') map[key].wins++;
    else if (t.outcome === 'LOSS') map[key].losses++;
  });

  return Object.keys(map).sort().map(k => map[k]);
}

export function getMonthlySummaries(trades: Trade[]): MonthlySummary[] {
  const map: Record<string, MonthlySummary> = {};

  trades.forEach(t => {
    const details = getTradeDateDetails(t.datetime);
    const key = details.monthKey;

    if (!map[key]) {
      map[key] = {
        monthKey: key,
        label: details.monthYearLabel,
        tradesCount: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0
      };
    }

    map[key].tradesCount++;
    map[key].totalPnL += t.pnl;
    if (t.outcome === 'WIN') map[key].wins++;
    else if (t.outcome === 'LOSS') map[key].losses++;
  });

  return Object.keys(map).sort().map(k => map[k]);
}

export function getAllTimeStats(trades: Trade[]): AllTimeStats {
  if (trades.length === 0) {
    return {
      bestTrade: 0,
      worstTrade: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: '0.00',
      tradesPerDay: '0.0'
    };
  }

  const pnls = trades.map(t => t.pnl);
  const maxWin = Math.max(...pnls);
  const maxLoss = Math.min(...pnls);

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);

  const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

  const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? (totalLossAmount / losingTrades.length) * -1 : 0;

  const profitFactor = totalLossAmount > 0 
    ? (totalWinAmount / totalLossAmount).toFixed(2) 
    : (totalWinAmount > 0 ? '∞' : '0.00');

  const dates = trades.map(t => new Date(t.datetime).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const diffDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 3600 * 24)));
  const tradesPerDay = (trades.length / diffDays).toFixed(1);

  return {
    bestTrade: maxWin > 0 ? maxWin : 0,
    worstTrade: maxLoss < 0 ? maxLoss : 0,
    avgWin,
    avgLoss,
    profitFactor,
    tradesPerDay
  };
}

export function calculateRequiredMargin(
  lotSize: number,
  entryPrice: number,
  leverage: number,
  contractSize: number = 100000
): number {
  if (!lotSize || lotSize <= 0 || !leverage || leverage <= 0) return 0;
  const price = entryPrice && entryPrice > 0 ? entryPrice : 1;
  return (lotSize * contractSize * price) / leverage;
}

export function calculateMaxLot(
  balance: number,
  leverage: number,
  entryPrice: number,
  contractSize: number = 100000
): number {
  if (!balance || balance <= 0 || !leverage || leverage <= 0) return 0;
  const price = entryPrice && entryPrice > 0 ? entryPrice : 1;
  return (balance * leverage) / (contractSize * price);
}

