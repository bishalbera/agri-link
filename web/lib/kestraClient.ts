// lib/kestraClient.ts
// Kestra API Client for workflow orchestration
//
// This client communicates with the FastAPI backend which uses the Kestra Python SDK.
// Architecture: Next.js → FastAPI (Python) → Kestra SDK → Kestra
//
// FastAPI Backend: See backend/kestra_api.py

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
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
  state: "CREATED" | "RUNNING" | "SUCCESS" | "WARNING" | "FAILED" | "KILLING" | "KILLED" | "PAUSED";
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

/**
 * Get headers for FastAPI requests
 */
function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    // FastAPI handles Kestra authentication internally
  };
}

/**
 * Trigger a Kestra workflow execution via FastAPI backend
 *
 * FastAPI endpoint maps to appropriate workflow based on flowId
 */
export async function triggerExecution(
  flowId: string,
  inputs: Record<string, unknown>
): Promise<ExecutionResponse> {
  if (!FASTAPI_URL) {
    throw new Error("FastAPI configuration missing. Set FASTAPI_URL");
  }

  // Map flowId to FastAPI endpoint
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

/**
 * Get execution status via FastAPI backend
 *
 * FastAPI endpoint: GET /api/execution/{execution_id}
 */
export async function getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
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

/**
 * Get task outputs from an execution
 */
export async function getTaskOutputs(
  executionId: string,
  taskId: string
): Promise<Record<string, unknown> | null> {
  const status = await getExecutionStatus(executionId);
  
  const taskRun = status.taskRunList?.find(t => t.taskId === taskId);
  return taskRun?.outputs || null;
}

/**
 * Wait for execution to complete (with timeout)
 */
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

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Execution ${executionId} timed out after ${timeoutMs}ms`);
}

/**
 * Simplified execution trigger for Agri-Link workflows
 * Calls FastAPI backend which uses Kestra Python SDK
 */
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

/**
 * Format execution status for frontend display
 */
export function formatExecutionStatus(status: ExecutionStatus): {
  phase: "analyzing" | "negotiating" | "arranging" | "complete" | "failed";
  progress: number;
  message: string;
  details?: Record<string, unknown>;
} {
  switch (status.state) {
    case "CREATED":
    case "RUNNING":
      // Determine phase based on outputs
      if (status.outputs?.quality_result) {
        if (status.outputs?.negotiation_result) {
          return {
            phase: "arranging",
            progress: 75,
            message: "Arranging logistics...",
            details: status.outputs,
          };
        }
        return {
          phase: "negotiating",
          progress: 50,
          message: "AI agents negotiating with buyers...",
          details: status.outputs,
        };
      }
      return {
        phase: "analyzing",
        progress: 25,
        message: "Analyzing crop quality and market conditions...",
      };

    case "SUCCESS":
      return {
        phase: "complete",
        progress: 100,
        message: "Sale completed successfully!",
        details: status.outputs,
      };

    case "FAILED":
    case "KILLED":
      return {
        phase: "failed",
        progress: 0,
        message: "Something went wrong. Please try again.",
        details: status.outputs,
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
