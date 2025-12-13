// app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "agri-link",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    features: {
      marketData: "data.gov.in",
      aiAgents: "Kestra + Gemini",
      deployment: "Vercel Edge",
    },
  });
}
