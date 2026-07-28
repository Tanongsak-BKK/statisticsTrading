import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FREECURRENCY_API_KEY || process.env.NEXT_PUBLIC_FREECURRENCY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ rate: 36.50, isFallback: true, message: 'API key not provided in .env.local' });
    }

    const candidateUrls = [
      `https://api.freecurrencyapi.com/v1/latest?currencies=THB&base_currency=USD`,
      `https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&currencies=THB&base_currency=USD`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            'apikey': apiKey,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          const rate = data?.data?.THB;
          if (rate && !isNaN(Number(rate))) {
            return NextResponse.json({
              rate: Number(rate),
              success: true,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (e) {
        console.warn(`FreeCurrencyAPI fetch attempt failed for ${url}`, e);
      }
    }

    return NextResponse.json({ rate: 36.50, isFallback: true, message: 'Using fallback exchange rate' });
  } catch (err: any) {
    return NextResponse.json({ rate: 36.50, isFallback: true, error: err.message });
  }
}
