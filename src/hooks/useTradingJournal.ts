'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trade, CurrencyUnit } from '@/types/trade';
import { firebaseService } from '@/services/firebaseService';
import { xauusdService, XAUUSDPriceResult } from '@/services/xauusdService';
import { currencyService, CurrencyRateResult } from '@/services/currencyService';

const STORAGE_KEY = 'statistics_trading_journal_v1';
const BALANCE_STORAGE_KEY = 'statistics_trading_initial_balance_v1';
const LEVERAGE_STORAGE_KEY = 'statistics_trading_leverage_v1';

export function useTradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currency, setCurrency] = useState<CurrencyUnit>('$');
  const [initialBalance, setInitialBalanceState] = useState<number>(10000);
  const [leverage, setLeverageState] = useState<number>(100);
  const [isLoaded, setIsLoaded] = useState(false);

  // External APIs & Firebase States
  const [xauusdInfo, setXauusdInfo] = useState<XAUUSDPriceResult | null>(null);
  const [usdThbInfo, setUsdThbInfo] = useState<CurrencyRateResult | null>(null);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);

  // 1. Initial Load: Load local storage & sync with Firebase if configured
  useEffect(() => {
    async function loadData() {
      try {
        const firebaseConfigured = firebaseService.isConfigured();
        setIsFirebaseActive(firebaseConfigured);

        // Load LocalStorage first (instant)
        const storedTrades = localStorage.getItem(STORAGE_KEY);
        let localTrades: Trade[] = [];
        if (storedTrades) {
          localTrades = JSON.parse(storedTrades);
          setTrades(localTrades);
        }

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
            setTrades(remoteTrades);
          } else if (localTrades.length > 0) {
            // Upload local trades to Firebase on first sync
            await firebaseService.saveAllTrades(localTrades);
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
    setTrades(prev => {
      const existingIndex = prev.findIndex(t => t.id === trade.id);
      let updated: Trade[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = trade;
      } else {
        updated = [trade, ...prev];
      }
      if (firebaseService.isConfigured()) {
        firebaseService.saveTrade(trade);
      }
      return updated;
    });

    // Force fetch fresh XAUUSD market price immediately whenever a trade order is entered or updated
    refreshXAUUSD(true);
  };


  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    if (firebaseService.isConfigured()) {
      firebaseService.deleteTrade(id);
    }
  };

  const clearAllTrades = () => {
    setTrades([]);
    localStorage.removeItem(STORAGE_KEY);
    // Note: Local clear preserves remote data unless explicitly deleted
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
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        let importedTrades: Trade[] = [];
        if (Array.isArray(parsed)) {
          importedTrades = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.trades)) importedTrades = parsed.trades;
          if (typeof parsed.initialBalance === 'number') setInitialBalance(parsed.initialBalance);
          if (typeof parsed.leverage === 'number') setLeverage(parsed.leverage);
          if (parsed.currency) setCurrency(parsed.currency);
        }

        if (importedTrades.length > 0) {
          setTrades(importedTrades);
          if (firebaseService.isConfigured()) {
            await firebaseService.saveAllTrades(importedTrades);
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
    importJSON,
    xauusdInfo,
    usdThbInfo,
    refreshXAUUSD,
    refreshUSDTHB,
    isFirebaseActive
  };
}
