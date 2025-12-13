import { NextRequest, NextResponse } from "next/server";
import { analyzeMarket, COST_OF_PRODUCTION } from "@/lib/dataGovApi";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const commodity = searchParams.get("commodity") || "Tomato";
  const state = searchParams.get("state") || "Maharashtra";
  const costParam = searchParams.get("cost");
  const cost = costParam ? parseFloat(costParam) : COST_OF_PRODUCTION[commodity] || 10;

  try {
    const analysis = await analyzeMarket(commodity, state, cost);

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        commodity,
        state,
        costOfProductionPerKg: cost,
        fetchedAt: new Date().toISOString(),
        source: "data.gov.in",
      },
    });
  } catch (error) {
    console.error("[Market API Error]", error);

    return NextResponse.json({
      success: true,
      data: {
        currentPrice: 1800,
        currentPricePerKg: 18,
        avgPrice7Day: 1900,
        avgPrice30Day: 2000,
        priceDropPercent: 5.3,
        priceChangeDirection: "down",
        status: "NORMAL",
        statusReason: "Market conditions are stable (Demo Mode)",
        recommendation: "PROCEED_WITH_NEGOTIATION",
        latestRecords: [],
        marketCount: 0,
        dataFreshness: "Demo data",
      },
      meta: {
        commodity,
        state,
        costOfProductionPerKg: cost,
        fetchedAt: new Date().toISOString(),
        source: "demo",
        note: "Using demo data due to API error",
      },
    });
  }
}
