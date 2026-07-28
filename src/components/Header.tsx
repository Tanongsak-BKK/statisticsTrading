'use client';

import React from 'react';
import { TrendingUp, Plus, Download, Upload, Trash2, Wallet, Coins, RefreshCw, Cloud, Database } from 'lucide-react';
import { XAUUSDPriceResult } from '@/services/xauusdService';
import { CurrencyRateResult } from '@/services/currencyService';

interface HeaderProps {
  onOpenModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  onOpenBalanceModal?: () => void;
  xauusdInfo?: XAUUSDPriceResult | null;
  usdThbInfo?: CurrencyRateResult | null;
  onRefreshXAUUSD?: () => void;
  isFirebaseActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModal,
  onExport,
  onImport,
  onClearAll,
  onOpenBalanceModal,
  xauusdInfo,
  usdThbInfo,
  onRefreshXAUUSD,
  isFirebaseActive
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <header className="app-header">
      <div className="logo-area">
        <div className="logo-icon">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1>Trading Journal & Analytics</h1>
            <span
              className={`badge text-xs flex items-center gap-1 ${
                isFirebaseActive ? 'badge-outcome-win' : 'badge-outcome-be'
              }`}
              title={
                isFirebaseActive
                  ? 'เชื่อมต่อ Firebase Database สำเร็จ'
                  : 'โหมดใช้ข้อมูลในเครื่อง (กรอก API Keys ใน .env.local เพื่อเปิดใช้ Firebase)'
              }
            >
              {isFirebaseActive ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400 inline" /> Cloud Synced
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-slate-400 inline" /> Local Storage
                </>
              )}
            </span>
          </div>
          <p className="subtitle">ระบบบันทึกและวิเคราะห์สถิติการเทรด (XAUUSD Auto SL/TP & Firebase Integrated)</p>
        </div>
      </div>

      {/* Live Market Price Badges */}
      <div className="header-market-badges flex items-center gap-2 flex-wrap">
        {/* XAUUSD Gold Price */}
        <div
          className="badge-market-price flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
          title="ดึงราคา CommodityPriceAPI (อัปเดตทุก 1 ชม. & Auto SL/TP)"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-muted">XAU/USD:</span>
          <strong className="text-amber-300">
            {xauusdInfo?.price ? `$${xauusdInfo.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'รอใส่ API Key'}
          </strong>
          {onRefreshXAUUSD && (
            <button
              type="button"
              onClick={onRefreshXAUUSD}
              className="hover:text-amber-300 ml-1 transition-transform active:rotate-180"
              title="ดึงราคา XAUUSD ล่าสุด"
            >
              <RefreshCw className="w-3 h-3 text-muted" />
            </button>
          )}
        </div>

        {/* USD/THB Rate */}
        <div
          className="badge-market-price flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
          title="ดึงอัตราแลกเปลี่ยน FreeCurrencyAPI (อัปเดตทุก 1 สัปดาห์)"
        >
          <span className="text-muted">USD/THB:</span>
          <strong className="text-emerald-300">
            ฿{usdThbInfo?.usdThbRate ? usdThbInfo.usdThbRate.toFixed(2) : '36.50'}
          </strong>
        </div>
      </div>

      <div className="header-actions">
        {onOpenBalanceModal && (
          <button onClick={onOpenBalanceModal} className="btn btn-outline" title="ตั้งค่าเงินทุนและ Leverage">
            <Wallet className="w-4 h-4 text-indigo-400" /> ตั้งค่าทุน & Leverage
          </button>
        )}
        <button onClick={onOpenModal} className="btn btn-primary">
          <Plus className="w-4 h-4" /> บันทึกการเทรดใหม่
        </button>
        <button onClick={onExport} className="btn btn-outline" title="ส่งออกข้อมูล JSON">
          <Download className="w-4 h-4" /> Export
        </button>
        <label className="btn btn-outline cursor-pointer" title="นำเข้าข้อมูล JSON">
          <Upload className="w-4 h-4" /> Import
          <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
        <button
          onClick={() => {
            if (confirm('คุณต้องการลบข้อมูลการเทรดทั้งหมดใช่หรือไม่?')) {
              onClearAll();
            }
          }}
          className="btn btn-ghost btn-icon-danger"
          title="ล้างข้อมูลทั้งหมด"
        >
          <Trash2 className="w-4 h-4" /> ล้างข้อมูลทั้งหมด
        </button>
      </div>
    </header>
  );
};
