const CURRENCY_CACHE_KEY = 'statistics_usdthb_rate_cache';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface CurrencyRateResult {
  usdThbRate: number;
  lastUpdated: string;
  isFallback?: boolean;
}

export const currencyService = {
  // Fetch USD/THB rate from FreeCurrencyAPI with 1-week caching
  fetchRate: async (forceRefresh = false): Promise<CurrencyRateResult> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FREECURRENCY_API_KEY;

      // Check cache first if not forced
      if (!forceRefresh) {
        const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CurrencyRateResult;
          const timeDiff = Date.now() - new Date(parsed.lastUpdated).getTime();
          if (timeDiff < ONE_WEEK_MS) {
            return parsed;
          }
        }
      }

      if (!apiKey) {
        console.log('FreeCurrencyAPI key not configured in .env.local');
        const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
        if (cached) return JSON.parse(cached);
        return { usdThbRate: 36.50, lastUpdated: new Date().toISOString(), isFallback: true };
      }

      // Fetch from freecurrencyapi.com
      const res = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&currencies=THB&base_currency=USD`);
      if (!res.ok) {
        throw new Error(`FreeCurrencyAPI error: ${res.statusText}`);
      }

      const data = await res.json();
      const rate = data?.data?.THB;

      if (rate && !isNaN(rate)) {
        const result: CurrencyRateResult = {
          usdThbRate: parseFloat(rate),
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(result));
        return result;
      }

      const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
      if (cached) return JSON.parse(cached);
      return { usdThbRate: 36.50, lastUpdated: new Date().toISOString(), isFallback: true };
    } catch (err) {
      console.error('Error fetching USD/THB rate from FreeCurrencyAPI:', err);
      const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
      if (cached) return JSON.parse(cached);
      return { usdThbRate: 36.50, lastUpdated: new Date().toISOString(), isFallback: true };
    }
  }
};
