const CURRENCY_CACHE_KEY = 'statistics_usdthb_rate_cache';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface CurrencyRateResult {
  usdThbRate: number;
  lastUpdated: string;
  isFallback?: boolean;
}

export const currencyService = {
  // Fetch USD/THB rate via internal API route (bypassing CORS) with 1-week caching
  fetchRate: async (forceRefresh = false): Promise<CurrencyRateResult> => {
    try {
      // Check cache first if not forced, but skip fallback caches
      if (!forceRefresh) {
        const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CurrencyRateResult;
          const timeDiff = Date.now() - new Date(parsed.lastUpdated).getTime();
          // Only use cache if it's NOT a fallback value and within 1 week
          if (!parsed.isFallback && parsed.usdThbRate > 0 && timeDiff < ONE_WEEK_MS) {
            return parsed;
          }
        }
      }

      // Call internal Next.js API route
      const res = await fetch('/api/currency', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`API Route error: ${res.status}`);
      }

      const data = await res.json();
      if (data?.rate && !isNaN(data.rate) && !data.isFallback) {
        const result: CurrencyRateResult = {
          usdThbRate: Number(data.rate),
          lastUpdated: new Date().toISOString(),
          isFallback: false
        };
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(result));
        return result;
      }

      // If fallback rate returned by server
      if (data?.rate && !isNaN(data.rate)) {
        return {
          usdThbRate: Number(data.rate),
          lastUpdated: new Date().toISOString(),
          isFallback: true
        };
      }

      const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
      if (cached) return JSON.parse(cached);
      return { usdThbRate: 36.50, lastUpdated: new Date().toISOString(), isFallback: true };
    } catch (err) {
      console.error('Error fetching USD/THB rate:', err);
      const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
      if (cached) return JSON.parse(cached);
      return { usdThbRate: 36.50, lastUpdated: new Date().toISOString(), isFallback: true };
    }
  }
};
