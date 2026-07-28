'use client';

import React, { useState } from 'react';
import { useTradingJournal } from '@/hooks/useTradingJournal';
import { Header } from '@/components/Header';
import { KPICards } from '@/components/KPICards';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { TradeLogTable } from '@/components/TradeLogTable';
import { TradeModal } from '@/components/TradeModal';
import { Trade } from '@/types/trade';

export default function Home() {
  const {
    trades,
    currency,
    setCurrency,
    isLoaded,
    addOrUpdateTrade,
    deleteTrade,
    clearAllTrades,
    exportJSON,
    importJSON
  } = useTradingJournal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  const handleOpenNewModal = () => {
    setTradeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted">
        กำลังโหลดระบบ...
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        onOpenModal={handleOpenNewModal}
        onExport={exportJSON}
        onImport={importJSON}
        onClearAll={clearAllTrades}
      />

      {/* KPI Cards Overview */}
      <KPICards trades={trades} currency={currency} />

      {/* Analytics Section: Weekly / Monthly / All-Time */}
      <main className="main-layout">
        <AnalyticsSection
          trades={trades}
          currency={currency}
          onCurrencyChange={setCurrency}
        />

        {/* Trade Log Table */}
        <TradeLogTable
          trades={trades}
          currency={currency}
          onEdit={handleOpenEditModal}
          onDelete={deleteTrade}
        />
      </main>

      {/* Modal Form */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addOrUpdateTrade}
        tradeToEdit={tradeToEdit}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Trading Journal & Analytics &copy; 2026 - บันทึกและวิเคราะห์สถิติการเทรดเพื่อพัฒนาวินัยและผลตอบแทนอย่างยั่งยืน (Next.js App)
        </p>
      </footer>
    </div>
  );
}
