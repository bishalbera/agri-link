import { NextRequest, NextResponse } from "next/server";
import { getExecutionStatus, formatExecutionStatus } from "@/lib/kestraClient";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get("id");

  if (!executionId) {
    return NextResponse.json(
      { error: "Missing execution ID" },
      { status: 400 }
    );
  }

  if (executionId.startsWith("demo_")) {
    // Simulate progress based on time elapsed
    const timestamp = parseInt(executionId.replace("demo_", ""));
    const elapsed = Date.now() - timestamp;
    
    let phase: "analyzing" | "negotiating" | "arranging" | "complete";
    let progress: number;
    let message: string;

    if (elapsed < 3000) {
      phase = "analyzing";
      progress = 25;
      message = "Analyzing crop quality and market conditions...";
    } else if (elapsed < 8000) {
      phase = "negotiating";
      progress = 50;
      message = "AI agents negotiating with 5 buyers...";
    } else if (elapsed < 12000) {
      phase = "arranging";
      progress = 75;
      message = "Arranging logistics and pickup...";
    } else {
      phase = "complete";
      progress = 100;
      message = "Sale completed successfully!";
    }

    return NextResponse.json({
      success: true,
      data: {
        id: executionId,
        phase,
        progress,
        message,
        details: phase === "complete" ? {
          buyerName: "FreshMart Restaurant",
          pricePerKg: 21,
          totalAmount: 10500,
          pickupDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          grade: "A",
        } : undefined,
      },
    });
  }

  // Real Kestra execution
  try {
    const status = await getExecutionStatus(executionId);
    const formatted = formatExecutionStatus(status);

    return NextResponse.json({
      success: true,
      data: {
        id: executionId,
        ...formatted,
      },
    });
  } catch (error) {
    console.error("[Status API Error]", error);
    
    return NextResponse.json(
      { 
        error: "Failed to get status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
