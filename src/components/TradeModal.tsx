'use client';

import React, { useState, useEffect } from 'react';
import { Trade, Direction, CurrencyUnit } from '@/types/trade';
import { calculateTradeMetrics, calculateRequiredMargin, calculateMaxLot, formatCurrency } from '@/utils/tradeUtils';
import { X, Save, Clock, TrendingUp, Layers, ShieldAlert, Target, DollarSign, FileText, Gauge } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  tradeToEdit: Trade | null;
  currentBalance?: number;
  leverage?: number;
  currency?: CurrencyUnit;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tradeToEdit,
  currentBalance = 10000,
  leverage = 100,
  currency = '$'
}) => {

  const getDefaultDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [datetime, setDatetime] = useState(getDefaultDateTime());
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<Direction>('BUY');
  const [lotSize, setLotSize] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [orderCount, setOrderCount] = useState<string>('1');
  const [manualPnl, setManualPnl] = useState<string>('');
  const [technicalNote, setTechnicalNote] = useState('');

  useEffect(() => {
    if (tradeToEdit) {
      setDatetime(tradeToEdit.datetime);
      setSymbol(tradeToEdit.symbol);
      setDirection(tradeToEdit.direction);
      setLotSize(String(tradeToEdit.lotSize));
      setEntryPrice(String(tradeToEdit.entryPrice));
      setExitPrice(String(tradeToEdit.exitPrice));
      setStopLoss(tradeToEdit.stopLoss !== null ? String(tradeToEdit.stopLoss) : '');
      setTakeProfit(tradeToEdit.takeProfit !== null ? String(tradeToEdit.takeProfit) : '');
      setOrderCount(String(tradeToEdit.orderCount || 1));
      setManualPnl(tradeToEdit.pnl !== undefined ? String(tradeToEdit.pnl) : '');
      setTechnicalNote(tradeToEdit.technicalNote || '');
    } else {
      setDatetime(getDefaultDateTime());
      setSymbol('');
      setDirection('BUY');
      setLotSize('');
      setEntryPrice('');
      setExitPrice('');
      setStopLoss('');
      setTakeProfit('');
      setOrderCount('1');
      setManualPnl('');
      setTechnicalNote('');
    }
  }, [tradeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lot = parseFloat(lotSize);
    const sl = stopLoss ? parseFloat(stopLoss) : null;
    const tp = takeProfit ? parseFloat(takeProfit) : null;
    const orders = parseInt(orderCount) || 1;
    const userPnl = manualPnl !== '' ? parseFloat(manualPnl) : null;

    const metrics = calculateTradeMetrics(entry, exit, lot, direction, sl, tp, userPnl);

    const trade: Trade = {
      id: tradeToEdit ? tradeToEdit.id : `trade-${Date.now()}`,
      datetime,
      symbol: symbol.trim().toUpperCase(),
      direction,
      lotSize: lot,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: sl,
      takeProfit: tp,
      orderCount: orders,
      technicalNote: technicalNote.trim(),
      pnl: metrics.pnl,
      pnlPercent: metrics.pnlPercent,
      outcome: metrics.outcome,
      rr: metrics.rr
    };

    onSave(trade);
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => {
      if ((e.target as HTMLElement).classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>
            {tradeToEdit ? 'แก้ไขรายการเทรด' : 'บันทึกการเทรดใหม่'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-grid">
            {/* วันเวลา */}
            <div className="form-group">
              <label htmlFor="field-datetime">
                <Clock className="w-3.5 h-3.5 inline mr-1" /> วันและเวลา <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="field-datetime"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
              />
            </div>

            {/* หุ้น/สินทรัพย์ */}
            <div className="form-group">
              <label htmlFor="field-symbol">
                <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> หุ้น/สินทรัพย์ <span className="required">*</span>
              </label>
              <input
                type="text"
                id="field-symbol"
                placeholder="เช่น PTT, NVDA, EURUSD, BTC"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            {/* Direction */}
            <div className="form-group">
              <label>ทิศทาง (Direction) <span className="required">*</span></label>
              <div className="segmented-control">
                <input
                  type="radio"
                  name="direction"
                  id="dir-buy"
                  value="BUY"
                  checked={direction === 'BUY'}
                  onChange={() => setDirection('BUY')}
                />
                <label htmlFor="dir-buy" className="label-buy">BUY / LONG</label>

                <input
                  type="radio"
                  name="direction"
                  id="dir-sell"
                  value="SELL"
                  checked={direction === 'SELL'}
                  onChange={() => setDirection('SELL')}
                />
                <label htmlFor="dir-sell" className="label-sell">SELL / SHORT</label>
              </div>
            </div>

            {/* Lot Size */}
            <div className="form-group">
              <label htmlFor="field-lot">
                <Layers className="w-3.5 h-3.5 inline mr-1" /> ขนาด Lot / Position <span className="required">*</span>
              </label>
              <input
                type="number"
                id="field-lot"
                step="any"
                placeholder="เช่น 1.0, 1000, 0.5"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                required
              />
            </div>

            {/* Entry Price */}
            <div className="form-group">
              <label htmlFor="field-entry">ราคาเข้า (Entry Price) <span className="required">*</span></label>
              <input
                type="number"
                id="field-entry"
                step="any"
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                required
              />
            </div>

            {/* Real-time Leverage & Margin Live Calculator Box */}
            {parseFloat(lotSize) > 0 && (
              <div className="form-group full-width margin-calc-box">
                <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-purple-400" /> 
                    Leverage <strong>1:{leverage}</strong> | หลักประกันที่ใช้ (Margin): 
                    <strong className="text-indigo-300">
                      {formatCurrency(calculateRequiredMargin(parseFloat(lotSize) * (parseInt(orderCount) || 1), parseFloat(entryPrice), leverage), currency)}
                    </strong> 
                    ({currentBalance > 0 ? ((calculateRequiredMargin(parseFloat(lotSize) * (parseInt(orderCount) || 1), parseFloat(entryPrice), leverage) / currentBalance) * 100).toFixed(1) : 0}% ของพอร์ต)
                  </span>
                  <span className="text-muted">
                    Lot สูงสุดที่พอร์ตนี้ออกได้: <strong className="text-emerald-400">~{calculateMaxLot(currentBalance, leverage, parseFloat(entryPrice)).toFixed(2)} Lot</strong>
                  </span>
                </div>
                {calculateRequiredMargin(parseFloat(lotSize) * (parseInt(orderCount) || 1), parseFloat(entryPrice), leverage) > currentBalance && currentBalance > 0 && (
                  <p className="text-xs text-danger mt-1 font-semibold flex items-center gap-1">
                    ⚠️ คำเตือน: หลักประกันที่ต้องใช้ ({formatCurrency(calculateRequiredMargin(parseFloat(lotSize) * (parseInt(orderCount) || 1), parseFloat(entryPrice), leverage), currency)}) เกินยอดเงินที่มีในพอร์ต ({formatCurrency(currentBalance, currency)})!
                  </p>
                )}
              </div>
            )}


            {/* Exit Price */}
            <div className="form-group">
              <label htmlFor="field-exit">ราคาออก (Exit Price) <span className="required">*</span></label>
              <input
                type="number"
                id="field-exit"
                step="any"
                placeholder="0.00"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                required
              />
            </div>

            {/* Stop Loss */}
            <div className="form-group">
              <label htmlFor="field-sl">
                <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-danger" /> Stop Loss (SL)
              </label>
              <input
                type="number"
                id="field-sl"
                step="any"
                placeholder="ราคาตั้งคัทลอส"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </div>

            {/* Take Profit */}
            <div className="form-group">
              <label htmlFor="field-tp">
                <Target className="w-3.5 h-3.5 inline mr-1 text-success" /> Take Profit (TP)
              </label>
              <input
                type="number"
                id="field-tp"
                step="any"
                placeholder="ราคาเป้าหมายกำไร"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
              />
            </div>

            {/* Order Count */}
            <div className="form-group">
              <label htmlFor="field-order-count">จำนวนการออก Order <span className="required">*</span></label>
              <input
                type="number"
                id="field-order-count"
                min="1"
                placeholder="เช่น 1 หรือ 3"
                value={orderCount}
                onChange={(e) => setOrderCount(e.target.value)}
                required
              />
            </div>

            {/* Manual PnL Override */}
            <div className="form-group">
              <label htmlFor="field-pnl">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" /> กำไร/ขาดทุนสุทธิ (Net PnL)
              </label>
              <input
                type="number"
                id="field-pnl"
                step="any"
                placeholder="เว้นว่างเพื่อให้ระบบคำนวณอัตโนมัติ"
                value={manualPnl}
                onChange={(e) => setManualPnl(e.target.value)}
              />
            </div>

            {/* Technical Note */}
            <div className="form-group full-width">
              <label htmlFor="field-technical">
                <FileText className="w-3.5 h-3.5 inline mr-1" /> เหตุผลทางเทคนิค (Technical Setup / Note)
              </label>
              <textarea
                id="field-technical"
                rows={3}
                placeholder="ระบุเหตุผลทางเทคนิค เช่น Breakout แนวต้าน 34.50, Pullback ชนเส้น EMA20 + Volume เข้า"
                value={technicalNote}
                onChange={(e) => setTechnicalNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              <Save className="w-4 h-4" /> บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
