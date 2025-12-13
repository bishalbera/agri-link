#!/usr/bin/env python3
"""
Agri-Link Flow Deployment Script
================================
Deploy all Kestra flows and run a demo execution.

Usage:
    python deploy_flows.py                  # Deploy all flows
    python deploy_flows.py --demo           # Deploy and run demo
    python deploy_flows.py --demo --follow  # Deploy, run demo, and follow execution
"""

import os
import sys
import argparse
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from kestra_client import AgriLinkKestra, ExecutionResult


def print_banner():
    """Print Agri-Link banner"""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🌾 AGRI-LINK: Crisis Shield for Farmers                ║
    ║   ─────────────────────────────────────────────────       ║
    ║   Kestra Flow Deployment & Demo                           ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """)


def deploy_flows(client: AgriLinkKestra, flows_dir: str):
    """Deploy all flows to Kestra"""
    print("\n📦 Deploying flows to Kestra...")
    print(f"   Directory: {flows_dir}")
    print(f"   Host: {client.host}")
    print(f"   Namespace: {client.NAMESPACE}")
    print()
    
    results = client.deploy_all_flows(flows_dir)
    
    success_count = 0
    for flow_name, result in results.items():
        if result.get("success"):
            status_icon = "✅"
            status_text = result.get("status", "deployed")
            success_count += 1
        else:
            status_icon = "❌"
            status_text = result.get("error", "failed")
        
        print(f"   {status_icon} {flow_name}: {status_text}")
    
    print()
    print(f"   Deployed: {success_count}/{len(results)} flows")
    return success_count == len(results)


def run_demo_sale(client: AgriLinkKestra, follow: bool = False):
    """Run a demonstration sale workflow"""
    print("\n🚀 Running Demo Sale...")
    print("   Scenario: Ramesh Kumar selling 500kg of Tomatoes from Nashik, Maharashtra")
    print()
    
    # Start the sale workflow
    result = client.start_sale(
        farmer_id="demo_farmer_001",
        farmer_name="Ramesh Kumar",
        farmer_phone="+919876543210",
        commodity="Tomato",
        quantity_kg=500,
        state="Maharashtra",
        district="Nashik",
        cost_of_production=800,  # ₹8/kg = ₹800/quintal
        wait=not follow  # If following, don't wait
    )
    
    print(f"   Execution ID: {result.execution_id}")
    print(f"   Initial State: {result.state}")
    print()
    
    if follow:
        print("   📡 Following execution in real-time...")
        print("   ─────────────────────────────────────")
        
        try:
            for event in client.follow_execution(result.execution_id):
                state_icon = {
                    "CREATED": "🔵",
                    "RUNNING": "🟡",
                    "SUCCESS": "🟢",
                    "FAILED": "🔴",
                    "WARNING": "🟠",
                }.get(event.state, "⚪")
                
                print(f"   {state_icon} State: {event.state}")
                
                if not event.is_running():
                    break
        except KeyboardInterrupt:
            print("\n   ⏹️ Stopped following (execution continues in background)")
        
        # Get final status
        final = client.get_execution_status(result.execution_id)
        result = final
    
    print()
    print("   📊 Final Result:")
    print(f"      State: {result.state}")
    
    if result.outputs:
        print("      Outputs:")
        import json
        for key, value in result.outputs.items():
            # Truncate long values
            value_str = str(value)
            if len(value_str) > 100:
                value_str = value_str[:100] + "..."
            print(f"         {key}: {value_str}")
    
    return result


def run_crisis_demo(client: AgriLinkKestra):
    """Run a demonstration of Crisis Shield activation"""
    print("\n🛡️ Running Crisis Shield Demo...")
    print("   Scenario: Market crash detected, activating emergency diversion")
    print()
    
    result = client.start_crisis_shield(
        farmer_id="demo_farmer_002",
        commodity="Tomato",
        quantity_kg=1000,
        state="Maharashtra",
        district="Nashik",
        quality_grade='{"grade": "B", "freshness_score": 7}',
        wait=True
    )
    
    print(f"   Execution ID: {result.execution_id}")
    print(f"   Final State: {result.state}")
    
    if result.is_success():
        print("   ✅ Crisis Shield successfully diverted produce!")
    else:
        print("   ⚠️ Crisis Shield completed with issues")
    
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Deploy Agri-Link flows to Kestra and run demos"
    )
    parser.add_argument(
        "--flows-dir", "-d",
        default="./kestra/flows",
        help="Directory containing flow YAML files"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run a demo sale after deployment"
    )
    parser.add_argument(
        "--crisis-demo",
        action="store_true",
        help="Run a Crisis Shield demo"
    )
    parser.add_argument(
        "--follow", "-f",
        action="store_true",
        help="Follow execution in real-time"
    )
    parser.add_argument(
        "--skip-deploy",
        action="store_true",
        help="Skip flow deployment"
    )
    
    args = parser.parse_args()
    
    print_banner()
    
    # Check environment
    print("🔧 Configuration:")
    print(f"   KESTRA_HOST: {os.getenv('KESTRA_HOST', 'http://localhost:8080')}")
    print(f"   KESTRA_TENANT: {os.getenv('KESTRA_TENANT', 'default')}")
    
    try:
        client = AgriLinkKestra()
        print("   ✅ Kestra client initialized")
    except ImportError as e:
        print(f"   ❌ Error: {e}")
        print("\n   Install dependencies with: pip install -r scripts/requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"   ❌ Error connecting to Kestra: {e}")
        sys.exit(1)
    
    # Deploy flows
    if not args.skip_deploy:
        # Find flows directory
        flows_dir = args.flows_dir
        if not os.path.exists(flows_dir):
            # Try relative to script location
            script_dir = Path(__file__).parent.parent
            flows_dir = script_dir / "kestra" / "flows"
        
        if os.path.exists(flows_dir):
            deploy_flows(client, str(flows_dir))
        else:
            print(f"\n⚠️ Flows directory not found: {flows_dir}")
            print("   Skipping deployment...")
    
    # Run demos if requested
    if args.demo:
        run_demo_sale(client, follow=args.follow)
    
    if args.crisis_demo:
        run_crisis_demo(client)
    
    print("\n✨ Done!")
    print("   View executions at: {}/ui/executions".format(client.host))


if __name__ == "__main__":
    main()
