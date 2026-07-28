'use client';

import React from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';
import { getTradeDateDetails, formatCurrency } from '@/utils/tradeUtils';
import { Calendar, CalendarDays, Trophy, Wallet, TrendingUp, Edit2 } from 'lucide-react';

interface KPICardsProps {
  trades: Trade[];
  currency: CurrencyUnit;
  initialBalance: number;
  currentBalance: number;
  growthPercent: number;
  onOpenBalanceModal: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  trades,
  currency,
  initialBalance,
  currentBalance,
  growthPercent,
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

  trades.forEach(t => {
    const details = getTradeDateDetails(t.datetime);
    totalPnL += t.pnl;

    if (t.outcome === 'WIN') wins++;
    else if (t.outcome === 'LOSS') losses++;

    if (t.rr > 0) {
      totalRRSum += t.rr;
      rrCount++;
    }

    if (details.weekKey === currentDetails.weekKey) {
      weekPnL += t.pnl;
      weekTrades++;
    }

    if (details.monthKey === currentDetails.monthKey) {
      monthPnL += t.pnl;
      monthTrades++;
    }
  });

  const totalCompleted = wins + losses;
  const winRate = totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '0.0';
  const avgRR = rrCount > 0 ? (totalRRSum / rrCount).toFixed(2) : '0.0';

  const growthFormatted = `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(2)}%`;

  return (
    <section className="kpi-grid">
      {/* Current Portfolio Balance */}
      <div className="kpi-card highlight-balance">
        <div className="kpi-head">
          <span><Wallet className="inline w-4 h-4 mr-1 text-indigo-400" /> ยอดเงินในพอร์ตปัจจุบัน (Current Balance)</span>
          <button
            onClick={onOpenBalanceModal}
            className="btn-inline-edit"
            title="ตั้งค่าเงินทุนเริ่มต้น"
          >
            <Edit2 className="w-3.5 h-3.5" /> แก้ไขทุน
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

      {/* Month PnL */}
      <div className="kpi-card highlight-month">
        <div className="kpi-head">
          <span><CalendarDays className="inline w-4 h-4 mr-1" /> ยอดรวมเดือนนี้ (This Month)</span>
          <span className="badge badge-month">{currentDetails.monthYearLabel}</span>
        </div>
        <div className="kpi-body">
          <h2 className={`pnl-val ${monthPnL > 0 ? 'text-success' : monthPnL < 0 ? 'text-danger' : ''}`}>
            {formatCurrency(monthPnL, currency)}
          </h2>
          <div className="kpi-sub">
            <span>{monthTrades} ออเดอร์ในเดือนนี้</span>
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
