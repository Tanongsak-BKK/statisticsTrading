'use client';

import React, { useState } from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';
import { formatCurrency } from '@/utils/tradeUtils';
import { Search, List, Edit2, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, ExternalLink, RotateCcw, Tag, Globe, Percent, X } from 'lucide-react';


interface TradeLogTableProps {
  trades: Trade[];
  currency: CurrencyUnit;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

export const TradeLogTable: React.FC<TradeLogTableProps> = ({
  trades,
  currency,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [viewTab, setViewTab] = useState<'ACTIVE' | 'TRASH'>('ACTIVE');
  const [previewChartUrl, setPreviewChartUrl] = useState<string | null>(null);

  // Filter Active vs Deleted trades
  const activeTrades = trades.filter(t => !t.isDeleted);
  const deletedTrades = trades.filter(t => t.isDeleted);
  const totalActiveOrders = activeTrades.reduce((sum, t) => sum + (t.orderCount && t.orderCount > 0 ? t.orderCount : 1), 0);
  const totalDeletedOrders = deletedTrades.reduce((sum, t) => sum + (t.orderCount && t.orderCount > 0 ? t.orderCount : 1), 0);

  const displayTrades = viewTab === 'ACTIVE' ? activeTrades : deletedTrades;

  const filteredTrades = displayTrades.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      t.symbol.toLowerCase().includes(term) ||
      (t.technicalNote && t.technicalNote.toLowerCase().includes(term)) ||
      (t.strategy && t.strategy.toLowerCase().includes(term));
    const matchDir = directionFilter === 'ALL' || t.direction === directionFilter;
    const matchOutcome = outcomeFilter === 'ALL' || t.outcome === outcomeFilter;
    const matchStrategy = strategyFilter === 'ALL' || t.strategy === strategyFilter;
    const matchSession = sessionFilter === 'ALL' || t.session === sessionFilter;
    return matchSearch && matchDir && matchOutcome && matchStrategy && matchSession;
  });

  return (
    <section className="card trade-log-section">
      {/* Header & Tabs */}
      <div className="card-header border-bottom flex-col gap-3">
        <div className="flex justify-between items-center w-full flex-wrap gap-2">
          <div className="title-with-count">
            <h2>
              <List className="inline w-5 h-5 mr-2" /> ตารางบันทึกประวัติการเทรด (Trade Log)
            </h2>
            <span className="badge badge-info">{activeTrades.length} รายการ ({totalActiveOrders} ไม้)</span>
          </div>

          {/* Active vs Trash View Switcher */}
          <div className="segmented-control text-xs">
            <input
              type="radio"
              name="viewTab"
              id="tab-active"
              checked={viewTab === 'ACTIVE'}
              onChange={() => setViewTab('ACTIVE')}
            />
            <label htmlFor="tab-active" className={viewTab === 'ACTIVE' ? 'label-buy' : ''}>
              📋 รายการเทรด ({activeTrades.length} รายการ / {totalActiveOrders} ไม้)
            </label>

            <input
              type="radio"
              name="viewTab"
              id="tab-trash"
              checked={viewTab === 'TRASH'}
              onChange={() => setViewTab('TRASH')}
            />
            <label htmlFor="tab-trash" className={viewTab === 'TRASH' ? 'label-sell' : ''}>
              🗑️ ถังขยะ ({deletedTrades.length})
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar w-full flex-wrap">
          <div className="search-box">
            <Search className="search-icon w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="ค้นหา หุ้น, กลยุทธ์, Technical setup..."
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
          <select
            className="select-sm"
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
          >
            <option value="ALL">ทุกกลยุทธ์ (Strategy)</option>
            <option value="Breakout">Breakout</option>
            <option value="Scalping">Scalping</option>
            <option value="Pullback">Pullback</option>
            <option value="SMC / ICT">SMC / ICT</option>
            <option value="EMA Cross">EMA Cross</option>
            <option value="Trend Following">Trend Following</option>
          </select>
          <select
            className="select-sm"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="ALL">ทุกช่วงเวลา (Session)</option>
            <option value="ASIAN">🌏 Asian Session</option>
            <option value="LONDON">🏰 London Session</option>
            <option value="NEW_YORK">🗽 New York Session</option>
            <option value="OVERLAP">🔥 Overlap Session</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>วันเวลา / Session</th>
              <th>หุ้น / กลยุทธ์</th>
              <th>ฝั่ง</th>
              <th>Lot / Position</th>
              <th>ราคาเข้า - ออก</th>
              <th>SL / TP</th>
              <th>รูปกราฟ</th>
              <th>เหตุผลทางเทคนิค</th>
              <th>กำไร/ขาดทุน (PnL)</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-muted text-center py-6">
                  {viewTab === 'ACTIVE'
                    ? 'ไม่พบรายการเทรดที่ตรงกับเงื่อนไขการค้นหา'
                    : 'ถังขยะว่างเปล่า ไม่มีรายการที่ถูกลบ'}
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

                const sessionBadgeClass =
                  t.session === 'OVERLAP'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                    : t.session === 'NEW_YORK'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                    : t.session === 'LONDON'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <tr key={t.id} className={t.isDeleted ? 'opacity-60 bg-red-950/10' : ''}>
                    <td>
                      <span className="text-xs text-muted block">{dateFormatted}</span>
                      {t.session && (
                        <span className={`badge text-[10px] px-1.5 py-0.5 border ${sessionBadgeClass} mt-0.5 inline-block`}>
                          {t.session === 'ASIAN'
                            ? '🌏 ASIAN'
                            : t.session === 'LONDON'
                            ? '🏰 LONDON'
                            : t.session === 'NEW_YORK'
                            ? '🗽 NEW YORK'
                            : t.session === 'OVERLAP'
                            ? '🔥 OVERLAP'
                            : t.session}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong className="block text-sm">{t.symbol}</strong>
                      {t.strategy && (
                        <span className="badge badge-info text-[10px] px-1.5 py-0.5 mt-0.5 inline-block">
                          <Tag className="w-2.5 h-2.5 inline mr-1" /> {t.strategy}
                        </span>
                      )}
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
                      {t.orderCount && t.orderCount > 1 && (
                        <div className="text-[11px] text-muted">({t.orderCount} ไม้)</div>
                      )}
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
                    {/* Chart Screenshot URL preview button */}
                    <td>
                      {t.chartUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewChartUrl(t.chartUrl || null)}
                          className="btn btn-sm btn-ghost text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          title="ดูรูปภาพกราฟ"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> กราฟ
                        </button>
                      ) : (
                        <span className="text-muted text-xs">-</span>
                      )}
                    </td>
                    <td>
                      <div className="tech-note-preview text-xs" title={t.technicalNote || ''}>
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
                          <strong className="text-sm">{formatCurrency(t.pnl, currency)}</strong>
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
                              {t.outcome === 'WIN' ? 'TP (WIN)' : t.outcome === 'LOSS' ? 'SL (LOSS)' : 'BE'}
                            </span>
                          </div>
                          {((t.commission && t.commission > 0) || (t.swap && t.swap !== 0)) && (
                            <div className="text-[10px] text-dim mt-0.5">
                              {t.commission ? `Comm: -${formatCurrency(t.commission, currency)} ` : ''}
                              {t.swap ? `Swap: ${t.swap > 0 ? '+' : ''}${formatCurrency(t.swap, currency)}` : ''}
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {viewTab === 'ACTIVE' ? (
                          <>
                            <button
                              onClick={() => onEdit(t)}
                              className="btn btn-sm btn-icon-edit"
                              title="แก้ไขออเดอร์"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(t.id)}
                              className="btn btn-sm btn-icon-danger"
                              title="ย้ายไปถังขยะ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {onRestore && (
                              <button
                                onClick={() => onRestore(t.id)}
                                className="btn btn-sm btn-ghost text-emerald-400 hover:text-emerald-300"
                                title="กู้คืนรายการนี้"
                              >
                                <RotateCcw className="w-3.5 h-3.5 mr-1" /> กู้คืน
                              </button>
                            )}
                            {onPermanentDelete && (
                              <button
                                onClick={() => {
                                  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ถาวร?')) {
                                    onPermanentDelete(t.id);
                                  }
                                }}
                                className="btn btn-sm btn-icon-danger"
                                title="ลบถาวร"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Chart Screenshot Modal Preview */}
      {previewChartUrl && (
        <div className="modal-overlay open" onClick={() => setPreviewChartUrl(null)}>
          <div className="modal-card max-w-3xl">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> รูปภาพกราฟ Technical Setup
              </h3>
              <button className="modal-close" onClick={() => setPreviewChartUrl(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-center">
              <img
                src={previewChartUrl}
                alt="Chart Setup"
                className="max-h-[70vh] mx-auto rounded border border-color object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).alt = 'ไม่สามารถโหลดรูปภาพจากลิงก์นี้ได้';
                }}
              />
              <div className="mt-3 text-right">
                <a
                  href={previewChartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-ghost text-xs text-indigo-400"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1 inline" /> เปิดในแท็บใหม่
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
