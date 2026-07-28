'use client';

import { useState, useEffect } from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';

const STORAGE_KEY = 'statistics_trading_journal_v1';

export function useTradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currency, setCurrency] = useState<CurrencyUnit>('$');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTrades(JSON.parse(stored));
      } else {
        setTrades([]);
      }
    } catch (err) {
      console.error('Error loading trades from localStorage', err);
      setTrades([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save trades to localStorage whenever updated
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    }
  }, [trades, isLoaded]);

  const addOrUpdateTrade = (trade: Trade) => {
    setTrades(prev => {
      const existingIndex = prev.findIndex(t => t.id === trade.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = trade;
        return updated;
      } else {
        return [trade, ...prev];
      }
    });
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const clearAllTrades = () => {
    setTrades([]);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `trading_journal_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setTrades(parsed);
          alert('นำเข้าข้อมูลสำเร็จ!');
        } else {
          alert('ไฟล์ JSON รูปแบบไม่ถูกต้อง');
        }
      } catch (err: any) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return {
    trades,
    currency,
    setCurrency,
    isLoaded,
    addOrUpdateTrade,
    deleteTrade,
    clearAllTrades,
    exportJSON,
    importJSON
  };
}
