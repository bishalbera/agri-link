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

export default function DashboardPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:8000/api/executions?limit=20&flow_id=main-sale-workflow");
        const data = await response.json();

        if (data.success && data.executions) {
          const salesRecords: SaleRecord[] = data.executions
            .filter((exec: any) => exec.state_current === "SUCCESS")
            .map((exec: any) => {
              const outputs = exec.outputs || {};
              const inputs = exec.inputs ? JSON.parse(exec.inputs) : {};

              const isCrisis = outputs.execution_path === "CRISIS_SHIELD";

              let buyer = "Unknown";
              let totalAmount = 0;
              let pricePerKg = 0;

              if (isCrisis && outputs.crisis_resolution) {
                buyer = outputs.crisis_resolution.selected_outlet?.name || "Emergency Outlet";
                totalAmount = outputs.crisis_resolution.financial_analysis?.outlet_total || 0;
                pricePerKg = outputs.crisis_resolution.financial_analysis?.outlet_price_per_kg || 0;
              } else if (outputs.best_offer && outputs.best_offer.winner) {
                buyer = outputs.best_offer.winner.buyer_name || "Selected Buyer";
                totalAmount = outputs.best_offer.winner.total_amount || 0;
                pricePerKg = outputs.best_offer.winner.final_price_per_kg || 0;
              }

              return {
                id: exec.id,
                date: new Date(exec.start_date).toISOString().split("T")[0],
                commodity: inputs.commodity || "Unknown",
                quantity: parseInt(inputs.quantity_kg) || 0,
                pricePerKg: pricePerKg,
                totalAmount: totalAmount,
                status: isCrisis ? "crisis" as const : "completed" as const,
                buyer: buyer,
              };
            });

          setSales(salesRecords);
        } else {
          setSales([]);
        }
      } catch (error) {
        console.error("Failed to fetch executions:", error);
        setSales([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecutions();
  }, []);

  const totalEarnings = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const crisisAverted = sales.filter(s => s.status === "crisis").length;

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Recent Sales
              </h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading sales history...</p>
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl mb-4 block">📋</span>
                  <p className="text-gray-600 mb-4">No sales yet</p>
                  <Link
                    href="/sell"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                  >
                    Start Your First Sale
                  </Link>
                </div>
              ) : (
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
              )}

              {!isLoading && sales.length > 0 && (
                <button className="w-full mt-4 text-center text-green-600 hover:text-green-700 text-sm font-medium">
                  View All Transactions →
                </button>
              )}
            </div>
        </div>

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
