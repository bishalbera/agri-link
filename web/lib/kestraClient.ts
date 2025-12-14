const FASTAPI_URL =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  "http://localhost:8000";
const KESTRA_NAMESPACE = process.env.KESTRA_NAMESPACE || "agrilink";
const KESTRA_TENANT = process.env.KESTRA_TENANT || "default";

export interface ExecutionRequest {
  flowId: string;
  inputs: Record<string, unknown>;
}

export interface ExecutionResponse {
  id: string;
  namespace: string;
  flowId: string;
  state: {
    current: string;
    histories: Array<{
      state: string;
      date: string;
    }>;
  };
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

export interface ExecutionStatus {
  id: string;
  state:
    | "CREATED"
    | "RUNNING"
    | "SUCCESS"
    | "WARNING"
    | "FAILED"
    | "KILLING"
    | "KILLED"
    | "PAUSED";
  startDate: string;
  endDate?: string;
  duration?: number;
  outputs?: Record<string, unknown>;
  taskRunList?: Array<{
    taskId: string;
    state: string;
    outputs?: Record<string, unknown>;
  }>;
}

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}
export async function triggerExecution(
  flowId: string,
  inputs: Record<string, unknown>
): Promise<ExecutionResponse> {
  if (!FASTAPI_URL) {
    throw new Error("FastAPI configuration missing. Set FASTAPI_URL");
  }

  const endpointMap: Record<string, string> = {
    "main-sale-workflow": "/api/sale",
    "crisis-shield": "/api/crisis",
    "market-monitor": "/api/monitor",
  };

  const endpoint = endpointMap[flowId];
  if (!endpoint) {
    throw new Error(`Unknown flowId: ${flowId}`);
  }

  const baseUrl = FASTAPI_URL.replace(/\/$/, "");
  const url = `${baseUrl}${endpoint}`;

  console.log(`[FastAPI] Triggering workflow: ${flowId} via ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(inputs),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[FastAPI] API error: ${response.status} - ${error}`);
    throw new Error(`FastAPI error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Convert FastAPI response format to our expected format
  return {
    id: data.execution_id,
    namespace: data.namespace || KESTRA_NAMESPACE,
    flowId: data.flow_id || flowId,
    state: {
      current: data.state || "CREATED",
      histories: [],
    },
    inputs,
    outputs: data.outputs,
  };
}

export async function getExecutionStatus(
  executionId: string
): Promise<ExecutionStatus> {
  if (!FASTAPI_URL) {
    throw new Error("FastAPI configuration missing");
  }

  const baseUrl = FASTAPI_URL.replace(/\/$/, "");
  const url = `${baseUrl}/api/execution/${executionId}`;

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 0 }, // Don't cache status checks
  });

  if (!response.ok) {
    throw new Error(`Failed to get execution status: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.execution_id,
    state: data.state as ExecutionStatus["state"],
    startDate: "", // FastAPI response doesn't include dates (could be added)
    endDate: data.is_success ? new Date().toISOString() : undefined,
    outputs: data.outputs,
  };
}

export async function getTaskOutputs(
  executionId: string,
  taskId: string
): Promise<Record<string, unknown> | null> {
  const status = await getExecutionStatus(executionId);

  const taskRun = status.taskRunList?.find((t) => t.taskId === taskId);
  return taskRun?.outputs || null;
}

export async function waitForExecution(
  executionId: string,
  timeoutMs: number = 300000, // 5 minutes default
  pollIntervalMs: number = 2000
): Promise<ExecutionStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getExecutionStatus(executionId);

    if (["SUCCESS", "FAILED", "WARNING", "KILLED"].includes(status.state)) {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Execution ${executionId} timed out after ${timeoutMs}ms`);
}

export async function startSaleWorkflow(params: {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  commodity: string;
  quantityKg: number;
  state: string;
  district: string;
  cropImageUrl?: string;
  costOfProduction?: number;
  wait?: boolean;
}): Promise<{ executionId: string }> {
  // FastAPI expects snake_case parameters
  const execution = await triggerExecution("main-sale-workflow", {
    farmer_id: params.farmerId,
    farmer_name: params.farmerName,
    farmer_phone: params.farmerPhone,
    commodity: params.commodity,
    quantity_kg: params.quantityKg,
    state: params.state,
    district: params.district,
    crop_image_url: params.cropImageUrl || "",
    cost_of_production: params.costOfProduction || 800,
    wait: params.wait || false,
  });

  return { executionId: execution.id };
}

export function formatExecutionStatus(status: ExecutionStatus): {
  phase: "analyzing" | "negotiating" | "arranging" | "complete" | "failed";
  progress: number;
  message: string;
  isCrisis?: boolean;
  details?: {
    buyerName?: string;
    pricePerKg?: number;
    totalAmount?: number;
    pickupDate?: string;
    grade?: string;
    // Crisis shield specific fields
    outletName?: string;
    outletType?: string;
    outletLocation?: string;
    savings?: number;
    lossReduction?: number;
  };
} {
  // Helper to extract crisis shield details from Kestra outputs
  const extractCrisisDetails = (outputs: any) => {
    try {
      const qualityGrade = outputs?.quality_assessment?.grade || "B";

      // Check for crisis resolution output from crisis-shield flow
      if (outputs?.crisis_resolution) {
        const crisis = outputs.crisis_resolution;
        const selectedOutlet = crisis.selected_outlet;
        const financialAnalysis = crisis.financial_analysis;

        return {
          outletName: selectedOutlet?.name || "Emergency Outlet",
          outletType: selectedOutlet?.type || "processor",
          outletLocation: selectedOutlet?.location || "Location TBD",
          pricePerKg: financialAnalysis?.outlet_price_per_kg || 0,
          totalAmount: financialAnalysis?.outlet_total || 0,
          savings: financialAnalysis?.savings_vs_market || 0,
          lossReduction: financialAnalysis?.loss_reduction_percent || 0,
          grade: qualityGrade,
        };
      }

      return undefined;
    } catch (err) {
      console.error("Error extracting crisis details:", err);
      return undefined;
    }
  };

  // Helper to extract buyer details from Kestra outputs
  const extractBuyerDetails = (outputs: any) => {
    try {
      const qualityGrade = outputs?.quality_assessment?.grade || "B";

      // Check if we have negotiation results (best_offer from negotiation-swarm)
      if (outputs?.best_offer) {
        const bestOffer = outputs.best_offer;
        const winner = bestOffer.winner;

        return {
          buyerName: winner?.buyer_name || "Selected Buyer",
          pricePerKg: winner?.final_price_per_kg || 0,
          totalAmount: winner?.total_amount || 0,
          pickupDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
          grade: qualityGrade,
        };
      }

      // Fallback to market intelligence data if no negotiation yet
      if (outputs?.market_intelligence && outputs?.quality_assessment) {
        const marketPrice = outputs.market_intelligence.recommended_min_price || 0;
        const quantity = 100; // Default, should come from inputs

        return {
          buyerName: "Pending Selection",
          pricePerKg: marketPrice,
          totalAmount: marketPrice * quantity,
          pickupDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          grade: qualityGrade,
        };
      }

      return undefined;
    } catch (err) {
      console.error("Error extracting buyer details:", err);
      return undefined;
    }
  };

  // Check if this is a crisis shield execution
  const isCrisisPath = status.outputs?.execution_path === "CRISIS_SHIELD" ||
                       status.outputs?.crisis_resolution !== undefined;

  switch (status.state) {
    case "CREATED":
    case "RUNNING":
      // Crisis Shield Path
      if (isCrisisPath) {
        if (status.outputs?.crisis_resolution) {
          return {
            phase: "arranging",
            progress: 75,
            message: "Emergency outlet found! Arranging diversion...",
            isCrisis: true,
            details: extractCrisisDetails(status.outputs),
          };
        }
        if (status.outputs?.market_intelligence) {
          return {
            phase: "negotiating",
            progress: 50,
            message: "Crisis detected! Finding emergency outlets...",
            isCrisis: true,
          };
        }
      }

      // Normal Negotiation Path
      if (status.outputs?.quality_assessment) {
        if (status.outputs?.best_offer) {
          return {
            phase: "arranging",
            progress: 75,
            message: "Finalizing deal and arranging pickup...",
            isCrisis: false,
            details: extractBuyerDetails(status.outputs),
          };
        }
        if (status.outputs?.market_intelligence) {
          return {
            phase: "negotiating",
            progress: 50,
            message: "AI agents negotiating with buyers...",
            isCrisis: false,
            details: extractBuyerDetails(status.outputs),
          };
        }
      }
      return {
        phase: "analyzing",
        progress: 25,
        message: "Analyzing crop quality and market conditions...",
        isCrisis: false,
      };

    case "SUCCESS":
      if (isCrisisPath) {
        return {
          phase: "complete",
          progress: 100,
          message: "Crisis averted! Produce diverted successfully!",
          isCrisis: true,
          details: extractCrisisDetails(status.outputs),
        };
      }
      return {
        phase: "complete",
        progress: 100,
        message: "Sale completed successfully!",
        isCrisis: false,
        details: extractBuyerDetails(status.outputs),
      };

    case "FAILED":
    case "KILLED":
      return {
        phase: "failed",
        progress: 0,
        message: "Something went wrong. Please try again.",
      };

    default:
      return {
        phase: "analyzing",
        progress: 10,
        message: "Processing...",
      };
  }
}

export type { ExecutionStatus, ExecutionResponse };
