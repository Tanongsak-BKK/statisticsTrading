import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.COMMODITY_PRICE_API_KEY || process.env.NEXT_PUBLIC_COMMODITY_PRICE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured in .env.local' }, { status: 400 });
    }

    // Candidate URL requests adhering to official CommodityPriceAPI v2 specifications
    const candidateUrls = [
      `https://api.commoditypriceapi.com/v2/rates/latest?symbols=XAU&apiKey=${apiKey}`,
      `https://api.commoditypriceapi.com/v2/rates/latest?symbols=XAU`,
      `https://api.commoditypriceapi.com/v2/latest?symbols=XAU&apiKey=${apiKey}`,
      `https://commoditypriceapi.com/api/v1/latest?symbol=XAU&api_key=${apiKey}`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          // Extract price from CommodityPriceAPI JSON response (v2: { rates: { XAU: 2745.20 } })
          const price =
            data?.rates?.XAU ||
            data?.data?.rates?.XAU ||
            data?.rates?.XAUUSD ||
            data?.data?.price ||
            data?.price ||
            (data?.rates && typeof Object.values(data.rates)[0] === 'number' && Object.values(data.rates)[0]);

          if (price && !isNaN(Number(price))) {
            return NextResponse.json({
              price: Number(price),
              success: true,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn(`Attempt failed for URL: ${url}`, err);
      }
    }

    return NextResponse.json(
      { error: 'Unable to parse XAUUSD price from CommodityPriceAPI' },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
