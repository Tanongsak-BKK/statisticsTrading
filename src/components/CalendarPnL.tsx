'use client';

import React, { useState } from 'react';
import { Trade, CurrencyUnit, DailySummary } from '@/types/trade';
import { getDailyPnLMap, formatCurrency } from '@/utils/tradeUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';

interface CalendarPnLProps {
  trades: Trade[];
  currency: CurrencyUnit;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export const CalendarPnL: React.FC<CalendarPnLProps> = ({ trades, currency }) => {
  // Current visible month and year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // Selected daily summary for detail modal
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const dailyMap = getDailyPnLMap(trades);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar grid calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Today's formatted date string YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Monthly summary calculations
  let monthlyPnL = 0;
  let monthlyTradesCount = 0;
  let greenDaysCount = 0;
  let redDaysCount = 0;
  let breakevenDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const daySummary = dailyMap[dayStr];
    if (daySummary && daySummary.tradesCount > 0) {
      monthlyPnL += daySummary.totalPnL;
      monthlyTradesCount += daySummary.tradesCount;
      if (daySummary.totalPnL > 0) greenDaysCount++;
      else if (daySummary.totalPnL < 0) redDaysCount++;
      else breakevenDaysCount++;
    }
  }

  const tradingDaysCount = greenDaysCount + redDaysCount + breakevenDaysCount;
  const dayWinRate = tradingDaysCount > 0 ? ((greenDaysCount / tradingDaysCount) * 100).toFixed(1) : '0.0';

  // Build calendar cells array
  const calendarCells = [];

  // 1. Previous month padding days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    calendarCells.push({
      type: 'prev',
      dayNumber: prevDay,
      dateStr: null,
      data: null
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = dailyMap[dateStr] || null;
    calendarCells.push({
      type: 'current',
      dayNumber: d,
      dateStr,
      data
    });
  }

  // 3. Next month padding days to complete full grid (multiple of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      type: 'next',
      dayNumber: d,
      dateStr: null,
      data: null
    });
  }

  return (
    <div className="calendar-pnl-wrapper">
      {/* Month Header & Controls */}
      <div className="calendar-header-bar">
        <div className="calendar-month-title">
          <CalendarIcon className="w-5 h-5 text-accent" />
          <h2>
            {THAI_MONTHS[month]} {year + 543} <span className="text-muted font-normal text-sm">({year})</span>
          </h2>
        </div>

        <div className="calendar-controls">
          <button className="btn btn-outline btn-sm" onClick={handlePrevMonth} title="เดือนก่อนหน้า">
            <ChevronLeft className="w-4 h-4" /> เดือนก่อน
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleToday} title="ไปยังเดือนปัจจุบัน">
            ปัจจุบัน
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleNextMonth} title="เดือนถัดไป">
            เดือนถัดไป <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Summary KPI Bar */}
      <div className="calendar-summary-bar">
        <div className="summary-card">
          <span className="summary-label">กำไรสุทธิประจำเดือน</span>
          <span className={`summary-value font-bold ${monthlyPnL > 0 ? 'text-success' : monthlyPnL < 0 ? 'text-danger' : ''}`}>
            {formatCurrency(monthlyPnL, currency)}
          </span>
        </div>

        <div className="summary-card">
          <span className="summary-label">จำนวนวันที่เทรด</span>
          <span className="summary-value text-main font-semibold">
            {tradingDaysCount} วัน <span className="text-muted text-xs">({monthlyTradesCount} ไม้)</span>
          </span>
        </div>

        <div className="summary-card">
          <span className="summary-label">วันเขียว vs วันแดง</span>
          <div className="summary-value flex-align-center gap-2">
            <span className="badge badge-win flex-align-center gap-1">
              <TrendingUp className="w-3 h-3" /> {greenDaysCount} วัน
            </span>
            <span className="badge badge-loss flex-align-center gap-1">
              <TrendingDown className="w-3 h-3" /> {redDaysCount} วัน
            </span>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-label">อัตราวันชนะ (Day Win Rate)</span>
          <span className="summary-value text-accent font-bold">
            {dayWinRate}%
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-container">
        {/* Weekday Headers */}
        <div className="calendar-weekdays">
          {WEEKDAYS.map((wd, index) => (
            <div key={wd} className={`weekday-cell ${index === 0 || index === 6 ? 'weekend' : ''}`}>
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="calendar-days-grid">
          {calendarCells.map((cell, idx) => {
            if (cell.type !== 'current') {
              return (
                <div key={`empty-${idx}`} className="calendar-cell cell-disabled">
                  <span className="day-number text-dim">{cell.dayNumber}</span>
                </div>
              );
            }

            const isToday = cell.dateStr === todayStr;
            const hasData = cell.data && cell.data.tradesCount > 0;
            const dayPnL = hasData ? cell.data!.totalPnL : 0;

            let cellClass = 'calendar-cell cell-active';
            if (isToday) cellClass += ' cell-today';
            if (hasData) {
              cellClass += ' cell-has-trades';
              if (dayPnL > 0) cellClass += ' cell-pnl-win';
              else if (dayPnL < 0) cellClass += ' cell-pnl-loss';
              else cellClass += ' cell-pnl-neutral';
            }

            return (
              <div
                key={cell.dateStr}
                className={cellClass}
                onClick={() => hasData && setSelectedDay(cell.data)}
                style={{ cursor: hasData ? 'pointer' : 'default' }}
              >
                <div className="cell-top">
                  <span className={`day-number ${isToday ? 'today-badge' : ''}`}>{cell.dayNumber}</span>
                  {isToday && <span className="today-label">วันนี้</span>}
                </div>

                {hasData ? (
                  <div className="cell-body">
                    <div className={`pnl-amount ${dayPnL > 0 ? 'text-success' : dayPnL < 0 ? 'text-danger' : 'text-neutral'}`}>
                      {formatCurrency(dayPnL, currency)}
                    </div>
                    <div className="trade-count-badge">
                      {cell.data!.tradesCount} ไม้ ({cell.data!.wins}W/{cell.data!.losses}L)
                    </div>
                  </div>
                ) : (
                  <div className="cell-body empty-body">
                    <span className="no-trades-text">-</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Detail Modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content calendar-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-align-center gap-2">
                <CalendarIcon className="w-5 h-5 text-accent" />
                <h3>
                  รายงานการเทรดวันที่ {selectedDay.dateStr}
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDay(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              {/* Daily Summary Header */}
              <div className="daily-modal-summary">
                <div className="summary-item">
                  <span className="label">PnL สุทธิประจำวัน</span>
                  <span className={`val font-bold ${selectedDay.totalPnL > 0 ? 'text-success' : selectedDay.totalPnL < 0 ? 'text-danger' : ''}`}>
                    {formatCurrency(selectedDay.totalPnL, currency)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">จำนวนออเดอร์</span>
                  <span className="val font-semibold">{selectedDay.tradesCount} ไม้</span>
                </div>
                <div className="summary-item">
                  <span className="label">ผลการเทรด</span>
                  <span className="val">
                    <span className="text-success font-semibold">{selectedDay.wins} ชนะ</span> /{' '}
                    <span className="text-danger font-semibold">{selectedDay.losses} แพ้</span> /{' '}
                    <span className="text-muted font-semibold">{selectedDay.breakevens} เสมอ</span>
                  </span>
                </div>
              </div>

              {/* Trade List Table */}
              <div className="table-responsive mt-4">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>เวลา</th>
                      <th>สินทรัพย์</th>
                      <th>ประเภท</th>
                      <th>ขนาด (Lot)</th>
                      <th>ราคา Entry</th>
                      <th>ราคา Exit</th>
                      <th>กำไร/ขาดทุน (PnL)</th>
                      <th>RR</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDay.trades.map((t) => {
                      const timeStr = t.datetime ? new Date(t.datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
                      const pnlClass = t.pnl > 0 ? 'text-success' : t.pnl < 0 ? 'text-danger' : '';

                      return (
                        <tr key={t.id}>
                          <td><span className="text-muted flex-align-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span></td>
                          <td><strong>{t.symbol}</strong></td>
                          <td>
                            <span className={`badge ${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                              {t.direction}
                            </span>
                          </td>
                          <td>{t.lotSize}</td>
                          <td>{t.entryPrice}</td>
                          <td>{t.exitPrice ?? '-'}</td>
                          <td className={pnlClass}>
                            <strong>{formatCurrency(t.pnl, currency)}</strong>
                          </td>
                          <td>{t.rr ? `${t.rr} R` : '-'}</td>
                          <td>
                            <span className={`badge ${
                              t.outcome === 'WIN' ? 'badge-outcome-win' : t.outcome === 'LOSS' ? 'badge-outcome-loss' : 'badge-outcome-be'
                            }`}>
                              {t.outcome}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedDay(null)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
