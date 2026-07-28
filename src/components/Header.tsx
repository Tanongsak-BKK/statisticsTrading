'use client';

import React from 'react';
import { TrendingUp, Plus, Download, Upload, Trash2, Wallet } from 'lucide-react';

interface HeaderProps {
  onOpenModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  onOpenBalanceModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModal,
  onExport,
  onImport,
  onClearAll,
  onOpenBalanceModal
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
          <h1>Trading Journal & Analytics</h1>
          <p className="subtitle">ระบบบันทึกและวิเคราะห์สถิติการเทรด (Weekly & Monthly Focus)</p>
        </div>
      </div>
      <div className="header-actions">
        {onOpenBalanceModal && (
          <button onClick={onOpenBalanceModal} className="btn btn-outline" title="ตั้งค่าเงินทุนเริ่มต้น">
            <Wallet className="w-4 h-4 text-indigo-400" /> ตั้งค่าทุน
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

