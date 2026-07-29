'use client';

import React, { useState } from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';
import {
  getWeeklySummaries,
  getMonthlySummaries,
  getAllTimeStats,
  formatCurrency
} from '@/utils/tradeUtils';
import { WeeklyChart } from './WeeklyChart';
import { MonthlyChart } from './MonthlyChart';
import { CalendarPnL } from './CalendarPnL';
import { BarChart3, LineChart, Calendar as CalendarIcon, ListChecks, Coins } from 'lucide-react';

interface AnalyticsSectionProps {
  trades: Trade[];
  currency: CurrencyUnit;
  onCurrencyChange: (c: CurrencyUnit) => void;
  initialBalance: number;
  currentBalance: number;
  growthPercent: number;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  trades,
  currency,
  onCurrencyChange,
  initialBalance,
  currentBalance,
  growthPercent
}) => {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'calendar' | 'all'>('week');

  const weeklySummaries = getWeeklySummaries(trades);
  const monthlySummaries = getMonthlySummaries(trades);
  const allTimeStats = getAllTimeStats(trades);

  const growthFormatted = `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(2)}%`;

  return (
    <section className="card analytics-section">
      <div className="card-header">
        <div className="tab-group">
          <button
            className={`tab-btn ${activeTab === 'week' ? 'active' : ''}`}
            onClick={() => setActiveTab('week')}
          >
            <BarChart3 className="w-4 h-4" /> สรุปผลรายสัปดาห์ (Weekly Total)
          </button>
          <button
            className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => setActiveTab('month')}
          >
            <LineChart className="w-4 h-4" /> สรุปผลรายเดือน (Monthly Total)
          </button>
          <button
            className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon className="w-4 h-4" /> ปฏิทิน PnL (Calendar PnL)
          </button>
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <ListChecks className="w-4 h-4" /> ภาพรวมทั้งหมด (All Time & Balance)
          </button>
        </div>

        <div className="period-selector">
          <Coins className="w-4 h-4 text-muted" />
          <label htmlFor="currency-unit" className="text-muted text-xs">สกุลเงิน:</label>
          <select
            id="currency-unit"
            className="select-sm"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyUnit)}
          >
            <option value="$">USD ($)</option>
            <option value="฿">THB (฿)</option>
            <option value="pt">Points / Pips</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Weekly Breakdown */}
      {activeTab === 'week' && (
        <div className="tab-content active">
          <div className="chart-grid">
            <div className="chart-container">
              <h3>
                <BarChart3 className="w-4 h-4" /> กำไร/ขาดทุนสุทธิ แยกตามสัปดาห์ (Weekly Net PnL)
              </h3>
              {weeklySummaries.length > 0 ? (
                <div style={{ height: '260px' }}>
                  <WeeklyChart summaries={weeklySummaries} currency={currency} />
                </div>
              ) : (
                <p className="text-muted text-center py-10">ยังไม่มีข้อมูลรายการเทรด</p>
              )}
            </div>

            <div className="summary-table-wrapper">
              <h3>
                <ListChecks className="w-4 h-4" /> รายงานยอดรวมรายสัปดาห์ (Weekly Summary List)
              </h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>สัปดาห์ (Week)</th>
                      <th>ออเดอร์</th>
                      <th>Win Rate</th>
                      <th>กำไรสุทธิ (PnL)</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklySummaries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted text-center py-4">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      [...weeklySummaries].reverse().map(item => {
                        const winRate =
                          item.wins + item.losses > 0
                            ? ((item.wins / (item.wins + item.losses)) * 100).toFixed(0) + '%'
                            : '-';
                        const pnlClass =
                          item.totalPnL > 0 ? 'text-success' : item.totalPnL < 0 ? 'text-danger' : '';

                        return (
                          <tr key={item.weekKey}>
                            <td><strong>{item.label}</strong></td>
                            <td>{item.tradesCount} ไม้</td>
                            <td>{winRate} ({item.wins}W / {item.losses}L)</td>
                            <td className={pnlClass}>
                              <strong>{formatCurrency(item.totalPnL, currency)}</strong>
                            </td>
                            <td>
                              <span className={`badge ${item.totalPnL >= 0 ? 'badge-outcome-win' : 'badge-outcome-loss'}`}>
                                {item.totalPnL >= 0 ? 'PROFIT' : 'LOSS'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Breakdown */}
      {activeTab === 'month' && (
        <div className="tab-content active">
          <div className="chart-grid">
            <div className="chart-container">
              <h3>
                <LineChart className="w-4 h-4" /> เส้นทางการเติบโตพอร์ตรายเดือน (Monthly Equity Curve)
              </h3>
              {monthlySummaries.length > 0 ? (
                <div style={{ height: '260px' }}>
                  <MonthlyChart summaries={monthlySummaries} currency={currency} />
                </div>
              ) : (
                <p className="text-muted text-center py-10">ยังไม่มีข้อมูลรายการเทรด</p>
              )}
            </div>

            <div className="summary-table-wrapper">
              <h3>
                <ListChecks className="w-4 h-4" /> รายงานยอดรวมรายเดือน (Monthly Summary List)
              </h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>เดือน (Month)</th>
                      <th>ออเดอร์</th>
                      <th>Win Rate</th>
                      <th>กำไรสุทธิ (PnL)</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummaries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted text-center py-4">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      [...monthlySummaries].reverse().map(item => {
                        const winRate =
                          item.wins + item.losses > 0
                            ? ((item.wins / (item.wins + item.losses)) * 100).toFixed(0) + '%'
                            : '-';
                        const pnlClass =
                          item.totalPnL > 0 ? 'text-success' : item.totalPnL < 0 ? 'text-danger' : '';

                        return (
                          <tr key={item.monthKey}>
                            <td><strong>{item.label}</strong></td>
                            <td>{item.tradesCount} ไม้</td>
                            <td>{winRate} ({item.wins}W / {item.losses}L)</td>
                            <td className={pnlClass}>
                              <strong>{formatCurrency(item.totalPnL, currency)}</strong>
                            </td>
                            <td>
                              <span className={`badge ${item.totalPnL >= 0 ? 'badge-outcome-win' : 'badge-outcome-loss'}`}>
                                {item.totalPnL >= 0 ? 'PROFIT' : 'LOSS'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Calendar PnL Grid */}
      {activeTab === 'calendar' && (
        <div className="tab-content active">
          <CalendarPnL trades={trades} currency={currency} />
        </div>
      )}

      {/* Tab 4: All Time Stats & Portfolio Balance Overview */}
      {activeTab === 'all' && (
        <div className="tab-content active">
          <div className="stats-overview-grid">
            <div className="stat-box highlight-stat">
              <span className="stat-label">Initial Balance (เงินทุนเริ่มต้น)</span>
              <span className="stat-value text-muted">
                {formatCurrency(initialBalance, currency)}
              </span>
            </div>
            <div className="stat-box highlight-stat">
              <span className="stat-label">Current Balance (ยอดเงินพอร์ตปัจจุบัน)</span>
              <span className="stat-value text-primary-gradient font-bold">
                {formatCurrency(currentBalance, currency)}
              </span>
            </div>
            <div className="stat-box highlight-stat">
              <span className="stat-label">Portfolio Return (% การเติบโต)</span>
              <span className={`stat-value ${growthPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {growthFormatted}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Best Trade (กำไรสูงสุด)</span>
              <span className="stat-value text-success">
                {formatCurrency(allTimeStats.bestTrade, currency)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Worst Trade (ขาดทุนสูงสุด)</span>
              <span className="stat-value text-danger">
                {formatCurrency(allTimeStats.worstTrade, currency)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average Win (กำไรเฉลี่ย)</span>
              <span className="stat-value text-success">
                {formatCurrency(allTimeStats.avgWin, currency)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average Loss (ขาดทุนเฉลี่ย)</span>
              <span className="stat-value text-danger">
                {formatCurrency(allTimeStats.avgLoss, currency)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Profit Factor</span>
              <span className="stat-value">{allTimeStats.profitFactor}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">เฉลี่ยออเดอร์/วัน</span>
              <span className="stat-value">{allTimeStats.tradesPerDay} /วัน</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

