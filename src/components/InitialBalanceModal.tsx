'use client';

import React, { useState, useEffect } from 'react';
import { CurrencyUnit } from '@/types/trade';
import { Wallet, Check, X, Gauge } from 'lucide-react';

interface InitialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance: number;
  onSaveBalance: (newBalance: number) => void;
  leverage: number;
  onSaveLeverage: (newLeverage: number) => void;
  currency: CurrencyUnit;
}

export const InitialBalanceModal: React.FC<InitialBalanceModalProps> = ({
  isOpen,
  onClose,
  initialBalance,
  onSaveBalance,
  leverage,
  onSaveLeverage,
  currency
}) => {
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [leverageInput, setLeverageInput] = useState<string>('');

  useEffect(() => {
    setBalanceInput(initialBalance.toString());
    setLeverageInput(leverage.toString());
  }, [initialBalance, leverage, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balVal = parseFloat(balanceInput);
    if (isNaN(balVal) || balVal < 0) {
      alert('กรุณากรอกจำนวนเงินทุนเริ่มต้นให้ถูกต้อง (ต้องไม่น้อยกว่า 0)');
      return;
    }

    const levVal = parseFloat(leverageInput);
    if (isNaN(levVal) || levVal <= 0) {
      alert('กรุณากรอก Leverage ให้ถูกต้อง (ต้องมากกว่า 0)');
      return;
    }

    onSaveBalance(balVal);
    onSaveLeverage(levVal);
    onClose();
  };

  const balancePresets = currency === '฿' 
    ? [10000, 30000, 50000, 100000, 300000, 500000, 1000000]
    : [1000, 3000, 5000, 10000, 25000, 50000, 100000];

  const leveragePresets = [30, 50, 100, 200, 500, 1000, 2000];

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400" />
            ตั้งค่าพอร์ต & Leverage
          </h3>
          <button type="button" onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Initial Balance */}
          <div className="form-group mb-4">
            <label htmlFor="balance-input">
              เงินทุนเริ่มต้น (Initial Capital) ({currency}) <span className="required">*</span>
            </label>
            <input
              id="balance-input"
              type="number"
              step="any"
              min="0"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              placeholder="เช่น 10000"
              className="w-full text-lg font-semibold"
              autoFocus
              required
            />
            {/* Quick Balance presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {balancePresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBalanceInput(val.toString())}
                  className={`btn btn-sm ${parseFloat(balanceInput) === val ? 'btn-primary' : 'btn-outline'}`}
                >
                  {val.toLocaleString()} {currency}
                </button>
              ))}
            </div>
          </div>

          <hr className="my-4 border-color-light" />

          {/* Leverage Setting */}
          <div className="form-group mb-4">
            <label htmlFor="leverage-input" className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-400" />
              อัตรา Leverage (อัตราขยายทุน) <span className="required">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-muted">1 :</span>
              <input
                id="leverage-input"
                type="number"
                step="any"
                min="1"
                value={leverageInput}
                onChange={(e) => setLeverageInput(e.target.value)}
                placeholder="ระบุตัวเลข เช่น 100, 500, 1000"
                className="w-full text-lg font-semibold"
                required
              />
            </div>
            <p className="text-xs text-muted mt-1">
              ระบุตัวเลข เช่น <code>500</code> สำหรับ <strong>1:500</strong> (ใช้คำนวณหลักประกัน Required Margin และขีดจำกัดการออก Lot)
            </p>

            {/* Quick Leverage presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {leveragePresets.map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setLeverageInput(lev.toString())}
                  className={`btn btn-sm ${parseFloat(leverageInput) === lev ? 'btn-primary' : 'btn-outline'}`}
                >
                  1:{lev}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              <Check className="w-4 h-4" /> บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
