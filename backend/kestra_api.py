
import os
import json
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

try:
    from fastapi import FastAPI, HTTPException, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    print("FastAPI not installed. Run: pip install fastapi uvicorn")

from kestra_client import AgriLinkKestra, ExecutionResult

class SaleRequest(BaseModel):
    """Request model for starting a sale"""
    farmer_id: str
    farmer_name: str = "Farmer"
    farmer_phone: str = "+919999999999"
    commodity: str = "Tomato"
    quantity_kg: int = 100
    state: str = "Maharashtra"
    district: str = "Nashik"
    crop_image_url: str = ""
    cost_of_production: int = 800
    wait: bool = False


class CrisisRequest(BaseModel):
    """Request model for crisis shield activation"""
    farmer_id: str
    commodity: str
    quantity_kg: int
    state: str
    district: str
    quality_grade: str = '{"grade": "B"}'
    wait: bool = False


class MarketMonitorRequest(BaseModel):
    """Request model for market monitoring"""
    commodities: str = "Tomato,Potato,Onion"
    state: str = "Maharashtra"
    wait: bool = False


class ExecutionResponse(BaseModel):
    """Response model for execution results"""
    execution_id: str
    state: str
    namespace: str
    flow_id: str
    outputs: Optional[Dict[str, Any]] = None
    is_success: bool = False
    is_running: bool = False


kestra_client: Optional[AgriLinkKestra] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Kestra client on startup and deploy flows"""
    global kestra_client
    try:
        kestra_client = AgriLinkKestra()
        print(f"✅ Connected to Kestra at {kestra_client.host}")

        # Deploy all flows on startup
        flows_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "kestra", "flows")
        if os.path.exists(flows_dir):
            print(f"📦 Deploying flows from {flows_dir}...")
            try:
                results = kestra_client.deploy_all_flows(flows_dir)
                for flow_name, result in results.items():
                    if result.get("success"):
                        status_icon = "✅"
                        status_msg = result.get("status", "deployed")
                    else:
                        status_icon = "⚠️"
                        status_msg = f"error: {result.get('error', 'unknown')}"
                    print(f"  {status_icon} {flow_name}: {status_msg}")
            except Exception as e:
                print(f"Flow deployment failed: {e}")
                print("  Note: Flows can still be deployed manually via /api/deploy endpoint")
        else:
            print(f"⚠️ Flows directory not found: {flows_dir}")
    except Exception as e:
        print(f"Failed to initialize Kestra client: {e}")
        kestra_client = None
    yield
    kestra_client = None


if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="Agri-Link Kestra API",
        description="REST API for Kestra workflow operations using Python SDK",
        version="1.0.0",
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def convert_result(result: ExecutionResult) -> ExecutionResponse:
    """Convert internal ExecutionResult to API response"""
    return ExecutionResponse(
        execution_id=result.execution_id,
        state=result.state,
        namespace=result.namespace,
        flow_id=result.flow_id,
        outputs=result.outputs,
        is_success=result.is_success(),
        is_running=result.is_running()
    )


if FASTAPI_AVAILABLE:
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "kestra_connected": kestra_client is not None,
            "kestra_host": kestra_client.host if kestra_client else None
        }


    @app.post("/api/sale", response_model=ExecutionResponse)
    async def start_sale(request: SaleRequest):
        """
        Start a new sale workflow.
        
        This triggers the main-sale-workflow which:
        1. Assesses crop quality using AI
        2. Fetches market data from data.gov.in
        3. AI decides: Normal negotiation or Crisis Shield
        4. Executes appropriate sub-workflow
        """
        if not kestra_client:
            raise HTTPException(status_code=503, detail="Kestra client not initialized")
        
        try:
            result = kestra_client.start_sale(
                farmer_id=request.farmer_id,
                farmer_name=request.farmer_name,
                farmer_phone=request.farmer_phone,
                commodity=request.commodity,
                quantity_kg=request.quantity_kg,
                state=request.state,
                district=request.district,
                crop_image_url=request.crop_image_url,
                cost_of_production=request.cost_of_production,
                wait=request.wait
            )
            return convert_result(result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


    @app.post("/api/crisis", response_model=ExecutionResponse)
    async def activate_crisis_shield(request: CrisisRequest):
        """
        Directly activate Crisis Shield workflow.
        
        Use this when market prices have crashed and immediate
        diversion to food processors is needed.
        """
        if not kestra_client:
            raise HTTPException(status_code=503, detail="Kestra client not initialized")
        
        try:
            result = kestra_client.start_crisis_shield(
                farmer_id=request.farmer_id,
                commodity=request.commodity,
                quantity_kg=request.quantity_kg,
                state=request.state,
                district=request.district,
                quality_grade=request.quality_grade,
                wait=request.wait
            )
            return convert_result(result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


    @app.post("/api/monitor", response_model=ExecutionResponse)
    async def start_market_monitor(request: MarketMonitorRequest):
        """
        Start market monitoring workflow.
        
        Monitors prices for specified commodities and generates alerts.
        """
        if not kestra_client:
            raise HTTPException(status_code=503, detail="Kestra client not initialized")
        
        try:
            result = kestra_client.start_market_monitor(
                commodities=request.commodities,
                state=request.state,
                wait=request.wait
            )
            return convert_result(result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


    @app.get("/api/execution/{execution_id}", response_model=ExecutionResponse)
    async def get_execution_status(execution_id: str):
        """
        Get current status of an execution.

        Poll this endpoint to track workflow progress.
        """
        if not kestra_client:
            raise HTTPException(status_code=503, detail="Kestra client not initialized")

        try:
            result = kestra_client.get_execution_status(execution_id)
            return convert_result(result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


    @app.post("/api/deploy")
    async def deploy_flows(flows_directory: str = "./kestra/flows"):
        """
        Deploy all flows from a directory to Kestra.
        
        This is typically done once during setup.
        """
        if not kestra_client:
            raise HTTPException(status_code=503, detail="Kestra client not initialized")
        
        try:
            results = kestra_client.deploy_all_flows(flows_directory)
            return {
                "success": all(r.get("success", False) for r in results.values()),
                "results": results
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


def main():
    """Run the API server"""
    if not FASTAPI_AVAILABLE:
        print("Error: FastAPI not installed")
        print("Run: pip install fastapi uvicorn")
        return
    
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    print(f"""
      Agri-Link Kestra API Server                         
      Running on: http://{host}:{port}                          
      Docs: http://{host}:{port}/docs                           
    """)
    
    uvicorn.run(
        "kestra_api:app",
        host=host,
        port=port,
        reload=True
    )


if __name__ == "__main__":
    main()
