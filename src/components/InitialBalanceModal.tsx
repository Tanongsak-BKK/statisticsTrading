'use client';

import React, { useState, useEffect } from 'react';
import { CurrencyUnit } from '@/types/trade';
import { Wallet, Check, X } from 'lucide-react';

interface InitialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance: number;
  onSave: (newBalance: number) => void;
  currency: CurrencyUnit;
}

export const InitialBalanceModal: React.FC<InitialBalanceModalProps> = ({
  isOpen,
  onClose,
  initialBalance,
  onSave,
  currency
}) => {
  const [balanceInput, setBalanceInput] = useState<string>('');

  useEffect(() => {
    setBalanceInput(initialBalance.toString());
  }, [initialBalance, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceInput);
    if (isNaN(val) || val < 0) {
      alert('กรุณากรอกจำนวนเงินทุนเริ่มต้นให้ถูกต้อง (ต้องไม่น้อยกว่า 0)');
      return;
    }
    onSave(val);
    onClose();
  };

  const presetValues = currency === '฿' 
    ? [10000, 30000, 50000, 100000, 300000, 500000, 1000000]
    : [1000, 3000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h3 className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400" />
            ตั้งค่าเงินทุนเริ่มต้น (Initial Balance)
          </h3>
          <button type="button" onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label htmlFor="balance-input">
              เงินทุนเริ่มต้น (Initial Capital) ({currency}) <span className="required">*</span>
            </label>
            <div className="relative">
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
            </div>
            <p className="text-xs text-muted mt-1">
              ยอดเงินในพอร์ตปัจจุบันจะคำนวนจาก: <strong>เงินทุนเริ่มต้น + ผลรวมกำไร/ขาดทุนสุทธิ (Total Net PnL)</strong>
            </p>
          </div>

          {/* Quick presets */}
          <div className="mb-6">
            <label className="text-xs text-muted mb-2 block">เลือกค่าเริ่มต้นด่วน:</label>
            <div className="flex flex-wrap gap-2">
              {presetValues.map((val) => (
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

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              <Check className="w-4 h-4" /> บันทึกเงินทุน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
