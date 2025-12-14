# 🌾 Agri-Link: AI-Powered Crisis Shield for Farmers

> **Autonomous AI agents that prevent farmer debt traps by detecting market crashes and diverting produce to emergency outlets**

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


**Our Implementation:**
- ✅ **Market Intelligence Agent** fetches & summarizes data from data.gov.in (Government Mandi prices)
- ✅ **Autonomous Decision-Making**: Crisis detection algorithm (price < 80% of cost OR 30% drop in 7 days)
- ✅ **Quality Assessment Agent** grades crops and calculates price multipliers
- ✅ **Crisis Router Agent** selects optimal emergency outlet (processors, MSP, cold storage)
- ✅ **Negotiation Swarm** makes real-time buyer selection decisions
- ✅ All decisions stored in PostgreSQL for analytics


## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Landing  │  │ Dashboard│  │   Sell   │  │  Status Tracker  │ │
│  │  Page    │  │ (Real DB)│  │   Flow   │  │   (Real-time)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND (Python)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Kestra API  │  │ Postgres DB  │  │   Market Data API      │ │
│  │    Client    │  │   Connector  │  │   (data.gov.in)        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              KESTRA + POSTGRES (Docker Compose)                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Main Sale Workflow (Claude AI)                 │ │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │ │
│  │  │ Quality │───▶│ Market  │───▶│  Crisis │───▶│ Summary │ │ │
│  │  │ Agent   │    │  Intel  │    │ Router  │    │ Agent   │ │ │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                  │
│              ┌────────────────┼────────────────┐                │
│              ▼                                 ▼                │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │ Negotiation      │              │    Crisis Shield         │ │
│  │ Swarm (5 AI)     │              │    (Emergency Diversion) │ │
│  └──────────────────┘              └──────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             PostgreSQL Database                           │  │
│  │  - Execution History  - Workflow States  - Outputs        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+
- Anthropic API Key (Claude)
- data.gov.in API key 

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/agri-link.git
cd agri-link
```

### 2. Make the `start-dev` file executable

```bash
chmod +x start-dev.sh
```

### 3. Run the script

```bash
./start-dev.sh
```

### 5. Test the Application

**Normal Sale Flow:**
1. Visit: `http://localhost:3000/sell`
2. Upload crop photo
3. Fill in details (Tomato, 100kg, Kerala, Kollam)
4. AI negotiates with buyers
5. Track status in real-time

**Crisis Shield Demo:**
1. Visit: `http://localhost:3000/sell?demo=crisis`
2. Fill in details
3. AI detects "crisis" and activates emergency diversion
4. See crisis shield results on status page

**View Dashboard:**
1. Visit: `http://localhost:3000/dashboard`
2. See real execution history from PostgreSQL
3. View crisis shield vs normal sales

## 📁 Project Structure

```
agri-link/
├── backend/                      # FastAPI Backend
│   ├── kestra_api.py             # Main FastAPI server
│   ├── kestra_client.py          # Kestra SDK client
│   ├── database.py               # PostgreSQL connector
│   └── requirements.txt
│
├── web/                          # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Farmer dashboard (real DB data)
│   │   ├── sell/
│   │   │   └── page.tsx          # New sale flow
│   │   ├── status/[executionId]/
│   │   │   └── page.tsx          # Real-time execution status
│   │   └── api/
│   │       ├── market/route.ts   # Market data proxy
│   │       ├── sell/route.ts     # Trigger workflow
│   │       ├── status/route.ts   # Execution status
│   │       └── webhook/route.ts  # Buyer/processor registry
│   └── lib/
│       ├── dataGovApi.ts         # data.gov.in API client
│       └── kestraClient.ts       # Frontend Kestra client
│
├── kestra/
│   └── flows/                    # Kestra Workflow Definitions
│       ├── main-sale-workflow.yaml      # Main orchestration
│       ├── negotiation-swarm.yaml       # 5 AI negotiators
│       ├── crisis-shield.yml            # Emergency diversion
│       └── market-monitor.yml           # Price monitoring
│
├── docker-compose.yml            # Kestra + PostgreSQL
└── README.md
```


## 🤖 AI Agent Workflows

### 1. Quality Assessment Agent (Claude)
```yaml
Input: Crop image, commodity, location
AI Task: Grade crop quality (A/B/C)
Output:
  - grade: "A"
  - freshness_score: 8
  - price_multiplier: 1.15
  - defects: []
```

### 2. Market Intelligence Agent (Claude)
```yaml
Input: Market data from data.gov.in, cost of production
AI Task: Analyze price trends and detect crisis
Decision Logic:
  - CRISIS: price < 80% of cost OR 30% drop in 7 days
  - NEGOTIATE: Normal market conditions
Output:
  - decision: "CRISIS_SHIELD" or "NEGOTIATE"
  - recommended_min_price: 50.0
  - confidence: 0.85
```

### 3. Crisis Router Agent (Claude)
```yaml
Input: Available processors, MSP centers, cold storage
AI Task: Select optimal emergency outlet
Priority: Processors → MSP → Cold Storage → NGO
Output:
  - selected_outlet: "Fresh2Go Processing"
  - outlet_type: "processor"
  - price_per_kg: 50
  - savings_vs_market: 800
  - loss_reduction_percent: 65
```

### 4. Negotiation Swarm (5 Parallel Claude Agents)
```yaml
Agents:
  1. Anchor High: Starts 30% above market
  2. Volume Player: Bulk discount strategy
  3. Urgency Creator: Time pressure tactics
  4. Relationship Builder: Long-term partnership
  5. Quality Premium: Emphasizes Grade A value

Output:
  - best_offer:
      buyer_name: "Premium Buyer Co"
      final_price_per_kg: 45
      total_amount: 4500
```

## 🌐 API Endpoints

### FastAPI Backend (`http://localhost:8000`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check & Kestra connection status |
| `/api/sale` | POST | Start main sale workflow |
| `/api/crisis` | POST | Directly activate crisis shield |
| `/api/monitor` | POST | Start market monitoring |
| `/api/execution/{id}` | GET | Get execution status |
| `/api/executions` | GET | List all executions from PostgreSQL |

### Next.js Frontend (`http://localhost:3000`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market` | GET | Fetch market analysis |
| `/api/sell` | POST | Trigger sale via FastAPI |
| `/api/status` | GET | Execution status |
| `/api/webhook` | GET | Buyer/processor registry |

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js  TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.13 |
| Orchestration | Kestra (Open Source) |
| AI Provider | Anthropic Claude Sonnet 4.5 |
| Database | PostgreSQL |
| Data Source | data.gov.in (Government API) |

## 🔧 Key Features

### Real Database Integration ✅
- Dashboard fetches real execution history from PostgreSQL
- No dummy data - all transactions are actual Kestra executions
- Crisis shield sales marked with 🛡️ badge

### Crisis Detection Logic
```python
# Implemented in Market Intelligence Agent
cost_per_kg = cost_per_quintal / 100
threshold = cost_per_kg * 0.8

if market_price < threshold:
    decision = "CRISIS_SHIELD"
elif price_drop_7d > 30%:
    decision = "CRISIS_SHIELD"
else:
    decision = "NEGOTIATE"
```

### Status Page Features
- Real-time execution tracking
- Different UI for crisis vs normal sales
- Shows outlet details for crisis shield
- Displays savings and loss reduction percentage

## 🔒 Environment Variables

### Backend (.env)
```bash
ANTHROPIC_API_KEY=xxx              # Required
GOVDATA_API_KEY=xxx                       
KESTRA_HOST=http://localhost:8080         # Kestra instance
KESTRA_USERNAME=admin@kestra.io
KESTRA_PASSWORD=admin
KESTRA_TENANT=main
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

## 🐳 Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f kestra
docker compose logs -f postgres

# Stop services
docker compose down

# Reset database (clean slate)
docker compose down -v
docker compose up -d

# Access Postgres directly
docker exec -it agri-link-postgres-1 psql -U kestra -d kestra

# Check executions in DB
docker exec agri-link-postgres-1 psql -U kestra -d kestra -c \
  "SELECT id, flow_id, state_current FROM executions WHERE namespace='agrilink' ORDER BY start_date DESC LIMIT 5;"
```

## 📊 PostgreSQL Database Schema

The Kestra executions table stores all workflow data:

```sql
-- Main executions table (auto-created by Kestra)
executions
  - id (execution ID)
  - namespace (agrilink)
  - flow_id (main-sale-workflow, crisis-shield, etc)
  - state_current (SUCCESS, FAILED, RUNNING)
  - start_date, end_date
  - value (JSONB with inputs/outputs)

-- Our app queries this for dashboard data
```


## 📄 License

MIT License - see [LICENSE](LICENSE)

---

Built with ❤️ for Indian farmers using Kestra AI Agents
