import os
import json
import requests
from typing import Optional, Dict, Any, Generator
from dataclasses import dataclass
from dotenv import load_dotenv

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
        tenant: str = "main"
    ):
        """
        Initialize Kestra client.
        
        Args:
            host: Kestra server URL (default: from KESTRA_HOST env)
            username: Username for basic auth (default: from KESTRA_USERNAME env)
            password: Password for basic auth (default: from KESTRA_PASSWORD env)
            tenant: Tenant ID (default: "default")
        """
        if not KESTRAPY_AVAILABLE:
            raise ImportError("kestrapy is required. Install with: pip install kestrapy")
        
        self.host = host or os.getenv("KESTRA_HOST", "http://localhost:8080")
        self.tenant = tenant or os.getenv("KESTRA_TENANT", "main")

        config_params = {"host": self.host}
        config_params["username"] = username or os.getenv("KESTRA_USERNAME", "admin@kestra.io")
        config_params["password"] = password or os.getenv("KESTRA_PASSWORD", "admin")
        
        self.configuration = Configuration(**config_params)
        self.client = KestraClient(self.configuration)

    def deploy_flow(self, flow_yaml: str) -> Dict[str, Any]:
        """
        Deploy or update a flow from YAML.

        This method automatically injects required API keys from environment variables
        into the flow YAML before deployment.

        Args:
            flow_yaml: YAML string containing flow definition

        Returns:
            Flow metadata from Kestra
        """
        # Inject API keys from environment into the flow YAML
        flow_yaml = self._inject_api_keys(flow_yaml)

        try:
            # Try to create first
            result = self.client.flows.create_flow(
                tenant=self.tenant,
                body=flow_yaml
            )
            return {"status": "created", "flow": result}
        except Exception as e:
            error_str = str(e).lower()
            if "already exists" in error_str or "409" in error_str or "conflict" in error_str:
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

    def _inject_api_keys(self, flow_yaml: str) -> str:
        """
        Inject API keys from environment variables into flow YAML.

        Replaces:
        - {{ secret('ANTHROPIC_API_KEY') }} with actual Anthropic API key
        - Empty apiKey: "" with actual Anthropic API key
        - {{ secret('GOVDATA_API_KEY') }} with actual Gov Data API key

        Args:
            flow_yaml: Original flow YAML string

        Returns:
            Flow YAML with injected API keys
        """
        # Get API keys from environment
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        govdata_key = os.getenv("GOVDATA_API_KEY", "")

        if not anthropic_key:
            print("Warning: ANTHROPIC_API_KEY not set in environment")
        if not govdata_key:
            print("Warning: GOVDATA_API_KEY not set in environment")

        # Replace Anthropic API key patterns
        # Pattern 1: {{ secret('ANTHROPIC_API_KEY') }} with quotes
        flow_yaml = flow_yaml.replace(
            '"{{ secret(\'ANTHROPIC_API_KEY\') }}"',
            f'"{anthropic_key}"'
        )

        # Pattern 2: {{ secret('ANTHROPIC_API_KEY') }} without quotes
        flow_yaml = flow_yaml.replace(
            '{{ secret(\'ANTHROPIC_API_KEY\') }}',
            f'"{anthropic_key}"'
        )

        # Pattern 3: Empty apiKey: ""
        flow_yaml = flow_yaml.replace(
            'apiKey: ""',
            f'apiKey: "{anthropic_key}"'
        )

        # Replace Gov Data API key patterns
        flow_yaml = flow_yaml.replace(
            '"{{ secret(\'GOVDATA_API_KEY\') }}"',
            f'"{govdata_key}"'
        )
        flow_yaml = flow_yaml.replace(
            '{{ secret(\'GOVDATA_API_KEY\') }}',
            f'"{govdata_key}"'
        )

        return flow_yaml

    def deploy_all_flows(self, flows_directory: str = "./kestra/flows") -> Dict[str, Any]:
        """
        Deploy all flows from a directory.

        Args:
            flows_directory: Path to directory containing .yml and .yaml flow files

        Returns:
            Dictionary with deployment results
        """
        import glob

        results = {}
        # Support both .yml and .yaml extensions
        flow_files = glob.glob(f"{flows_directory}/*.yml") + glob.glob(f"{flows_directory}/*.yaml")

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

    def _create_execution_via_api(
        self,
        flow_id: str,
        inputs: Dict[str, Any],
        wait: bool = False
    ) -> ExecutionResult:
        """
        Create execution by calling Kestra HTTP API directly.

        Sends inputs as multipart/form-data as per Kestra API spec.

        Args:
            flow_id: Flow identifier
            inputs: Dictionary of input parameters
            wait: Whether to wait for execution completion

        Returns:
            ExecutionResult with execution details
        """
        # Build URL: /api/v1/{tenant}/executions/{namespace}/{flowId}
        url = f"{self.host}/api/v1/{self.tenant}/executions/{self.NAMESPACE}/{flow_id}"

        # Add wait parameter if needed
        params = {}
        if wait:
            params['wait'] = 'true'

        files = {}
        for key, value in inputs.items():
            files[key] = (None, str(value))

        username = os.getenv("KESTRA_USERNAME", "admin@kestra.io")
        password = os.getenv("KESTRA_PASSWORD", "admin")

        response = requests.post(
            url,
            files=files,
            params=params,
            auth=(username, password) if username and password else None,
            timeout=30
        )

        if not response.ok:
            error_msg = f"Kestra API error: {response.status_code} - {response.text}"
            raise Exception(error_msg)

        data = response.json()

        return ExecutionResult(
            execution_id=data.get('id', ''),
            state=data.get('state', {}).get('current', 'CREATED'),
            namespace=data.get('namespace', self.NAMESPACE),
            flow_id=data.get('flowId', flow_id),
            outputs=data.get('outputs')
        )

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

        return self._create_execution_via_api(
            flow_id=self.FLOW_MAIN_SALE,
            inputs=inputs,
            wait=wait
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

        return self._create_execution_via_api(
            flow_id=self.FLOW_CRISIS_SHIELD,
            inputs=inputs,
            wait=wait
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

        return self._create_execution_via_api(
            flow_id=self.FLOW_MARKET_MONITOR,
            inputs=inputs,
            wait=wait
        )
    
    def get_execution_status(self, execution_id: str) -> ExecutionResult:
        """
        Get current status of an execution using direct HTTP API.

        Args:
            execution_id: Kestra execution ID

        Returns:
            ExecutionResult with current state
        """
        import requests

        url = f"{self.host}/api/v1/{self.tenant}/executions/{execution_id}"

        username = os.getenv("KESTRA_USERNAME", "admin@kestra.io")
        password = os.getenv("KESTRA_PASSWORD", "admin")

        response = requests.get(
            url,
            auth=(username, password) if username and password else None,
            timeout=30
        )

        if not response.ok:
            error_msg = f"Kestra API error: {response.status_code} - {response.text}"
            raise Exception(error_msg)

        data = response.json()

        return ExecutionResult(
            execution_id=data.get('id', execution_id),
            state=data.get('state', {}).get('current', 'UNKNOWN'),
            namespace=data.get('namespace', self.NAMESPACE),
            flow_id=data.get('flowId', ''),
            outputs=data.get('outputs')
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
        Wait for an execution to complete using follow_execution (more efficient than polling).

        Args:
            execution_id: Kestra execution ID
            timeout_seconds: Maximum wait time
            poll_interval: Seconds between status checks (unused, kept for compatibility)

        Returns:
            Final ExecutionResult
        """
        import time
        import signal

        start_time = time.time()
        last_result = None

        def timeout_handler(signum, frame):
            raise TimeoutError(f"Execution {execution_id} did not complete within {timeout_seconds}s")

        if hasattr(signal, 'SIGALRM'):
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout_seconds)

        try:
            for event in self.follow_execution(execution_id):
                last_result = event

                if not event.is_running():
                    if hasattr(signal, 'SIGALRM'):
                        signal.alarm(0)  # Cancel timeout
                    return event

                if time.time() - start_time > timeout_seconds:
                    raise TimeoutError(f"Execution {execution_id} did not complete within {timeout_seconds}s")

        except Exception as e:
            if hasattr(signal, 'SIGALRM'):
                signal.alarm(0)  # Cancel timeout
            # If follow_execution fails, fall back to polling
            if "follow_execution" in str(e).lower():
                return self._wait_for_completion_polling(execution_id, timeout_seconds, poll_interval)
            raise

        if last_result:
            return last_result

        raise TimeoutError(f"Execution {execution_id} did not complete within {timeout_seconds}s")

    def _wait_for_completion_polling(
        self,
        execution_id: str,
        timeout_seconds: int = 300,
        poll_interval: int = 2
    ) -> ExecutionResult:
        """
        Fallback polling method for wait_for_completion.

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

def main():
    
    client = AgriLinkKestra()

if __name__ == "__main__":
    main()
