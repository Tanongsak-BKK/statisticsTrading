'use client';

import React from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';
import { getTradeDateDetails, formatCurrency, calculateMaxLot } from '@/utils/tradeUtils';
import { Calendar, CalendarDays, Trophy, Wallet, TrendingUp, Edit2, Gauge, Layers } from 'lucide-react';

interface KPICardsProps {
  trades: Trade[];
  currency: CurrencyUnit;
  initialBalance: number;
  currentBalance: number;
  growthPercent: number;
  leverage: number;
  onOpenBalanceModal: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  trades,
  currency,
  initialBalance,
  currentBalance,
  growthPercent,
  leverage,
  onOpenBalanceModal
}) => {
  const now = new Date();
  const currentDetails = getTradeDateDetails(now.toISOString());

  let weekPnL = 0;
  let weekTrades = 0;
  let monthPnL = 0;
  let monthTrades = 0;
  let totalPnL = 0;
  let wins = 0;
  let losses = 0;
  let totalRRSum = 0;
  let rrCount = 0;

  const activeTrades = trades.filter(t => !t.isDeleted);

  activeTrades.forEach(t => {
    const details = getTradeDateDetails(t.datetime);
    const count = t.orderCount && t.orderCount > 0 ? t.orderCount : 1;
    totalPnL += t.pnl;

    if (t.outcome === 'WIN') wins += count;
    else if (t.outcome === 'LOSS') losses += count;

    if (t.rr > 0) {
      totalRRSum += t.rr * count;
      rrCount += count;
    }

    if (details.weekKey === currentDetails.weekKey) {
      weekPnL += t.pnl;
      weekTrades += count;
    }

    if (details.monthKey === currentDetails.monthKey) {
      monthPnL += t.pnl;
      monthTrades += count;
    }
  });

  const totalCompleted = wins + losses;
  const winRate = totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '0.0';
  const avgRR = rrCount > 0 ? (totalRRSum / rrCount).toFixed(2) : '0.0';

  const growthFormatted = `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(2)}%`;

  // Calculate Max Lot capacity for current balance & leverage
  const maxLotCapacity = calculateMaxLot(currentBalance, leverage, 1);

  return (
    <section className="kpi-grid">
      {/* Current Portfolio Balance */}
      <div className="kpi-card highlight-balance">
        <div className="kpi-head">
          <span><Wallet className="inline w-4 h-4 mr-1 text-indigo-400" /> ยอดเงินในพอร์ตปัจจุบัน (Current Balance)</span>
          <button
            onClick={onOpenBalanceModal}
            className="btn-inline-edit"
            title="ตั้งค่าเงินทุนและ Leverage"
          >
            <Edit2 className="w-3.5 h-3.5" /> แก้ไขทุน & Leverage
          </button>
        </div>
        <div className="kpi-body">
          <h2 className="pnl-val text-primary-gradient">
            {formatCurrency(currentBalance, currency)}
          </h2>
          <div className="kpi-sub flex justify-between items-center">
            <span>ทุนเริ่มต้น: <strong>{formatCurrency(initialBalance, currency)}</strong></span>
            <span className={`badge ${growthPercent >= 0 ? 'badge-outcome-win' : 'badge-outcome-loss'}`}>
              {growthFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Leverage & Purchasing Power */}
      <div className="kpi-card highlight-leverage">
        <div className="kpi-head">
          <span><Gauge className="inline w-4 h-4 mr-1 text-purple-400" /> Leverage & กำลังออก Lot</span>
          <span className="badge badge-info">1:{leverage}</span>
        </div>
        <div className="kpi-body">
          <h2>1:{leverage}</h2>
          <div className="kpi-sub flex justify-between items-center">
            <span>
              <Layers className="w-3.5 h-3.5 inline mr-1 text-muted" /> Lot สูงสุดที่ออกได้:
            </span>
            <strong className="text-indigo-300">
              ~{maxLotCapacity > 0 ? maxLotCapacity.toFixed(2) : '0.00'} Lot
            </strong>
          </div>
        </div>
      </div>

      {/* Portfolio Growth % */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span><TrendingUp className="inline w-4 h-4 mr-1 text-emerald-400" /> อัตราการเติบโตของพอร์ต (Growth)</span>
        </div>
        <div className="kpi-body">
          <h2 className={`pnl-val ${growthPercent > 0 ? 'text-success' : growthPercent < 0 ? 'text-danger' : ''}`}>
            {growthFormatted}
          </h2>
          <div className="kpi-sub">
            <span>ผลตอบแทนจากเงินทุนเริ่มต้น</span>
          </div>
        </div>
      </div>

      {/* Total Net PnL */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span><Wallet className="inline w-4 h-4 mr-1" /> กำไร/ขาดทุนสุทธิสะสม (Net PnL)</span>
        </div>
        <div className="kpi-body">
          <h2 className={`pnl-val ${totalPnL > 0 ? 'text-success' : totalPnL < 0 ? 'text-danger' : ''}`}>
            {formatCurrency(totalPnL, currency)}
          </h2>
          <div className="kpi-sub">
            <span>{trades.length} ออเดอร์ทั้งหมด</span> | Avg R:R <span>{avgRR}</span>
          </div>
        </div>
      </div>

      {/* Week PnL */}
      <div className="kpi-card highlight-week">
        <div className="kpi-head">
          <span><Calendar className="inline w-4 h-4 mr-1" /> ยอดรวมสัปดาห์นี้ (This Week)</span>
          <span className="badge badge-week">{currentDetails.weekLabel}</span>
        </div>
        <div className="kpi-body">
          <h2 className={`pnl-val ${weekPnL > 0 ? 'text-success' : weekPnL < 0 ? 'text-danger' : ''}`}>
            {formatCurrency(weekPnL, currency)}
          </h2>
          <div className="kpi-sub">
            <span>{weekTrades} ออเดอร์ในสัปดาห์นี้</span>
          </div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span><Trophy className="inline w-4 h-4 mr-1 text-amber-400" /> อัตราชนะรวม (Win Rate)</span>
        </div>
        <div className="kpi-body">
          <h2>{winRate}%</h2>
          <div className="kpi-sub">
            <span>{wins} ชนะ / {losses} แพ้</span>
          </div>
        </div>
      </div>
    </section>
  );
};
