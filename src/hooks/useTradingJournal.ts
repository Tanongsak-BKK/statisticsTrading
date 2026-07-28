'use client';

import { useState, useEffect } from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';

const STORAGE_KEY = 'statistics_trading_journal_v1';
const BALANCE_STORAGE_KEY = 'statistics_trading_initial_balance_v1';
const LEVERAGE_STORAGE_KEY = 'statistics_trading_leverage_v1';

export function useTradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currency, setCurrency] = useState<CurrencyUnit>('$');
  const [initialBalance, setInitialBalanceState] = useState<number>(10000);
  const [leverage, setLeverageState] = useState<number>(100);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTrades = localStorage.getItem(STORAGE_KEY);
      if (storedTrades) {
        setTrades(JSON.parse(storedTrades));
      } else {
        setTrades([]);
      }

      const storedBalance = localStorage.getItem(BALANCE_STORAGE_KEY);
      if (storedBalance !== null) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          setInitialBalanceState(parsedBalance);
        }
      }

      const storedLeverage = localStorage.getItem(LEVERAGE_STORAGE_KEY);
      if (storedLeverage !== null) {
        const parsedLeverage = parseFloat(storedLeverage);
        if (!isNaN(parsedLeverage) && parsedLeverage > 0) {
          setLeverageState(parsedLeverage);
        }
      }
    } catch (err) {
      console.error('Error loading data from localStorage', err);
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

  // Update initial balance and persist
  const setInitialBalance = (newBalance: number) => {
    const val = isNaN(newBalance) || newBalance < 0 ? 0 : newBalance;
    setInitialBalanceState(val);
    localStorage.setItem(BALANCE_STORAGE_KEY, val.toString());
  };

  // Update leverage and persist
  const setLeverage = (newLeverage: number) => {
    const val = isNaN(newLeverage) || newLeverage <= 0 ? 1 : newLeverage;
    setLeverageState(val);
    localStorage.setItem(LEVERAGE_STORAGE_KEY, val.toString());
  };

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

  // Calculate Net PnL and Current Balance
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const currentBalance = initialBalance + totalPnL;
  const growthPercent = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

  const exportJSON = () => {
    const exportData = {
      version: 1,
      initialBalance,
      leverage,
      currency,
      trades
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
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
          // Legacy format (array of trades)
          setTrades(parsed);
          alert('นำเข้าข้อมูลรายการเทรดสำเร็จ!');
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.trades)) {
            setTrades(parsed.trades);
          }
          if (typeof parsed.initialBalance === 'number') {
            setInitialBalance(parsed.initialBalance);
          }
          if (typeof parsed.leverage === 'number') {
            setLeverage(parsed.leverage);
          }
          if (parsed.currency) {
            setCurrency(parsed.currency);
          }
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
    initialBalance,
    setInitialBalance,
    leverage,
    setLeverage,
    currentBalance,
    growthPercent,
    totalPnL,
    isLoaded,
    addOrUpdateTrade,
    deleteTrade,
    clearAllTrades,
    exportJSON,
    importJSON
  };
}


