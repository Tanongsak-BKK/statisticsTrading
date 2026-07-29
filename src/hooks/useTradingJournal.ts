'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';
import { calculateTradeMetrics } from '@/utils/tradeUtils';
import { firebaseService } from '@/services/firebaseService';
import { xauusdService, XAUUSDPriceResult } from '@/services/xauusdService';
import { currencyService, CurrencyRateResult } from '@/services/currencyService';

const STORAGE_KEY = 'statistics_trading_journal_trades';
const BALANCE_STORAGE_KEY = 'statistics_trading_initial_balance';
const LEVERAGE_STORAGE_KEY = 'statistics_trading_leverage';

function normalizeAndRecalculateTrades(rawTrades: Trade[]): Trade[] {
  return rawTrades.map(trade => {
    const metrics = calculateTradeMetrics(
      trade.entryPrice,
      trade.exitPrice,
      trade.lotSize,
      trade.direction,
      trade.stopLoss,
      trade.takeProfit,
      typeof trade.pnl === 'number' ? trade.pnl : null,
      trade.symbol,
      trade.orderCount || 1,
      trade.commission || 0,
      trade.swap || 0
    );
    return {
      ...trade,
      pnl: metrics.pnl,
      pnlPercent: metrics.pnlPercent,
      outcome: metrics.outcome,
      rr: metrics.rr
    };
  });
}


export function useTradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialBalance, setInitialBalanceState] = useState<number>(10000);
  const [leverage, setLeverageState] = useState<number>(100);
  const [currency, setCurrency] = useState<CurrencyUnit>('$');
  const [isLoaded, setIsLoaded] = useState(false);
  const [xauusdInfo, setXauusdInfo] = useState<XAUUSDPriceResult | null>(null);
  const [usdThbInfo, setUsdThbInfo] = useState<CurrencyRateResult | null>(null);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  // 1. Initial Load: Check LocalStorage & Firebase Firestore
  useEffect(() => {
    async function loadData() {
      try {
        const firebaseConfigured = firebaseService.isConfigured();
        setIsFirebaseActive(firebaseConfigured);

        // Load local data first
        const localData = localStorage.getItem(STORAGE_KEY);
        let localTrades: Trade[] = [];
        if (localData) {
          try {
            localTrades = JSON.parse(localData);
          } catch (e) {
            console.error('Error parsing local trades JSON', e);
          }
        }
        const normalizedLocal = normalizeAndRecalculateTrades(localTrades);
        setTrades(normalizedLocal);

        const storedBalance = localStorage.getItem(BALANCE_STORAGE_KEY);
        if (storedBalance !== null) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance)) setInitialBalanceState(parsedBalance);
        }

        const storedLeverage = localStorage.getItem(LEVERAGE_STORAGE_KEY);
        if (storedLeverage !== null) {
          const parsedLeverage = parseFloat(storedLeverage);
          if (!isNaN(parsedLeverage) && parsedLeverage > 0) setLeverageState(parsedLeverage);
        }

        // If Firebase is configured, fetch latest Firestore data
        if (firebaseConfigured) {
          const remoteTrades = await firebaseService.fetchTrades();
          if (remoteTrades && remoteTrades.length > 0) {
            const normalizedRemote = normalizeAndRecalculateTrades(remoteTrades);
            setTrades(normalizedRemote);
          } else if (localTrades.length > 0) {
            // Upload local trades to Firebase on first sync
            await firebaseService.saveAllTrades(normalizedLocal);
          }


          const remoteSettings = await firebaseService.fetchSettings();
          if (remoteSettings) {
            if (typeof remoteSettings.initialBalance === 'number') setInitialBalanceState(remoteSettings.initialBalance);
            if (typeof remoteSettings.leverage === 'number') setLeverageState(remoteSettings.leverage);
            if (remoteSettings.currency) setCurrency(remoteSettings.currency as CurrencyUnit);
          }
        }
      } catch (err) {
        console.error('Error loading data in useTradingJournal:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, []);

  // 2. Fetch USD/THB Rate (1-week cache interval)
  const refreshUSDTHB = useCallback(async (force = false) => {
    const res = await currencyService.fetchRate(force);
    setUsdThbInfo(res);
  }, []);

  useEffect(() => {
    refreshUSDTHB();
  }, [refreshUSDTHB]);

  // 3. Fetch XAUUSD Price (1-hour interval) & Check SL/TP Hits
  const refreshXAUUSD = useCallback(async (force = false) => {
    const res = await xauusdService.fetchPrice(force);
    if (res && res.price) {
      setXauusdInfo(res);
      // Auto check SL/TP for XAUUSD trades
      setTrades(prevTrades => {
        const { updatedTrades, hasChanges } = xauusdService.checkAutoSLTP(prevTrades, res.price);
        if (hasChanges) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrades));
          if (firebaseService.isConfigured()) {
            firebaseService.saveAllTrades(updatedTrades);
          }
          return updatedTrades;
        }
        return prevTrades;
      });
    }
  }, []);

  // Set up 1-hour polling interval for XAUUSD price
  useEffect(() => {
    refreshXAUUSD();
    const ONE_HOUR = 60 * 60 * 1000;
    const interval = setInterval(() => {
      refreshXAUUSD();
    }, ONE_HOUR);

    return () => clearInterval(interval);
  }, [refreshXAUUSD]);

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
    if (firebaseService.isConfigured()) {
      firebaseService.saveSettings({ initialBalance: val, leverage, currency });
    }
  };

  // Update leverage and persist
  const setLeverage = (newLeverage: number) => {
    const val = isNaN(newLeverage) || newLeverage <= 0 ? 1 : newLeverage;
    setLeverageState(val);
    localStorage.setItem(LEVERAGE_STORAGE_KEY, val.toString());
    if (firebaseService.isConfigured()) {
      firebaseService.saveSettings({ initialBalance, leverage: val, currency });
    }
  };

  const addOrUpdateTrade = (trade: Trade) => {
    // Recalculate metrics accurately with symbol contract size and direction-based TP/SL
    const metrics = calculateTradeMetrics(
      trade.entryPrice,
      trade.exitPrice,
      trade.lotSize,
      trade.direction,
      trade.stopLoss,
      trade.takeProfit,
      typeof trade.pnl === 'number' ? trade.pnl : null,
      trade.symbol,
      trade.orderCount || 1,
      trade.commission || 0,
      trade.swap || 0
    );

    const updatedTrade: Trade = {
      ...trade,
      pnl: metrics.pnl,
      pnlPercent: metrics.pnlPercent,
      outcome: metrics.outcome,
      rr: metrics.rr
    };

    setTrades(prev => {
      const existingIndex = prev.findIndex(t => t.id === updatedTrade.id);
      let updated: Trade[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = updatedTrade;
      } else {
        updated = [updatedTrade, ...prev];
      }
      if (firebaseService.isConfigured()) {
        firebaseService.saveTrade(updatedTrade);
      }
      return updated;
    });

    // Force fetch fresh XAUUSD market price immediately whenever a trade order is entered or updated
    refreshXAUUSD(true);
  };

  const deleteTrade = (id: string) => {
    setTrades(prev =>
      prev.map(t => {
        if (t.id === id) {
          const deletedTrade = { ...t, isDeleted: true, deletedAt: new Date().toISOString() };
          if (firebaseService.isConfigured()) {
            firebaseService.saveTrade(deletedTrade);
          }
          return deletedTrade;
        }
        return t;
      })
    );
  };

  const restoreTrade = (id: string) => {
    setTrades(prev =>
      prev.map(t => {
        if (t.id === id) {
          const restoredTrade = { ...t, isDeleted: false, deletedAt: undefined };
          if (firebaseService.isConfigured()) {
            firebaseService.saveTrade(restoredTrade);
          }
          return restoredTrade;
        }
        return t;
      })
    );
  };

  const permanentDeleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    if (firebaseService.isConfigured()) {
      firebaseService.deleteTrade(id);
    }
  };


  const clearAllTrades = () => {
    setTrades([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Calculate Net PnL across all active (non-deleted) trades
  const totalPnL = trades.reduce((sum, t) => {
    if (!t.isDeleted && t.exitPrice !== null && !isNaN(t.exitPrice)) {
      return sum + (t.pnl || 0);
    }
    return sum;
  }, 0);


  const currentBalance = initialBalance + totalPnL;
  const growthPercent = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

  // Auto sync balance & portfolio settings to Firebase whenever initialBalance, leverage, currency, or totalPnL updates
  useEffect(() => {
    if (isLoaded && firebaseService.isConfigured()) {
      firebaseService.saveSettings({
        initialBalance,
        currentBalance,
        totalPnL,
        leverage,
        currency
      });
    }
  }, [initialBalance, currentBalance, totalPnL, leverage, currency, isLoaded]);


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
        if (parsed.trades && Array.isArray(parsed.trades)) {
          setTrades(parsed.trades);
          if (typeof parsed.initialBalance === 'number') setInitialBalance(parsed.initialBalance);
          if (typeof parsed.leverage === 'number') setLeverage(parsed.leverage);
          if (parsed.currency) setCurrency(parsed.currency);

          if (firebaseService.isConfigured()) {
            firebaseService.saveAllTrades(parsed.trades);
            firebaseService.saveSettings({
              initialBalance: parsed.initialBalance || initialBalance,
              leverage: parsed.leverage || leverage,
              currency: parsed.currency || currency
            });
          }
          alert('นำเข้าข้อมูลสำเร็จแล้ว!');
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการนำเข้าไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return {
    trades,
    initialBalance,
    setInitialBalance,
    leverage,
    setLeverage,
    currency,
    setCurrency,
    currentBalance,
    growthPercent,
    isLoaded,
    addOrUpdateTrade,
    deleteTrade,
    restoreTrade,
    permanentDeleteTrade,
    clearAllTrades,

    exportJSON,
    importJSON,
    xauusdInfo,
    usdThbInfo,
    refreshXAUUSD,
    refreshUSDTHB,
    isFirebaseActive
  };
}
