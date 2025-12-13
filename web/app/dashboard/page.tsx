// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SaleRecord {
  id: string;
  date: string;
  commodity: string;
  quantity: number;
  pricePerKg: number;
  totalAmount: number;
  status: "completed" | "pending" | "crisis";
  buyer: string;
}

// Demo data for the dashboard
const DEMO_SALES: SaleRecord[] = [
  {
    id: "1",
    date: "2025-12-10",
    commodity: "Tomato",
    quantity: 500,
    pricePerKg: 21,
    totalAmount: 10500,
    status: "completed",
    buyer: "FreshMart Restaurant",
  },
  {
    id: "2",
    date: "2025-12-08",
    commodity: "Potato",
    quantity: 1000,
    pricePerKg: 15,
    totalAmount: 15000,
    status: "completed",
    buyer: "BigBasket Wholesale",
  },
  {
    id: "3",
    date: "2025-12-05",
    commodity: "Tomato",
    quantity: 300,
    pricePerKg: 6.5,
    totalAmount: 1950,
    status: "crisis",
    buyer: "Kissan Foods (Processor)",
  },
  {
    id: "4",
    date: "2025-12-03",
    commodity: "Onion",
    quantity: 800,
    pricePerKg: 25,
    totalAmount: 20000,
    status: "completed",
    buyer: "Metro Cash & Carry",
  },
];

interface MarketPrice {
  commodity: string;
  currentPrice: number;
  change: number;
  status: "up" | "down" | "stable";
}

const DEMO_PRICES: MarketPrice[] = [
  { commodity: "Tomato", currentPrice: 18, change: -5, status: "down" },
  { commodity: "Potato", currentPrice: 15, change: 2, status: "up" },
  { commodity: "Onion", currentPrice: 28, change: 0, status: "stable" },
  { commodity: "Cabbage", currentPrice: 12, change: -3, status: "down" },
];

export default function DashboardPage() {
  const [sales, setSales] = useState<SaleRecord[]>(DEMO_SALES);
  const [prices, setPrices] = useState<MarketPrice[]>(DEMO_PRICES);
  const [isLoading, setIsLoading] = useState(false);

  const totalEarnings = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const crisisAverted = sales.filter(s => s.status === "crisis").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-bold text-green-800">Agri-Link</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome, Farmer</span>
            <Link
              href="/sell"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              + New Sale
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="💰"
            label="Total Earnings"
            value={`₹${totalEarnings.toLocaleString()}`}
            subtext="This month"
          />
          <StatCard
            icon="📦"
            label="Quantity Sold"
            value={`${totalQuantity} kg`}
            subtext={`${sales.length} transactions`}
          />
          <StatCard
            icon="🛡️"
            label="Crisis Averted"
            value={crisisAverted.toString()}
            subtext="Loss prevented"
            highlight
          />
          <StatCard
            icon="⭐"
            label="Avg. Premium"
            value="+17%"
            subtext="Above market rate"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Live Prices */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span>
                Live Mandi Prices
              </h2>
              <div className="space-y-3">
                {prices.map((price) => (
                  <div
                    key={price.commodity}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-700">{price.commodity}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">₹{price.currentPrice}/kg</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        price.status === "up" ? "bg-green-100 text-green-700" :
                        price.status === "down" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {price.status === "up" ? "↑" : price.status === "down" ? "↓" : "−"}
                        {Math.abs(price.change)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Source: data.gov.in • Updated just now
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/sell"
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition"
                >
                  <span>🌿</span>
                  <span>Sell New Crop</span>
                </Link>
                <button className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition w-full">
                  <span>📈</span>
                  <span>Price Alerts</span>
                </button>
                <button className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition w-full">
                  <span>📋</span>
                  <span>Download Reports</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Recent Sales
              </h2>
              
              <div className="space-y-4">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className={`p-4 rounded-xl border ${
                      sale.status === "crisis" 
                        ? "border-red-200 bg-red-50" 
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{sale.commodity}</span>
                          {sale.status === "crisis" && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              🛡️ Crisis Shield
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{sale.buyer}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">₹{sale.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{sale.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{sale.quantity} kg</span>
                      <span>•</span>
                      <span>₹{sale.pricePerKg}/kg</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 text-center text-green-600 hover:text-green-700 text-sm font-medium">
                View All Transactions →
              </button>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">AI Market Insight</h3>
              <p className="text-green-100">
                Tomato prices are expected to stabilize next week as supply normalizes. 
                Consider holding your produce if possible. The AI negotiation agents secured 
                an average of 17% above market rate for your sales this month.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  highlight = false 
}: { 
  icon: string; 
  label: string; 
  value: string; 
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-green-50 border-2 border-green-200" : "bg-white shadow-sm"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-green-700" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-1">{subtext}</div>
    </div>
  );
}
