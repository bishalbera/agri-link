"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KNOWN_STATES, KNOWN_COMMODITIES, COST_OF_PRODUCTION } from "@/lib/dataGovApi";

type Step = "upload" | "details" | "analyzing" | "result";

interface FormData {
  cropImage: File | null;
  cropImagePreview: string;
  commodity: string;
  quantity: number;
  state: string;
  district: string;
  farmerName: string;
  farmerPhone: string;
}

interface MarketResult {
  status: "NORMAL" | "WARNING" | "CRISIS";
  currentPricePerKg: number;
  recommendation: string;
  statusReason: string;
}

export default function SellPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>("upload");
  const [formData, setFormData] = useState<FormData>({
    cropImage: null,
    cropImagePreview: "",
    commodity: "Tomato",
    quantity: 100,
    state: "Maharashtra",
    district: "",
    farmerName: "",
    farmerPhone: "",
  });
  const [marketResult, setMarketResult] = useState<MarketResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        cropImage: file,
        cropImagePreview: URL.createObjectURL(file),
      }));
      setStep("details");
    }
  };

  const handleAnalyze = async () => {
    setStep("analyzing");
    setIsLoading(true);

    try {
      // First, check market conditions
      const marketRes = await fetch(
        `/api/market?commodity=${encodeURIComponent(formData.commodity)}&state=${encodeURIComponent(formData.state)}&cost=${COST_OF_PRODUCTION[formData.commodity] || 10}`
      );
      const marketData = await marketRes.json();
      
      if (marketData.success) {
        setMarketResult(marketData.data);
      }

      // Then trigger the Kestra workflow
      const sellRes = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: `farmer_${Date.now()}`,
          farmerName: formData.farmerName || "Demo Farmer",
          farmerPhone: formData.farmerPhone || "+919999999999",
          commodity: formData.commodity,
          quantityKg: formData.quantity,
          state: formData.state,
          district: formData.district || "Demo District",
          cropImageUrl: formData.cropImagePreview || "",
          costOfProduction: COST_OF_PRODUCTION[formData.commodity] || 10,
        }),
      });

      const sellData = await sellRes.json();
      
      if (sellData.executionId) {
        setExecutionId(sellData.executionId);
      }

      setStep("result");
    } catch (error) {
      console.error("Error:", error);
      // Show demo result on error
      setMarketResult({
        status: "NORMAL",
        currentPricePerKg: 18,
        recommendation: "PROCEED_WITH_NEGOTIATION",
        statusReason: "Market conditions are stable (Demo Mode)",
      });
      setStep("result");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-bold text-green-800">Agri-Link</span>
          </Link>
          <span className="text-sm text-gray-500">Sell Crop</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {["Upload", "Details", "Analyze", "Result"].map((label, i) => {
            const stepIndex = ["upload", "details", "analyzing", "result"].indexOf(step);
            const isActive = i <= stepIndex;
            const isCurrent = i === stepIndex;
            
            return (
              <div key={label} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}
                  ${isCurrent ? "ring-4 ring-green-200" : ""}
                `}>
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className={`w-12 h-1 mx-1 ${isActive ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="animate-slide-up">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Crop Photo</h1>
            <p className="text-gray-600 mb-6">Take a clear photo of your produce for quality assessment</p>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-green-300 rounded-2xl p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
            >
              <div className="text-5xl mb-4">📷</div>
              <p className="text-green-700 font-medium">Tap to upload photo</p>
              <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="mt-6 p-4 bg-amber-50 rounded-xl">
              <p className="text-amber-800 text-sm">
                💡 <strong>Tip:</strong> Good lighting and clear focus help AI grade your crop accurately
              </p>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="animate-slide-up">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Crop Details</h1>
            
            {/* Image Preview */}
            {formData.cropImagePreview && (
              <div className="mb-6 relative">
                <img
                  src={formData.cropImagePreview}
                  alt="Crop preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, cropImage: null, cropImagePreview: "" }));
                    setStep("upload");
                  }}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-2 shadow"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Commodity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Type
                </label>
                <select
                  value={formData.commodity}
                  onChange={(e) => setFormData(prev => ({ ...prev, commodity: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                >
                  {KNOWN_COMMODITIES.slice(0, 15).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  min={1}
                  max={10000}
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                >
                  {KNOWN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="e.g., Nashik"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>

              {/* Farmer Name (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.farmerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerName: e.target.value }))}
                  placeholder="e.g., Ramesh Kumar"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full mt-8 bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              Analyze & Find Buyers
            </button>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="animate-slide-up text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse-ring"></div>
              <div className="absolute inset-2 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl animate-bounce-slow">🔍</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing...</h2>
            
            <div className="space-y-3 text-left max-w-xs mx-auto mt-8">
              <AnalysisStep label="Grading crop quality" status="complete" />
              <AnalysisStep label="Fetching Mandi prices" status="active" />
              <AnalysisStep label="Checking market status" status="pending" />
              <AnalysisStep label="Finding best buyers" status="pending" />
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && marketResult && (
          <div className="animate-slide-up">
            {/* Status Banner */}
            <div className={`
              rounded-2xl p-6 mb-6
              ${marketResult.status === "CRISIS" ? "bg-red-50 border-2 border-red-200 crisis-border" : ""}
              ${marketResult.status === "WARNING" ? "bg-amber-50 border-2 border-amber-200" : ""}
              ${marketResult.status === "NORMAL" ? "bg-green-50 border-2 border-green-200" : ""}
            `}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">
                  {marketResult.status === "CRISIS" ? "🛡️" : marketResult.status === "WARNING" ? "⚠️" : "✅"}
                </span>
                <div>
                  <h2 className={`font-bold text-lg ${
                    marketResult.status === "CRISIS" ? "text-red-800" :
                    marketResult.status === "WARNING" ? "text-amber-800" : "text-green-800"
                  }`}>
                    {marketResult.status === "CRISIS" ? "Crisis Shield Activated!" :
                     marketResult.status === "WARNING" ? "Price Alert" : "Good Market"}
                  </h2>
                  <p className="text-sm text-gray-600">{marketResult.statusReason}</p>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 mb-1">Current Market Price</div>
                <div className="text-4xl font-bold text-gray-900">
                  ₹{marketResult.currentPricePerKg}<span className="text-lg font-normal text-gray-500">/kg</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Your Quantity</div>
                  <div className="font-semibold">{formData.quantity} kg</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Estimated Value</div>
                  <div className="font-semibold text-green-600">
                    ₹{(formData.quantity * marketResult.currentPricePerKg).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Recommended Action</h3>
              <p className="text-gray-600 mb-4">
                {marketResult.status === "CRISIS" 
                  ? "AI is finding alternative outlets (food processors, cold storage) to minimize your loss."
                  : marketResult.status === "WARNING"
                  ? "AI will negotiate aggressively with multiple buyers to get you the best price."
                  : "AI is negotiating with 5 buyers simultaneously to maximize your profit."}
              </p>
              
              {executionId && (
                <Link
                  href={`/status/${executionId}`}
                  className="block w-full text-center bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  Track Sale Progress →
                </Link>
              )}
            </div>

            {/* Start Over */}
            <button
              onClick={() => {
                setStep("upload");
                setFormData({
                  cropImage: null,
                  cropImagePreview: "",
                  commodity: "Tomato",
                  quantity: 100,
                  state: "Maharashtra",
                  district: "",
                  farmerName: "",
                  farmerPhone: "",
                });
                setMarketResult(null);
              }}
              className="w-full text-gray-500 py-3 hover:text-gray-700"
            >
              Start New Sale
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function AnalysisStep({ label, status }: { label: string; status: "pending" | "active" | "complete" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs
        ${status === "complete" ? "bg-green-500 text-white" : ""}
        ${status === "active" ? "bg-green-100 text-green-600" : ""}
        ${status === "pending" ? "bg-gray-100 text-gray-400" : ""}
      `}>
        {status === "complete" ? "✓" : status === "active" ? "..." : "○"}
      </div>
      <span className={status === "pending" ? "text-gray-400" : "text-gray-700"}>
        {label}
      </span>
    </div>
  );
}
