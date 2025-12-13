#!/usr/bin/env python3
"""
Agri-Link Kestra Client
=======================
Python SDK client for interacting with Kestra workflows programmatically.

Install dependencies:
    pip install kestrapy python-dotenv

Usage:
    from kestra_client import AgriLinkKestra
    
    client = AgriLinkKestra()
    execution = client.start_sale(
        farmer_id="farmer_123",
        commodity="Tomato",
        quantity_kg=500,
        state="Maharashtra"
    )
"""

import os
import json
from typing import Optional, Dict, Any, Generator
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from kestrapy import Configuration, KestraClient
    KESTRAPY_AVAILABLE = True
except ImportError:
    KESTRAPY_AVAILABLE = False
    print("Warning: kestrapy not installed. Install with: pip install kestrapy")


@dataclass
class ExecutionResult:
    """Result of a Kestra workflow execution"""
    execution_id: str
    state: str
    namespace: str
    flow_id: str
    outputs: Optional[Dict[str, Any]] = None
    
    def is_success(self) -> bool:
        return self.state == "SUCCESS"
    
    def is_running(self) -> bool:
        return self.state in ["CREATED", "RUNNING"]
    
    def is_failed(self) -> bool:
        return self.state in ["FAILED", "KILLED"]


class AgriLinkKestra:
    """
    Kestra client for Agri-Link workflows.
    
    Handles all interactions with Kestra including:
    - Flow deployment
    - Execution triggering
    - Real-time execution following
    - Result retrieval
    """
    
    # Default namespace for all Agri-Link flows
    NAMESPACE = "agrilink"
    
    # Flow IDs
    FLOW_MAIN_SALE = "main-sale-workflow"
    FLOW_NEGOTIATION = "negotiation-swarm"
    FLOW_CRISIS_SHIELD = "crisis-shield"
    FLOW_MARKET_MONITOR = "market-monitor"
    
    def __init__(
        self,
        host: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        api_token: Optional[str] = None,
        tenant: str = "default"
    ):
        """
        Initialize Kestra client.
        
        Args:
            host: Kestra server URL (default: from KESTRA_HOST env)
            username: Username for basic auth (default: from KESTRA_USERNAME env)
            password: Password for basic auth (default: from KESTRA_PASSWORD env)
            api_token: API token for token auth (default: from KESTRA_API_TOKEN env)
            tenant: Tenant ID (default: "default")
        """
        if not KESTRAPY_AVAILABLE:
            raise ImportError("kestrapy is required. Install with: pip install kestrapy")
        
        self.host = host or os.getenv("KESTRA_HOST", "http://localhost:8080")
        self.tenant = tenant or os.getenv("KESTRA_TENANT", "default")
        
        # Configure authentication
        config_params = {"host": self.host}
        
        # Prefer API token if available
        api_token = api_token or os.getenv("KESTRA_API_TOKEN")
        if api_token:
            config_params["api_token"] = api_token
        else:
            # Fall back to basic auth
            config_params["username"] = username or os.getenv("KESTRA_USERNAME", "admin@kestra.io")
            config_params["password"] = password or os.getenv("KESTRA_PASSWORD", "admin")
        
        self.configuration = Configuration(**config_params)
        self.client = KestraClient(self.configuration)
        
    def deploy_flow(self, flow_yaml: str) -> Dict[str, Any]:
        """
        Deploy or update a flow from YAML.
        
        Args:
            flow_yaml: YAML string containing flow definition
            
        Returns:
            Flow metadata from Kestra
        """
        try:
            # Try to create first
            result = self.client.flows.create_flow(
                tenant=self.tenant,
                body=flow_yaml
            )
            return {"status": "created", "flow": result}
        except Exception as e:
            if "already exists" in str(e).lower() or "409" in str(e):
                # Flow exists, update it
                # Extract flow ID and namespace from YAML
                import yaml
                flow_dict = yaml.safe_load(flow_yaml)
                result = self.client.flows.update_flow(
                    id=flow_dict["id"],
                    namespace=flow_dict.get("namespace", self.NAMESPACE),
                    tenant=self.tenant,
                    body=flow_yaml
                )
                return {"status": "updated", "flow": result}
            raise
    
    def deploy_all_flows(self, flows_directory: str = "./kestra/flows") -> Dict[str, Any]:
        """
        Deploy all flows from a directory.
        
        Args:
            flows_directory: Path to directory containing .yml flow files
            
        Returns:
            Dictionary with deployment results
        """
        import glob
        
        results = {}
        flow_files = glob.glob(f"{flows_directory}/*.yml")
        
        for flow_file in flow_files:
            flow_name = os.path.basename(flow_file)
            try:
                with open(flow_file, 'r') as f:
                    flow_yaml = f.read()
                result = self.deploy_flow(flow_yaml)
                results[flow_name] = {"success": True, **result}
            except Exception as e:
                results[flow_name] = {"success": False, "error": str(e)}
        
        return results
    
    def start_sale(
        self,
        farmer_id: str,
        farmer_name: str = "Farmer",
        farmer_phone: str = "+919999999999",
        commodity: str = "Tomato",
        quantity_kg: int = 100,
        state: str = "Maharashtra",
        district: str = "Nashik",
        crop_image_url: str = "",
        cost_of_production: int = 800,
        wait: bool = False
    ) -> ExecutionResult:
        """
        Start a new sale workflow.
        
        This triggers the main-sale-workflow which:
        1. Assesses crop quality
        2. Fetches market data from data.gov.in
        3. AI decides: Normal negotiation or Crisis Shield
        4. Executes appropriate sub-workflow
        
        Args:
            farmer_id: Unique farmer identifier
            farmer_name: Farmer's name
            farmer_phone: Contact phone number
            commodity: Crop type (e.g., "Tomato", "Potato")
            quantity_kg: Quantity in kilograms
            state: Indian state name
            district: District name
            crop_image_url: URL of crop photo for quality assessment
            cost_of_production: Cost per quintal in rupees
            wait: If True, wait for execution to complete
            
        Returns:
            ExecutionResult with execution details
        """
        inputs = {
            "farmer_id": farmer_id,
            "farmer_name": farmer_name,
            "farmer_phone": farmer_phone,
            "commodity": commodity,
            "quantity_kg": quantity_kg,
            "state": state,
            "district": district,
            "crop_image_url": crop_image_url,
            "cost_of_production": cost_of_production,
        }
        
        execution = self.client.executions.create_execution(
            id=self.FLOW_MAIN_SALE,
            namespace=self.NAMESPACE,
            tenant=self.tenant,
            inputs=inputs
        )
        
        return ExecutionResult(
            execution_id=execution.id,
            state=execution.state.current if hasattr(execution, 'state') else "CREATED",
            namespace=self.NAMESPACE,
            flow_id=self.FLOW_MAIN_SALE,
            outputs=execution.outputs if hasattr(execution, 'outputs') else None
        )
    
    def start_crisis_shield(
        self,
        farmer_id: str,
        commodity: str,
        quantity_kg: int,
        state: str,
        district: str,
        quality_grade: str = '{"grade": "B"}',
        wait: bool = False
    ) -> ExecutionResult:
        """
        Directly activate Crisis Shield workflow.
        
        Use this when market prices have crashed and immediate
        diversion is needed.
        
        Args:
            farmer_id: Unique farmer identifier
            commodity: Crop type
            quantity_kg: Quantity in kilograms
            state: Indian state name
            district: District name
            quality_grade: JSON string with quality assessment
            wait: If True, wait for execution to complete
            
        Returns:
            ExecutionResult with execution details
        """
        inputs = {
            "farmer_id": farmer_id,
            "commodity": commodity,
            "quantity_kg": quantity_kg,
            "state": state,
            "district": district,
            "quality_grade": quality_grade,
        }
        
        execution = self.client.executions.create_execution(
            id=self.FLOW_CRISIS_SHIELD,
            namespace=self.NAMESPACE,
            tenant=self.tenant,
            inputs=inputs
        )
        
        return ExecutionResult(
            execution_id=execution.id,
            state=execution.state.current if hasattr(execution, 'state') else "CREATED",
            namespace=self.NAMESPACE,
            flow_id=self.FLOW_CRISIS_SHIELD,
            outputs=execution.outputs if hasattr(execution, 'outputs') else None
        )
    
    def start_market_monitor(
        self,
        commodities: str = "Tomato,Potato,Onion",
        state: str = "Maharashtra",
        wait: bool = False
    ) -> ExecutionResult:
        """
        Start market monitoring workflow.
        
        Args:
            commodities: Comma-separated list of commodities
            state: State to monitor
            wait: If True, wait for execution to complete
            
        Returns:
            ExecutionResult with execution details
        """
        inputs = {
            "commodities": commodities,
            "state": state,
        }
        
        execution = self.client.executions.create_execution(
            id=self.FLOW_MARKET_MONITOR,
            namespace=self.NAMESPACE,
            tenant=self.tenant,
            inputs=inputs
        )
        
        return ExecutionResult(
            execution_id=execution.id,
            state=execution.state.current if hasattr(execution, 'state') else "CREATED",
            namespace=self.NAMESPACE,
            flow_id=self.FLOW_MARKET_MONITOR,
            outputs=execution.outputs if hasattr(execution, 'outputs') else None
        )
    
    def get_execution_status(self, execution_id: str) -> ExecutionResult:
        """
        Get current status of an execution.
        
        Args:
            execution_id: Kestra execution ID
            
        Returns:
            ExecutionResult with current state
        """
        execution = self.client.executions.get_execution(
            tenant=self.tenant,
            execution_id=execution_id
        )
        
        return ExecutionResult(
            execution_id=execution.id,
            state=execution.state.current,
            namespace=execution.namespace,
            flow_id=execution.flow_id,
            outputs=execution.outputs if hasattr(execution, 'outputs') else None
        )
    
    def follow_execution(self, execution_id: str) -> Generator[ExecutionResult, None, None]:
        """
        Stream execution updates in real-time.
        
        Args:
            execution_id: Kestra execution ID
            
        Yields:
            ExecutionResult for each state change
        """
        for event in self.client.executions.follow_execution(
            execution_id=execution_id,
            tenant=self.tenant
        ):
            # Skip empty keepalive events
            if event and hasattr(event, 'state'):
                yield ExecutionResult(
                    execution_id=execution_id,
                    state=event.state.current,
                    namespace=event.namespace if hasattr(event, 'namespace') else self.NAMESPACE,
                    flow_id=event.flow_id if hasattr(event, 'flow_id') else "",
                    outputs=event.outputs if hasattr(event, 'outputs') else None
                )
    
    def wait_for_completion(
        self,
        execution_id: str,
        timeout_seconds: int = 300,
        poll_interval: int = 2
    ) -> ExecutionResult:
        """
        Wait for an execution to complete.
        
        Args:
            execution_id: Kestra execution ID
            timeout_seconds: Maximum wait time
            poll_interval: Seconds between status checks
            
        Returns:
            Final ExecutionResult
        """
        import time
        
        start_time = time.time()
        while time.time() - start_time < timeout_seconds:
            result = self.get_execution_status(execution_id)
            
            if not result.is_running():
                return result
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Execution {execution_id} did not complete within {timeout_seconds}s")


# ============================================================================
# CLI Interface
# ============================================================================

def main():
    """Command-line interface for Agri-Link Kestra operations."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Agri-Link Kestra Client")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Deploy flows to Kestra")
    deploy_parser.add_argument("--directory", "-d", default="./kestra/flows",
                               help="Directory containing flow YAML files")
    
    # Start sale command
    sale_parser = subparsers.add_parser("sale", help="Start a new sale")
    sale_parser.add_argument("--farmer-id", required=True, help="Farmer ID")
    sale_parser.add_argument("--commodity", default="Tomato", help="Crop type")
    sale_parser.add_argument("--quantity", type=int, default=100, help="Quantity in kg")
    sale_parser.add_argument("--state", default="Maharashtra", help="State name")
    sale_parser.add_argument("--wait", action="store_true", help="Wait for completion")
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Get execution status")
    status_parser.add_argument("execution_id", help="Execution ID")
    
    # Follow command
    follow_parser = subparsers.add_parser("follow", help="Follow execution in real-time")
    follow_parser.add_argument("execution_id", help="Execution ID")
    
    # Monitor command
    monitor_parser = subparsers.add_parser("monitor", help="Start market monitor")
    monitor_parser.add_argument("--commodities", default="Tomato,Potato,Onion",
                                help="Commodities to monitor")
    monitor_parser.add_argument("--state", default="Maharashtra", help="State to monitor")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize client
    client = AgriLinkKestra()
    
    if args.command == "deploy":
        print(f"Deploying flows from {args.directory}...")
        results = client.deploy_all_flows(args.directory)
        for flow_name, result in results.items():
            status = "✅" if result.get("success") else "❌"
            print(f"  {status} {flow_name}: {result.get('status', result.get('error'))}")
    
    elif args.command == "sale":
        print(f"Starting sale for farmer {args.farmer_id}...")
        result = client.start_sale(
            farmer_id=args.farmer_id,
            commodity=args.commodity,
            quantity_kg=args.quantity,
            state=args.state,
            wait=args.wait
        )
        print(f"Execution ID: {result.execution_id}")
        print(f"State: {result.state}")
        if result.outputs:
            print(f"Outputs: {json.dumps(result.outputs, indent=2)}")
    
    elif args.command == "status":
        result = client.get_execution_status(args.execution_id)
        print(f"Execution: {result.execution_id}")
        print(f"State: {result.state}")
        print(f"Flow: {result.namespace}/{result.flow_id}")
        if result.outputs:
            print(f"Outputs: {json.dumps(result.outputs, indent=2)}")
    
    elif args.command == "follow":
        print(f"Following execution {args.execution_id}...")
        for event in client.follow_execution(args.execution_id):
            print(f"  State: {event.state}")
            if not event.is_running():
                break
        print("Execution completed.")
    
    elif args.command == "monitor":
        print(f"Starting market monitor for {args.commodities} in {args.state}...")
        result = client.start_market_monitor(
            commodities=args.commodities,
            state=args.state
        )
        print(f"Execution ID: {result.execution_id}")


if __name__ == "__main__":
    main()
