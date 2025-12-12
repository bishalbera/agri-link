# Agri-Link: The "Crisis Shield" for Farmers

**🏆 Built for AssembleHack25 - Wakanda Data Award ($4k Prize)**

## Tagline
Autonomous AI Agents for Farmer Negotiation & Distress Prevention

## The Problem: The Harvest Paradox

In India, a "good harvest" often leads to financial ruin:
- **Market Glut**: All farmers harvest simultaneously → prices crash (₹20/kg → ₹2/kg)
- **No Network**: Small farmers lack connections to alternative buyers
- **Forced Sales**: Selling below cost of production → debt trap → farmer distress

**The Gap**: Existing apps just show prices. They don't ACT on behalf of farmers.

## The Solution: Autonomous Multi-Agent System

Agri-Link uses **Kestra-orchestrated AI agents** that:

### 1. Market Intelligence Agent
- Monitors Government of India Agricultural APIs in real-time
- Summarizes price trends across multiple mandis (markets)
- Calculates cost of production vs market price

### 2. Crisis Detection Agent (The "Crisis Shield")
- **Decision Point**: If market price < cost of production → ACTIVATE SHIELD
- Automatically stops distress sales
- Triggers alternative buyer search (food processors, cold storage)

### 3. Smart Negotiation Agent
- Simultaneously negotiates with 5-10 wholesale buyers
- Uses Claude AI for intelligent haggling
- Finds best price when market fails

### 4. Logistics Coordinator
- Orchestrates pickup after deal closure
- Generates professional invoices

## Tech Stack

- **Kestra** - AI agent orchestration & workflow automation
- **Anthropic Claude API** - Agent intelligence & decision-making
- **Next.js 15 + React 19 + TypeScript** - Frontend demo
- **Government of India Agricultural APIs** - Real market data
- **Vercel** - Deployment

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    KESTRA ORCHESTRATOR                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌──────────────┐               │
│  │  Market Data │─────▶│Crisis Detect │               │
│  │    Agent     │      │    Agent     │               │
│  └──────────────┘      └──────┬───────┘               │
│                               │                        │
│                          [Crisis?]                     │
│                        /           \                   │
│                   YES /             \ NO               │
│                      ▼               ▼                 │
│           ┌─────────────────┐  ┌──────────┐          │
│           │  Negotiation    │  │ Standard │          │
│           │  Agent (Multi)  │  │  Sale    │          │
│           └────────┬────────┘  └──────────┘          │
│                    │                                   │
│                    ▼                                   │
│           ┌─────────────────┐                         │
│           │   Logistics     │                         │
│           │  Coordinator    │                         │
│           └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY

# Start Kestra
npm run kestra:up

# Run frontend
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Kestra UI: http://localhost:8080

## Demo Scenario

**Farmer: Ram Singh (Punjab)**
- Crop: 5 tons of tomatoes
- Cost of production: ₹15/kg
- Local mandi price: **₹8/kg** ❌ (CRISIS!)

**Agri-Link Response:**
1. Market Agent detects price crash
2. Crisis Agent activates shield → blocks distress sale
3. Negotiation Agent finds:
   - Food processor willing to pay ₹12/kg for pulp
   - Restaurant chain willing to pay ₹14/kg for 2 tons
4. Logistics Agent arranges pickup
5. **Result**: Farmer saves ₹30,000 from bankruptcy

## Hackathon Highlights

### Why This Wins Wakanda Data Award:
- ✅ **Data Summarization**: Real-time agricultural market data → actionable insights
- ✅ **Decision-Making**: Autonomous crisis detection & response
- ✅ **Kestra Integration**: Full multi-agent workflow orchestration
- ✅ **Real Impact**: Addresses farmer suicide crisis (social good)

### Judging Criteria Alignment:
- **Potential Impact**: Addresses ₹1.5 trillion agricultural distress problem in India
- **Creativity**: First autonomous "crisis shield" for farmers
- **Technical Implementation**: Multi-agent system with real APIs
- **Aesthetics**: Clean, farmer-friendly UI

## License
MIT
