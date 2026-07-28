'use client';

import React, { useState, useEffect } from 'react';
import { Trade, Direction, CurrencyUnit } from '@/types/trade';
import { calculateTradeMetrics, calculateRequiredMargin, calculateMaxLot, formatCurrency, getContractSize } from '@/utils/tradeUtils';
import { X, Save, Clock, TrendingUp, Layers, ShieldAlert, Target, DollarSign, FileText, Gauge, Calculator, AlertTriangle } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  tradeToEdit: Trade | null;
  currentBalance?: number;
  leverage?: number;
  currency?: CurrencyUnit;
}

export type SLTPInputMode = 'PRICE' | 'POINTS';

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
  const [orderCount, setOrderCount] = useState<string>('1');
  const [manualPnl, setManualPnl] = useState<string>('');
  const [technicalNote, setTechnicalNote] = useState('');

  // SL/TP Input Mode & Points State
  const [sltpMode, setSltpMode] = useState<SLTPInputMode>('PRICE');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [slPoints, setSlPoints] = useState<string>('');
  const [tpPoints, setTpPoints] = useState<string>('');
  const [pointUnit, setPointUnit] = useState<number>(0.01); // 0.01 for Gold/Index, 0.0001 for Forex, 1.0 for Stocks

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
      setManualPnl('');
      setTechnicalNote(tradeToEdit.technicalNote || '');

      setSltpMode('PRICE');
      setSlPoints('');
      setTpPoints('');
    } else {
      setDatetime(getDefaultDateTime());
      setSymbol('');
      setDirection('BUY');
      setLotSize('');
      setEntryPrice('');
      setExitPrice('');
      setStopLoss('');
      setTakeProfit('');
      setSlPoints('');
      setTpPoints('');
      setOrderCount('1');
      setManualPnl('');
      setTechnicalNote('');
      setSltpMode('PRICE');
    }
  }, [tradeToEdit, isOpen]);

  // Adjust point unit automatically based on symbol
  useEffect(() => {
    const sym = symbol.toUpperCase();
    if (sym === 'XAUUSD' || sym === 'GOLD' || sym === 'XAU') {
      setPointUnit(0.01);
    } else if (sym.length === 6 && !sym.includes('USD') && !sym.includes('BTC')) {
      setPointUnit(0.0001);
    }
  }, [symbol]);

  if (!isOpen) return null;

  // Real-time Calculations
  const entryNum = parseFloat(entryPrice) || 0;
  const lotNum = parseFloat(lotSize) || 0;
  const ordersNum = parseInt(orderCount) || 1;
  const contractSize = getContractSize(symbol);

  // Compute SL & TP Prices dynamically based on mode
  let finalSLPrice: number | null = null;
  let finalTPPrice: number | null = null;
  let slDistPointsPreview: number | null = null;
  let tpDistPointsPreview: number | null = null;

  if (sltpMode === 'PRICE') {
    finalSLPrice = stopLoss !== '' ? parseFloat(stopLoss) : null;
    finalTPPrice = takeProfit !== '' ? parseFloat(takeProfit) : null;

    if (entryNum > 0 && finalSLPrice !== null && !isNaN(finalSLPrice)) {
      slDistPointsPreview = Math.round(Math.abs(entryNum - finalSLPrice) / pointUnit);
    }
    if (entryNum > 0 && finalTPPrice !== null && !isNaN(finalTPPrice)) {
      tpDistPointsPreview = Math.round(Math.abs(finalTPPrice - entryNum) / pointUnit);
    }
  } else {
    // POINTS Mode
    const slPts = parseFloat(slPoints);
    const tpPts = parseFloat(tpPoints);

    if (entryNum > 0 && !isNaN(slPts) && slPts > 0) {
      slDistPointsPreview = slPts;
      const priceDiff = slPts * pointUnit;
      finalSLPrice = direction === 'BUY' ? entryNum - priceDiff : entryNum + priceDiff;
    }

    if (entryNum > 0 && !isNaN(tpPts) && tpPts > 0) {
      tpDistPointsPreview = tpPts;
      const priceDiff = tpPts * pointUnit;
      finalTPPrice = direction === 'BUY' ? entryNum + priceDiff : entryNum - priceDiff;
    }
  }

  // Calculate SL Risk Impact ($ & % of Balance)
  let slRiskAmount: number | null = null;
  let slRiskPercent: number | null = null;
  if (entryNum > 0 && finalSLPrice !== null && lotNum > 0) {
    const priceDiff = Math.abs(entryNum - finalSLPrice);
    slRiskAmount = priceDiff * lotNum * ordersNum * contractSize;
    if (currentBalance > 0) {
      slRiskPercent = (slRiskAmount / currentBalance) * 100;
    }
  }

  // Calculate TP Reward Impact ($ & % of Balance)
  let tpRewardAmount: number | null = null;
  let tpRewardPercent: number | null = null;
  if (entryNum > 0 && finalTPPrice !== null && lotNum > 0) {
    const priceDiff = Math.abs(finalTPPrice - entryNum);
    tpRewardAmount = priceDiff * lotNum * ordersNum * contractSize;
    if (currentBalance > 0) {
      tpRewardPercent = (tpRewardAmount / currentBalance) * 100;
    }
  }

  // Calculate live Risk:Reward Ratio
  let liveRR = '-';
  if (entryNum > 0 && finalSLPrice !== null && finalTPPrice !== null && finalSLPrice !== entryNum) {
    const risk = Math.abs(entryNum - finalSLPrice);
    const reward = Math.abs(finalTPPrice - entryNum);
    if (risk > 0) {
      liveRR = (reward / risk).toFixed(2);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entry = parseFloat(entryPrice);
    const exit = exitPrice !== '' ? parseFloat(exitPrice) : null;
    const lot = parseFloat(lotSize);
    const orders = parseInt(orderCount) || 1;
    const userPnl = manualPnl !== '' ? parseFloat(manualPnl) : null;
    const activeSymbol = symbol.trim().toUpperCase();

    const metrics = calculateTradeMetrics(entry, exit, lot, direction, finalSLPrice, finalTPPrice, userPnl, activeSymbol);

    const trade: Trade = {
      id: tradeToEdit ? tradeToEdit.id : `trade-${Date.now()}`,
      datetime,
      symbol: activeSymbol,
      direction,
      lotSize: lot,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: finalSLPrice,
      takeProfit: finalTPPrice,
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
                placeholder="เช่น XAUUSD, EURUSD, PTT, BTC"
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
                placeholder="เช่น 1.0, 0.5"
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

            {/* Exit Price */}
            <div className="form-group">
              <label htmlFor="field-exit">
                ราคาออก (Exit Price) <span className="text-muted font-normal text-xs">(เว้นว่างไว้หากออเดอร์ยังเปิดอยู่)</span>
              </label>
              <input
                type="number"
                id="field-exit"
                step="any"
                placeholder="0.00 (เว้นว่างเพื่อบันทึกเป็น Open Order)"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
              />
            </div>


            {/* Real-time Leverage & Margin Live Calculator Box */}
            {lotNum > 0 && (
              <div className="form-group full-width margin-calc-box">
                <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-purple-400" /> 
                    Leverage <strong>1:{leverage}</strong> | หลักประกันที่ใช้ (Margin): 
                    <strong className="text-indigo-300">
                      {formatCurrency(calculateRequiredMargin(lotNum * ordersNum, entryNum, leverage), currency)}
                    </strong> 
                    ({currentBalance > 0 ? ((calculateRequiredMargin(lotNum * ordersNum, entryNum, leverage) / currentBalance) * 100).toFixed(1) : 0}% ของพอร์ต)
                  </span>
                  <span className="text-muted">
                    Lot สูงสุดที่พอร์ตนี้ออกได้: <strong className="text-emerald-400">~{calculateMaxLot(currentBalance, leverage, entryNum).toFixed(2)} Lot</strong>
                  </span>
                </div>
                {calculateRequiredMargin(lotNum * ordersNum, entryNum, leverage) > currentBalance && currentBalance > 0 && (
                  <p className="text-xs text-danger mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-danger" /> คำเตือน: หลักประกันที่ต้องใช้ ({formatCurrency(calculateRequiredMargin(lotNum * ordersNum, entryNum, leverage), currency)}) เกินยอดเงินที่มีในพอร์ต ({formatCurrency(currentBalance, currency)})!
                  </p>
                )}
              </div>
            )}

            {/* SL / TP Mode Selector Bar */}
            <div className="form-group full-width">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-muted flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  เลือกโหมดการกรอก Stop Loss (SL) & Take Profit (TP)
                </label>
                {/* Unit multiplier selector */}
                <div className="flex items-center gap-1 text-xs text-muted">
                  <span>หน่วย:</span>
                  <select
                    value={pointUnit}
                    onChange={(e) => setPointUnit(parseFloat(e.target.value))}
                    className="select-sm py-0.5 px-1.5 text-xs"
                  >
                    <option value={0.01}>0.01 (ทอง XAUUSD / ดัชนี)</option>
                    <option value={0.0001}>0.0001 (Forex Pips)</option>
                    <option value={1.0}>1.0 (หุ้น / Crypto)</option>
                  </select>
                </div>
              </div>

              <div className="segmented-control mb-3">
                <input
                  type="radio"
                  name="sltpMode"
                  id="mode-price"
                  value="PRICE"
                  checked={sltpMode === 'PRICE'}
                  onChange={() => setSltpMode('PRICE')}
                />
                <label htmlFor="mode-price" className={sltpMode === 'PRICE' ? 'label-buy' : ''}>
                  🎯 ระบุเป็น ราคา (Price)
                </label>

                <input
                  type="radio"
                  name="sltpMode"
                  id="mode-points"
                  value="POINTS"
                  checked={sltpMode === 'POINTS'}
                  onChange={() => setSltpMode('POINTS')}
                />
                <label htmlFor="mode-points" className={sltpMode === 'POINTS' ? 'label-buy' : ''}>
                  📏 ระบุเป็น ระยะจุด (Points / Pips)
                </label>
              </div>
            </div>

            {/* Mode A: Price Input */}
            {sltpMode === 'PRICE' ? (
              <>
                {/* Stop Loss Price */}
                <div className="form-group">
                  <label htmlFor="field-sl" className="flex justify-between">
                    <span><ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-danger" /> Stop Loss (SL Price)</span>
                    {slDistPointsPreview !== null && (
                      <span className="text-danger font-normal text-xs">({slDistPointsPreview.toLocaleString()} pts)</span>
                    )}
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

                {/* Take Profit Price */}
                <div className="form-group">
                  <label htmlFor="field-tp" className="flex justify-between">
                    <span><Target className="w-3.5 h-3.5 inline mr-1 text-success" /> Take Profit (TP Price)</span>
                    {tpDistPointsPreview !== null && (
                      <span className="text-success font-normal text-xs">({tpDistPointsPreview.toLocaleString()} pts)</span>
                    )}
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
              </>
            ) : (
              /* Mode B: Points / Pips Input */
              <>
                {/* Stop Loss Points */}
                <div className="form-group">
                  <label htmlFor="field-sl-pts" className="flex justify-between">
                    <span><ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-danger" /> Stop Loss (ระยะจุด/Points)</span>
                    {finalSLPrice !== null && (
                      <span className="text-indigo-300 font-normal text-xs">ราคา SL: <strong>{finalSLPrice.toFixed(2)}</strong></span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="field-sl-pts"
                    step="any"
                    placeholder="เช่น 1000 (จุด)"
                    value={slPoints}
                    onChange={(e) => setSlPoints(e.target.value)}
                  />
                </div>

                {/* Take Profit Points */}
                <div className="form-group">
                  <label htmlFor="field-tp-pts" className="flex justify-between">
                    <span><Target className="w-3.5 h-3.5 inline mr-1 text-success" /> Take Profit (ระยะจุด/Points)</span>
                    {finalTPPrice !== null && (
                      <span className="text-indigo-300 font-normal text-xs">ราคา TP: <strong>{finalTPPrice.toFixed(2)}</strong></span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="field-tp-pts"
                    step="any"
                    placeholder="เช่น 2000 (จุด)"
                    value={tpPoints}
                    onChange={(e) => setTpPoints(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Live SL / TP Risk & Reward Analysis Box against Portfolio Balance */}
            {(finalSLPrice !== null || finalTPPrice !== null) && (
              <div className="form-group full-width sl-tp-analysis-box p-3 rounded-lg border border-color text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="font-semibold text-muted flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    วิเคราะห์ผลกระทบ SL/TP ต่อ Balance พอร์ต ({formatCurrency(currentBalance, currency)}):
                  </span>
                  <span>
                    อัตราส่วน Risk : Reward: <strong className="text-amber-400 text-sm font-bold">1 : {liveRR}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  {/* SL Risk Impact */}
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/50">
                    <div className="text-muted font-medium text-xs mb-1">
                      🔴 หากแพ้ (Hit SL Price {finalSLPrice !== null ? finalSLPrice.toFixed(2) : '-'}):
                    </div>
                    {slRiskAmount !== null ? (
                      <div>
                        <span className="text-danger font-bold text-sm">
                          -{formatCurrency(slRiskAmount, currency)}
                        </span>
                        {slRiskPercent !== null && (
                          <span className="text-danger text-xs ml-1.5 font-semibold">
                            (-{slRiskPercent.toFixed(2)}% พอร์ต)
                          </span>
                        )}
                        <div className="text-muted text-[11px] mt-1">
                          พอร์ตคงเหลือ: <strong>{formatCurrency(Math.max(0, currentBalance - slRiskAmount), currency)}</strong>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted italic">ระบุราคา/ระยะจุด SL เพื่อดูความเสี่ยง</span>
                    )}
                  </div>

                  {/* TP Reward Impact */}
                  <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/50">
                    <div className="text-muted font-medium text-xs mb-1">
                      🟢 หากชนะ (Hit TP Price {finalTPPrice !== null ? finalTPPrice.toFixed(2) : '-'}):
                    </div>
                    {tpRewardAmount !== null ? (
                      <div>
                        <span className="text-success font-bold text-sm">
                          +{formatCurrency(tpRewardAmount, currency)}
                        </span>
                        {tpRewardPercent !== null && (
                          <span className="text-success text-xs ml-1.5 font-semibold">
                            (+{tpRewardPercent.toFixed(2)}% พอร์ต)
                          </span>
                        )}
                        <div className="text-muted text-[11px] mt-1">
                          พอร์ตคงเหลือ: <strong>{formatCurrency(currentBalance + tpRewardAmount, currency)}</strong>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted italic">ระบุราคา/ระยะจุด TP เพื่อดูผลตอบแทน</span>
                    )}
                  </div>
                </div>
              </div>
            )}

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
