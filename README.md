# 🌾 Agri-Link: Crisis Shield for Farmers

> **AI Agents Assemble Hackathon 2025**

## 🎯 The Problem: The Harvest Paradox

In India and developing nations, **good harvests can cause financial ruin**:

- Market glut when all farmers harvest simultaneously → prices crash (₹20/kg to ₹2/kg in one day)
- Small farmers lack network/cold storage → forced distress sales below cost
- This leads to debt traps and farmer suicides

**Existing apps only show prices. They don't ACT on the farmer's behalf.**

## 💡 Our Solution: Autonomous Multi-Agent Crisis Prevention

Agri-Link is a **Digital Cooperative** powered by Kestra AI Agents that:

1. **🔍 Summarizes Real-Time Market Data** - Fetches live prices from Government of India's data.gov.in API
2. **🤖 Makes Autonomous Decisions** - AI agents decide: Normal Sale vs Crisis Diversion
3. **🛡️ Crisis Shield** - Automatically diverts produce to food processors when prices crash
4. **🤝 Negotiation Swarm** - 5 AI agents simultaneously negotiate with buyers using different strategies

## 🏆 Prize Track Alignment

### Wakanda Data Award ($4,000)
> "Best project using Kestra's built-in AI Agent to summarize data from other systems. Bonus credit for enabling the agent to make decisions based on the summarized data."

**Our Implementation:**
- ✅ Kestra AI Agents fetch & summarize data from data.gov.in (Government Mandi prices)
- ✅ Market Intelligence Agent analyzes price trends, volatility, and crash indicators
- ✅ **Decision-Making**: Crisis detection algorithm triggers autonomous mode switching
- ✅ Quality Assessment Agent grades crops from uploaded images
- ✅ Negotiation Swarm makes real-time buyer selection decisions

### Stormbreaker Deployment Award ($2,000)
> "Strongest Vercel deployment, showing a smooth, fast, and production-ready experience."

**Our Implementation:**
- ✅ Next.js 14 App Router with Server Components
- ✅ Mobile-first responsive design (farmers use smartphones)
- ✅ Hindi/English bilingual interface

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Frontend)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Landing  │  │ Dashboard│  │   Sell   │  │  Status Tracker  │ │
│  │  Page    │  │  /farmer │  │   Flow   │  │   (Real-time)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                              │                                   │      
│                           API Routes                             │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     KESTRA (AI Agent Orchestration)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Main Sale Workflow                       │ │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │ │
│  │  │ Quality │───▶│ Market  │───▶│  Mode   │───▶│Logistics│ │ │
│  │  │ Agent   │    │  Agent  │    │ Router  │    │  Agent  │ │ │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                  │
│              ┌────────────────┼────────────────┐                │
│              ▼                ▼                ▼                │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ Negotiation Swarm│ │Crisis Shield │ │  Summary Generator   ││
│  │  (5 Parallel AI) │ │  (Diversion) │ │  (Hindi/English)     ││
│  └──────────────────┘ └──────────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL DATA SOURCES                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ data.gov.in  │  │   Buyer      │  │  Food Processor        │ │
│  │ (Mandi API)  │  │  Registry    │  │     Registry           │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (for Kestra SDK)
- Kestra instance (Cloud or Docker)
- data.gov.in API key
- Google Gemini API key

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/agri-link.git
cd agri-link

# Install Node.js dependencies
npm install

# Install Python dependencies (for Kestra SDK)
cd scripts
pip install -r requirements.txt
cd ..
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# data.gov.in API
DATA_GOV_API_KEY=your_key_here

# Kestra (choose auth method)
KESTRA_API_URL=http://localhost:8080
KESTRA_API_TOKEN=your_token  # OR use username/password below
KESTRA_USERNAME=admin@kestra.io
KESTRA_PASSWORD=admin

# Google Gemini (for Kestra AI Agents)
GEMINI_API_KEY=your_gemini_key

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Deploy Kestra Flows (using Python SDK)

```bash
# Deploy all flows to Kestra
python scripts/deploy_flows.py

# Or deploy and run a demo
python scripts/deploy_flows.py --demo --follow
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
vercel deploy --prod
```

## 🐍 Python SDK Usage

The project includes a comprehensive Python client for Kestra operations:

```python
from scripts.kestra_client import AgriLinkKestra

# Initialize client
client = AgriLinkKestra()

# Start a sale workflow
result = client.start_sale(
    farmer_id="farmer_123",
    farmer_name="Ramesh Kumar",
    commodity="Tomato",
    quantity_kg=500,
    state="Maharashtra",
    district="Nashik"
)

print(f"Execution ID: {result.execution_id}")
print(f"State: {result.state}")

# Follow execution in real-time
for event in client.follow_execution(result.execution_id):
    print(f"State: {event.state}")
    if not event.is_running():
        break
```

### CLI Commands

```bash
# Deploy flows
python scripts/kestra_client.py deploy

# Start a sale
python scripts/kestra_client.py sale --farmer-id farmer_123 --commodity Tomato --quantity 500

# Check execution status
python scripts/kestra_client.py status <execution_id>

# Follow execution
python scripts/kestra_client.py follow <execution_id>

# Start market monitoring
python scripts/kestra_client.py monitor --commodities "Tomato,Potato,Onion"
```

### Optional: Python API Server

For more robust integration, you can run a separate Python API server:

```bash
# Install FastAPI
pip install fastapi uvicorn

# Run the server
python scripts/kestra_api.py

# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## 📁 Project Structure

```
agri-link/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── dashboard/
│   │   └── page.tsx              # Farmer dashboard
│   ├── sell/
│   │   └── page.tsx              # New sale flow
│   ├── status/
│   │   └── [executionId]/
│   │       └── page.tsx          # Real-time status
│   └── api/
│       ├── market/route.ts       # Market data proxy
│       ├── sell/route.ts         # Trigger Kestra workflow
│       ├── status/route.ts       # Execution status
│       └── webhook/route.ts      # Kestra callbacks
├── components/
│   ├── ui/                       # Shadcn components
│   ├── CropUpload.tsx
│   ├── MarketStatus.tsx
│   ├── NegotiationProgress.tsx
│   ├── CrisisAlert.tsx
│   └── LanguageToggle.tsx
├── lib/
│   ├── dataGovApi.ts             # data.gov.in wrapper
│   ├── kestraClient.ts           # Kestra API client
│   └── utils.ts
├── kestra/
│   └── flows/
│       ├── main-sale-workflow.yml
│       ├── market-intelligence.yml
│       ├── negotiation-swarm.yml
│       ├── crisis-shield.yml
│       └── logistics.yml
├── data/
│   ├── buyers.json               # Simulated buyer registry
│   ├── processors.json           # Food processor registry
│   └── costs.json                # Cost of production data
└── public/
    ├── icons/
    └── locales/
        ├── en.json
        └── hi.json
```

## 🎬 Demo Scenarios

### Scenario 1: Normal Market Sale
1. Ramesh uploads photo of 500kg tomatoes
2. Quality Agent grades: **Grade A** (1.2x price multiplier)
3. Market Agent fetches data.gov.in: ₹1,800/quintal (healthy)
4. Status: **NORMAL** → Negotiation Swarm activates
5. 5 AI agents negotiate with different buyers
6. Best offer: ₹2,100/quintal from FreshMart
7. Logistics arranged, Ramesh earns **₹10,500**

### Scenario 2: Crisis Mode Activation
1. Market crashes to ₹400/quintal (cost was ₹800)
2. Market Agent detects: **CRISIS** (price < 80% of cost)
3. Crisis Shield activates automatically
4. AI finds Kissan Foods processor accepting at ₹650/quintal
5. Produce diverted, Ramesh loses 19% instead of 50%
6. **Debt trap prevented**

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Deployment | Vercel (Edge Functions) |
| Orchestration | Kestra (AI Agents) |
| AI Provider | Google Gemini 2.0 Flash |
| Data Source | data.gov.in (Government API) |
| Language | TypeScript |

## 📊 Kestra AI Agent Workflows

### 1. Market Intelligence Agent
- Fetches real-time Mandi prices from data.gov.in
- Calculates 7-day and 30-day moving averages
- Detects price crash patterns
- **Decision Output**: NORMAL / WARNING / CRISIS

### 2. Quality Assessment Agent
- Analyzes crop photo using Gemini Vision
- Grades: A (premium), B (standard), C (processing grade)
- Calculates price multiplier (0.6x - 1.2x)

### 3. Negotiation Swarm (5 Agents)
- **Anchor High**: Starts 30% above market
- **Volume Play**: Offers bulk discounts
- **Urgency Creator**: Limited time pressure
- **Relationship Builder**: Long-term partnership
- **Quality Premium**: Emphasizes Grade A value

### 4. Crisis Shield Router
- Priority routing: Processors → MSP → Cold Storage → NGO
- Calculates loss minimization paths
- Executes autonomous diversion

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market` | GET | Fetch market analysis |
| `/api/sell` | POST | Start sale workflow |
| `/api/status/[id]` | GET | Execution status |
| `/api/webhook` | POST | Kestra callbacks |

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATA_GOV_API_KEY` | Government data portal API key |
| `KESTRA_API_URL` | Kestra instance URL |
| `KESTRA_API_TOKEN` | Kestra authentication token |
| `GEMINI_API_KEY` | Google AI API key |
| `NEXT_PUBLIC_APP_URL` | Deployed app URL |

## 👥 Team

- **Your Name** - Full Stack Developer

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- [Kestra](https://kestra.io) for workflow orchestration
- [Vercel](https://vercel.com) for deployment platform
- [data.gov.in](https://data.gov.in) for open government data
- Ministry of Agriculture, Government of India
