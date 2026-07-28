'use client';

import React, { useState } from 'react';
import { Trade, CurrencyUnit, Direction, Outcome } from '@/types/trade';
import { formatCurrency } from '@/utils/tradeUtils';
import { Search, List, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface TradeLogTableProps {
  trades: Trade[];
  currency: CurrencyUnit;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export const TradeLogTable: React.FC<TradeLogTableProps> = ({
  trades,
  currency,
  onEdit,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');

  const filteredTrades = trades.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      t.symbol.toLowerCase().includes(term) ||
      (t.technicalNote && t.technicalNote.toLowerCase().includes(term));
    const matchDir = directionFilter === 'ALL' || t.direction === directionFilter;
    const matchOutcome = outcomeFilter === 'ALL' || t.outcome === outcomeFilter;
    return matchSearch && matchDir && matchOutcome;
  });

  return (
    <section className="card trade-log-section">
      <div className="card-header border-bottom">
        <div className="title-with-count">
          <h2>
            <List className="inline w-5 h-5 mr-2" /> ตารางบันทึกประวัติการเทรด (Trade Log)
          </h2>
          <span className="badge badge-info">{filteredTrades.length} รายการ</span>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <Search className="search-icon w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="ค้นหา หุ้น, Technical setup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select-sm"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
          >
            <option value="ALL">ทุกฝั่ง (Buy/Sell)</option>
            <option value="BUY">Buy / Long</option>
            <option value="SELL">Sell / Short</option>
          </select>
          <select
            className="select-sm"
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
          >
            <option value="ALL">ทุกผลลัพธ์</option>
            <option value="OPEN">🔵 ถือออเดอร์อยู่ (Open)</option>
            <option value="WIN">🟢 กำไร (Win)</option>
            <option value="LOSS">🔴 ขาดทุน (Loss)</option>
            <option value="BREAKEVEN">⚪ เสมอตัว (Breakeven)</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>วันเวลา</th>
              <th>หุ้น/สินทรัพย์</th>
              <th>ฝั่ง</th>
              <th>Lot / Position</th>
              <th>ราคาเข้า - ออก</th>
              <th>SL / TP</th>
              <th>จำนวน Order</th>
              <th>เหตุผลทางเทคนิค</th>
              <th>กำไร/ขาดทุน (PnL)</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-muted text-center py-6">
                  ไม่พบรายการเทรดที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              filteredTrades.map(t => {
                const dt = new Date(t.datetime);
                const dateFormatted = `${dt.toLocaleDateString('th-TH')} ${dt.toLocaleTimeString(
                  'th-TH',
                  { hour: '2-digit', minute: '2-digit' }
                )}`;

                const pnlClass =
                  t.pnl > 0 ? 'text-success' : t.pnl < 0 ? 'text-danger' : 'text-muted';

                return (
                  <tr key={t.id}>
                    <td>
                      <span className="text-xs text-muted">{dateFormatted}</span>
                    </td>
                    <td>
                      <strong>{t.symbol}</strong>
                    </td>
                    <td>
                      {t.direction === 'BUY' ? (
                        <span className="badge badge-buy">
                          <ChevronUp className="w-3 h-3 mr-0.5" /> BUY
                        </span>
                      ) : (
                        <span className="badge badge-sell">
                          <ChevronDown className="w-3 h-3 mr-0.5" /> SELL
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{t.lotSize}</strong>
                    </td>
                    <td>
                      {t.entryPrice} &rarr; {t.exitPrice !== null ? t.exitPrice : <span className="text-amber-400 font-semibold">(Open)</span>}
                    </td>
                    <td>
                      <div className="text-xs">
                        {t.stopLoss ? (
                          <span className="text-danger">SL: {t.stopLoss}</span>
                        ) : (
                          '-'
                        )}
                        {t.takeProfit ? (
                          <> | <span className="text-success">TP: {t.takeProfit}</span></>
                        ) : (
                          ''
                        )}
                        {t.rr > 0 && (
                          <div>
                            <span className="text-muted">R:R 1:{t.rr}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{t.orderCount || 1} ไม้</span>
                    </td>
                    <td>
                      <div className="tech-note-preview" title={t.technicalNote || ''}>
                        {t.technicalNote || '-'}
                      </div>
                    </td>
                    <td className={pnlClass}>
                      {t.outcome === 'OPEN' ? (
                        <div>
                          <span className="badge badge-info">🔵 OPEN</span>
                          <div className="text-[11px] text-muted mt-0.5">ถือออเดอร์อยู่</div>
                        </div>
                      ) : (
                        <>
                          <strong>{formatCurrency(t.pnl, currency)}</strong>
                          <div className="text-xs">
                            {t.pnlPercent >= 0 ? '+' : ''}
                            {t.pnlPercent}%{' '}
                            <span
                              className={`badge ${
                                t.outcome === 'WIN'
                                  ? 'badge-outcome-win'
                                  : t.outcome === 'LOSS'
                                  ? 'badge-outcome-loss'
                                  : 'badge-outcome-be'
                              }`}
                            >
                              {t.outcome === 'WIN' ? 'WIN' : t.outcome === 'LOSS' ? 'LOSS' : 'BE'}
                            </span>
                          </div>
                        </>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onEdit(t)}
                          className="btn btn-sm btn-icon-edit"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
                              onDelete(t.id);
                            }
                          }}
                          className="btn btn-sm btn-icon-danger"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
