import { db, isFirebaseConfigured } from '@/lib/firebaseConfig';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { Trade } from '@/types/trade';

const TRADES_COLLECTION = 'trading_journal_trades';
const SETTINGS_COLLECTION = 'trading_journal_settings';
const DEFAULT_SETTINGS_DOC = 'user_portfolio';

export const firebaseService = {
  isConfigured: () => isFirebaseConfigured,

  // Save single trade to Firestore
  saveTrade: async (trade: Trade) => {
    if (!db || !isFirebaseConfigured) return;
    try {
      const docRef = doc(db, TRADES_COLLECTION, trade.id);
      await setDoc(docRef, trade, { merge: true });
    } catch (err) {
      console.error('Error saving trade to Firebase:', err);
    }
  },

  // Save all trades in bulk (for import or batch update)
  saveAllTrades: async (trades: Trade[]) => {
    if (!db || !isFirebaseConfigured) return;
    try {
      for (const trade of trades) {
        const docRef = doc(db, TRADES_COLLECTION, trade.id);
        await setDoc(docRef, trade, { merge: true });
      }
    } catch (err) {
      console.error('Error saving all trades to Firebase:', err);
    }
  },

  // Delete trade from Firestore
  deleteTrade: async (id: string) => {
    if (!db || !isFirebaseConfigured) return;
    try {
      const docRef = doc(db, TRADES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting trade from Firebase:', err);
    }
  },

  // Fetch all trades from Firestore
  fetchTrades: async (): Promise<Trade[] | null> => {
    if (!db || !isFirebaseConfigured) return null;
    try {
      const querySnapshot = await getDocs(collection(db, TRADES_COLLECTION));
      const trades: Trade[] = [];
      querySnapshot.forEach((doc) => {
        trades.push(doc.data() as Trade);
      });
      return trades;
    } catch (err) {
      console.error('Error fetching trades from Firebase:', err);
      return null;
    }
  },

  // Save portfolio settings (Initial Balance, Current Balance, Total PnL, Leverage, Currency)
  saveSettings: async (settings: {
    initialBalance: number;
    currentBalance?: number;
    totalPnL?: number;
    leverage: number;
    currency: string;
  }) => {
    if (!db || !isFirebaseConfigured) return;
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
      await setDoc(
        docRef,
        {
          ...settings,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error saving settings to Firebase:', err);
    }
  },

  // Fetch portfolio settings from Firestore
  fetchSettings: async () => {
    if (!db || !isFirebaseConfigured) return null;
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as {
          initialBalance?: number;
          currentBalance?: number;
          totalPnL?: number;
          leverage?: number;
          currency?: string;
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching settings from Firebase:', err);
      return null;
    }
  }

};
