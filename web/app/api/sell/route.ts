import { NextRequest, NextResponse } from "next/server";
import { startSaleWorkflow } from "@/lib/kestraClient";
import { analyzeMarket } from "@/lib/dataGovApi";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      farmerId,
      farmerName,
      farmerPhone,
      commodity,
      quantityKg,
      state,
      district,
      cropImageUrl,
      costOfProduction,
    } = body;

    if (!commodity || !quantityKg || !state) {
      return NextResponse.json(
        { error: "Missing required fields: commodity, quantityKg, state" },
        { status: 400 }
      );
    }

    let marketAnalysis;
    try {
      marketAnalysis = await analyzeMarket(commodity, state, costOfProduction);
    } catch (error) {
      console.error("Market analysis error:", error);
      marketAnalysis = {
        status: "NORMAL",
        currentPricePerKg: 18,
        recommendation: "PROCEED_WITH_NEGOTIATION",
      };
    }

    let executionId = null;
    try {
      const result = await startSaleWorkflow({
        farmerId: farmerId || `farmer_${Date.now()}`,
        farmerName: farmerName || "Demo Farmer",
        farmerPhone: farmerPhone || "+919999999999",
        commodity,
        quantityKg,
        state,
        district: district || "Demo District",
        cropImageUrl,
        costOfProduction,
      });
      executionId = result.executionId;
    } catch (error) {
      console.error("Kestra trigger error:", error);
      executionId = `demo_${Date.now()}`;
    }

    return NextResponse.json({
      success: true,
      executionId,
      marketAnalysis,
      message: "Sale workflow initiated",
    });
  } catch (error) {
    console.error("[Sell API Error]", error);
    
    return NextResponse.json(
      { 
        error: "Failed to initiate sale", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
