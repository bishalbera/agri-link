import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      executionId,
      flowId,
      taskId,
      state,
      outputs,
    } = body;

    console.log(`[Webhook] Received callback for execution ${executionId}`);
    console.log(`[Webhook] Flow: ${flowId}, Task: ${taskId}, State: ${state}`);

        return NextResponse.json({
      success: true,
      received: {
        executionId,
        flowId,
        taskId,
        state,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Webhook Error]", error);
    
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const action = searchParams.get("action");
  
  if (action === "market") {
    const commodity = searchParams.get("commodity") || "Tomato";
    const state = searchParams.get("state") || "Maharashtra";
    const cost = searchParams.get("cost") || "10";

    const marketUrl = new URL("/api/market", request.url);
    marketUrl.searchParams.set("commodity", commodity);
    marketUrl.searchParams.set("state", state);
    marketUrl.searchParams.set("cost", cost);

    const response = await fetch(marketUrl);
    return response;
  }

  if (action === "buyers") {
    const commodity = searchParams.get("commodity") || "Tomato";
    
    const buyers = [
      {
        id: "buyer_1",
        name: "FreshMart Restaurant Chain",
        type: "restaurant",
        preferredCommodities: ["Tomato", "Onion", "Potato"],
        volumeCapacity: 1000,
        paymentTerms: "immediate",
        rating: 4.8,
      },
      {
        id: "buyer_2",
        name: "BigBasket Wholesale",
        type: "retailer",
        preferredCommodities: ["Tomato", "Potato", "Onion", "Cabbage"],
        volumeCapacity: 5000,
        paymentTerms: "7_days",
        rating: 4.5,
      },
      {
        id: "buyer_3",
        name: "Metro Cash & Carry",
        type: "wholesale",
        preferredCommodities: ["Tomato", "Onion", "Potato", "Carrot"],
        volumeCapacity: 10000,
        paymentTerms: "15_days",
        rating: 4.7,
      },
      {
        id: "buyer_4",
        name: "Local Sabzi Mandi",
        type: "mandi",
        preferredCommodities: ["Tomato", "Potato", "Onion", "Green Chilli"],
        volumeCapacity: 2000,
        paymentTerms: "immediate",
        rating: 4.2,
      },
      {
        id: "buyer_5",
        name: "Hotel Grand Kitchen",
        type: "restaurant",
        preferredCommodities: ["Tomato", "Capsicum", "Onion"],
        volumeCapacity: 500,
        paymentTerms: "immediate",
        rating: 4.9,
      },
    ];

    const filteredBuyers = buyers.filter(b => 
      b.preferredCommodities.includes(commodity)
    );

    return NextResponse.json(filteredBuyers);
  }

  if (action === "processors") {
    const processors = [
      {
        id: "processor_1",
        name: "Kissan Foods Pvt Ltd",
        type: "processor",
        products: ["Tomato Paste", "Ketchup", "Puree"],
        acceptedCommodities: ["Tomato"],
        minimumQuantity: 500,
        priceMultiplier: 0.7, // 70% of market price
        location: "Nashik, Maharashtra",
      },
      {
        id: "processor_2",
        name: "McCain Foods India",
        type: "processor",
        products: ["Frozen Fries", "Potato Flakes"],
        acceptedCommodities: ["Potato"],
        minimumQuantity: 1000,
        priceMultiplier: 0.75,
        location: "Gujarat",
      },
      {
        id: "processor_3",
        name: "Mother Dairy",
        type: "processor",
        products: ["Frozen Vegetables", "Juice"],
        acceptedCommodities: ["Tomato", "Carrot", "Peas"],
        minimumQuantity: 500,
        priceMultiplier: 0.65,
        location: "Delhi NCR",
      },
      {
        id: "cold_storage_1",
        name: "Snowman Logistics",
        type: "cold_storage",
        products: [],
        acceptedCommodities: ["Tomato", "Potato", "Onion", "Apple"],
        minimumQuantity: 100,
        priceMultiplier: 0, // Storage, not purchase
        storageCostPerKgPerDay: 0.5,
        location: "Multiple locations",
      },
      {
        id: "msp_center_1",
        name: "Government MSP Center",
        type: "msp",
        products: [],
        acceptedCommodities: ["Tomato", "Potato", "Onion"],
        minimumQuantity: 100,
        priceMultiplier: 0.8, // MSP rate
        location: "District HQ",
      },
    ];

    const commodity = searchParams.get("commodity");
    const filteredProcessors = commodity 
      ? processors.filter(p => p.acceptedCommodities.includes(commodity))
      : processors;

    return NextResponse.json(filteredProcessors);
  }

  return NextResponse.json({ 
    error: "Unknown action",
    availableActions: ["market", "buyers", "processors"],
  });
}
