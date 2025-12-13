
const API_KEY = process.env.GOVDATA_API_KEY;
const BASE_URL = "https://api.data.gov.in/resource";
const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

/**
 * API Field Mappings (from actual API response):
 * 
 * field_exposed (for filters):
 *   - state.keyword  (NOT just "state")
 *   - district
 *   - market
 *   - commodity
 *   - variety
 *   - grade
 * 
 * VALUES ARE CASE-SENSITIVE!
 *   - "Tomato" not "tomato"
 *   - "Maharashtra" not "maharashtra"
 */

export interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface MarketAnalysis {
  currentPrice: number;
  currentPricePerKg: number;
  avgPrice7Day: number;
  avgPrice30Day: number;
  priceDropPercent: number;
  priceChangeDirection: "up" | "down" | "stable";
  status: "NORMAL" | "WARNING" | "CRISIS";
  statusReason: string;
  recommendation: string;
  latestRecords: MandiPrice[];
  marketCount: number;
  dataFreshness: string;
}

export interface ApiResponse {
  status: string;
  message: string;
  total: number;
  count: number;
  limit: string;
  offset: string;
  records: Record<string, unknown>[];
}

/**
 * Known states and commodities for validation
 */
export const KNOWN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal"
];

export const KNOWN_COMMODITIES = [
  "Tomato", "Potato", "Onion", "Brinjal", "Cabbage", "Cauliflower",
  "Carrot", "Cucumber", "Lady Finger", "Green Chilli", "Capsicum",
  "Bitter gourd", "Bottle gourd", "Pumpkin", "Radish", "Spinach",
  "Beans", "Peas", "Garlic", "Ginger", "Lemon", "Orange", "Apple",
  "Banana", "Grapes", "Mango", "Papaya", "Pomegranate", "Watermelon",
  "Rice", "Wheat", "Maize", "Jowar", "Bajra", "Groundnut", "Soyabean",
  "Cotton", "Sugarcane", "Turmeric", "Coriander"
];

/**
 * Cost of production per kg for major crops (in ₹)
 * Source: Commission for Agricultural Costs and Prices (CACP)
 */
export const COST_OF_PRODUCTION: Record<string, number> = {
  "Tomato": 8,
  "Potato": 6,
  "Onion": 7,
  "Cabbage": 5,
  "Cauliflower": 6,
  "Brinjal": 7,
  "Carrot": 8,
  "Green Chilli": 10,
  "Capsicum": 12,
  "Lady Finger": 9,
  "Cucumber": 6,
  "Beans": 10,
  "Peas": 12,
  "Garlic": 15,
  "Ginger": 20,
};

/**
 * Fetch mandi prices from data.gov.in
 */
export async function getMandiPrices(
  commodity: string,
  state: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ prices: MandiPrice[]; total: number }> {
  
  if (!API_KEY) {
    throw new Error("GOVDATA_API_KEY environment variable not set");
  }

  // Validate inputs
  const normalizedCommodity = normalizeCase(commodity, KNOWN_COMMODITIES);
  const normalizedState = normalizeCase(state, KNOWN_STATES);

  // Build URL with proper filter syntax
  const url = new URL(`${BASE_URL}/${MANDI_RESOURCE_ID}`);
  url.searchParams.set("api-key", API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());
  
  // CRITICAL: Use "state.keyword" for state filter
  url.searchParams.set("filters[state.keyword]", normalizedState);
  url.searchParams.set("filters[commodity]", normalizedCommodity);

  console.log(`[DataGovAPI] Fetching: ${url.toString().replace(API_KEY, '***')}`);

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse = await response.json();

  if (data.status !== "ok") {
    throw new Error(`API error: ${data.message}`);
  }

  const prices: MandiPrice[] = data.records.map((record) => ({
    state: String(record.state || ""),
    district: String(record.district || ""),
    market: String(record.market || ""),
    commodity: String(record.commodity || ""),
    variety: String(record.variety || ""),
    grade: String(record.grade || ""),
    arrival_date: String(record.arrival_date || ""),
    min_price: parseFloat(String(record.min_price)) || 0,
    max_price: parseFloat(String(record.max_price)) || 0,
    modal_price: parseFloat(String(record.modal_price)) || 0,
  }));

  return { prices, total: data.total };
}

/**
 * Analyze market conditions and determine status
 */
export async function analyzeMarket(
  commodity: string,
  state: string,
  costOfProductionPerKg?: number
): Promise<MarketAnalysis> {
  
  // Use default cost if not provided
  const cost = costOfProductionPerKg || COST_OF_PRODUCTION[commodity] || 10;
  const costPerQuintal = cost * 100;

  // Fetch recent prices
  const { prices, total } = await getMandiPrices(commodity, state, 500);

  if (prices.length === 0) {
    return {
      currentPrice: 0,
      currentPricePerKg: 0,
      avgPrice7Day: 0,
      avgPrice30Day: 0,
      priceDropPercent: 0,
      priceChangeDirection: "stable",
      status: "WARNING",
      statusReason: "No market data available for this commodity/state combination",
      recommendation: "MANUAL_CHECK_REQUIRED",
      latestRecords: [],
      marketCount: 0,
      dataFreshness: "No data",
    };
  }

  // Sort by date (most recent first)
  const sortedPrices = prices.sort((a, b) => {
    const dateA = parseIndianDate(a.arrival_date);
    const dateB = parseIndianDate(b.arrival_date);
    return dateB.getTime() - dateA.getTime();
  });

  // Get latest date's prices
  const latestDate = sortedPrices[0].arrival_date;
  const todayPrices = sortedPrices.filter(p => p.arrival_date === latestDate);
  
  // Calculate current modal price (average across markets)
  const currentPrice = todayPrices.length > 0
    ? todayPrices.reduce((sum, p) => sum + p.modal_price, 0) / todayPrices.length
    : sortedPrices[0].modal_price;

  // Convert from ₹/quintal to ₹/kg
  const currentPricePerKg = currentPrice / 100;

  // Calculate 7-day average
  const last7DayPrices = sortedPrices.slice(0, Math.min(100, sortedPrices.length));
  const avgPrice7Day = last7DayPrices.reduce((sum, p) => sum + p.modal_price, 0) / last7DayPrices.length;

  // Calculate 30-day average
  const avgPrice30Day = sortedPrices.reduce((sum, p) => sum + p.modal_price, 0) / sortedPrices.length;

  // Calculate price change
  const priceDropPercent = avgPrice7Day > 0 
    ? ((avgPrice7Day - currentPrice) / avgPrice7Day) * 100 
    : 0;

  const priceChangeDirection: "up" | "down" | "stable" = 
    priceDropPercent > 5 ? "down" : 
    priceDropPercent < -5 ? "up" : "stable";

  // Determine market status using crisis algorithm
  let status: "NORMAL" | "WARNING" | "CRISIS";
  let statusReason: string;
  let recommendation: string;

  if (currentPrice < costPerQuintal * 0.8) {
    status = "CRISIS";
    statusReason = `Price (₹${Math.round(currentPricePerKg)}/kg) is below 80% of production cost (₹${cost}/kg)`;
    recommendation = "ACTIVATE_CRISIS_SHIELD";
  } else if (currentPrice < costPerQuintal) {
    status = "WARNING";
    statusReason = `Price (₹${Math.round(currentPricePerKg)}/kg) is below production cost (₹${cost}/kg)`;
    recommendation = "NEGOTIATE_AGGRESSIVELY";
  } else if (priceDropPercent > 30) {
    status = "CRISIS";
    statusReason = `Rapid price crash detected: ${Math.round(priceDropPercent)}% drop from 7-day average`;
    recommendation = "ACTIVATE_CRISIS_SHIELD";
  } else if (priceDropPercent > 20) {
    status = "WARNING";
    statusReason = `Significant price drop: ${Math.round(priceDropPercent)}% from 7-day average`;
    recommendation = "SELL_QUICKLY";
  } else if (priceDropPercent > 10) {
    status = "WARNING";
    statusReason = `Moderate price decline: ${Math.round(priceDropPercent)}% from 7-day average`;
    recommendation = "MONITOR_AND_NEGOTIATE";
  } else {
    status = "NORMAL";
    statusReason = "Market conditions are stable";
    recommendation = "PROCEED_WITH_NEGOTIATION";
  }

  // Calculate data freshness
  const latestDateObj = parseIndianDate(latestDate);
  const daysSinceUpdate = Math.floor((Date.now() - latestDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const dataFreshness = daysSinceUpdate === 0 ? "Today" : 
    daysSinceUpdate === 1 ? "Yesterday" : 
    `${daysSinceUpdate} days ago`;

  return {
    currentPrice: Math.round(currentPrice),
    currentPricePerKg: Math.round(currentPricePerKg * 100) / 100,
    avgPrice7Day: Math.round(avgPrice7Day),
    avgPrice30Day: Math.round(avgPrice30Day),
    priceDropPercent: Math.round(priceDropPercent * 10) / 10,
    priceChangeDirection,
    status,
    statusReason,
    recommendation,
    latestRecords: todayPrices.slice(0, 10),
    marketCount: todayPrices.length,
    dataFreshness,
  };
}

/**
 * Get summary for Kestra AI Agent
 */
export async function getMarketSummaryForAgent(
  commodity: string,
  state: string
): Promise<string> {
  const analysis = await analyzeMarket(commodity, state);
  
  return `
MARKET INTELLIGENCE SUMMARY
===========================
Commodity: ${commodity}
State: ${state}
Data Freshness: ${analysis.dataFreshness}

CURRENT PRICES:
- Current Price: ₹${analysis.currentPrice}/quintal (₹${analysis.currentPricePerKg}/kg)
- 7-Day Average: ₹${analysis.avgPrice7Day}/quintal
- 30-Day Average: ₹${analysis.avgPrice30Day}/quintal
- Price Change: ${analysis.priceDropPercent > 0 ? '↓' : '↑'} ${Math.abs(analysis.priceDropPercent)}% from 7-day avg

MARKET STATUS: ${analysis.status}
Reason: ${analysis.statusReason}

RECOMMENDATION: ${analysis.recommendation}

MARKETS REPORTING: ${analysis.marketCount}
Top Markets:
${analysis.latestRecords.slice(0, 5).map(r => 
  `- ${r.market} (${r.district}): ₹${r.modal_price}/quintal`
).join('\n')}
`.trim();
}

// Helper functions

function normalizeCase(input: string, validValues: string[]): string {
  const lowerInput = input.toLowerCase();
  const match = validValues.find(v => v.toLowerCase() === lowerInput);
  return match || input;
}

function parseIndianDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  // Handle DD/MM/YYYY or DD-MM-YYYY format
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  return new Date(dateStr);
}

// Export for API routes
export type { MarketAnalysis, MandiPrice };
