#!/bin/bash


set -e

echo "🌾 Agri-Link Development Environment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running (for Kestra)
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if Kestra is running
if ! docker compose ps | grep -q "kestra.*Up"; then
    echo -e "${BLUE}🚀 Starting Kestra...${NC}"
    docker compose up -d
    echo "⏳ Waiting for Kestra to be ready..."
    sleep 10
fi

echo -e "${GREEN}✅ Kestra is running${NC}"

# Check Python backend dependencies
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}📦 Creating Python virtual environment...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo -e "${GREEN}✅ Python virtual environment exists${NC}"
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}⚠️  backend/.env not found${NC}"
    echo "Please create it with KESTRA_HOST, KESTRA_USERNAME, KESTRA_PASSWORD"
    exit 1
fi

if [ ! -f "web/.env.local" ]; then
    echo -e "${BLUE}📝 Creating web/.env.local from example...${NC}"
    cp web/.env.local.example web/.env.local
    echo -e "${RED}⚠️  Please edit web/.env.local and add GOVDATA_API_KEY${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Services...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $FASTAPI_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Start FastAPI backend
echo -e "${BLUE}🐍 Starting FastAPI backend (port 8000)...${NC}"
cd backend
source venv/bin/activate
python3 kestra_api.py > ../logs/fastapi.log 2>&1 &
FASTAPI_PID=$!
cd ..

# Wait for FastAPI to start
sleep 3

# Check if FastAPI started successfully
if ! ps -p $FASTAPI_PID > /dev/null; then
    echo -e "${RED}❌ FastAPI failed to start. Check logs/fastapi.log${NC}"
    exit 1
fi

echo -e "${GREEN}✅ FastAPI running (PID: $FASTAPI_PID)${NC}"

# Start Next.js frontend
echo -e "${BLUE}⚛️  Starting Next.js frontend (port 3000)...${NC}"
cd web
npm run dev > ../logs/nextjs.log 2>&1 &
NEXTJS_PID=$!
cd ..

# Wait for Next.js to start
sleep 3

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All services started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📍 Service URLs:"
echo "   • Frontend:  http://localhost:3000"
echo "   • FastAPI:   http://localhost:8000"
echo "   • Kestra UI: http://localhost:8080"
echo ""
echo "📊 API Documentation:"
echo "   • FastAPI Docs: http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   • FastAPI: logs/fastapi.log"
echo "   • Next.js: logs/nextjs.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
