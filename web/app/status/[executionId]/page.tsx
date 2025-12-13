"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface StatusData {
  id: string;
  phase: "analyzing" | "negotiating" | "arranging" | "complete" | "failed";
  progress: number;
  message: string;
  details?: {
    buyerName?: string;
    pricePerKg?: number;
    totalAmount?: number;
    pickupDate?: string;
    grade?: string;
  };
}

export default function StatusPage() {
  const params = useParams();
  const executionId = params.executionId as string;
  
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/status?id=${executionId}`);
        const data = await res.json();
        
        if (data.success) {
          setStatus(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }
    };

    // Initial fetch
    pollStatus();

    // Poll every 2 seconds until complete
    const interval = setInterval(() => {
      if (status?.phase !== "complete" && status?.phase !== "failed") {
        pollStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [executionId, status?.phase]);

  const phases = [
    { id: "analyzing", label: "Quality & Market Analysis", icon: "🔍" },
    { id: "negotiating", label: "AI Negotiation", icon: "🤖" },
    { id: "arranging", label: "Logistics", icon: "🚚" },
    { id: "complete", label: "Complete", icon: "✅" },
  ];

  const getCurrentPhaseIndex = () => {
    if (!status) return 0;
    return phases.findIndex(p => p.id === status.phase);
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
          <span className="text-sm text-gray-500">Sale Status</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="text-3xl mb-4 block">❌</span>
            <h2 className="font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Link
              href="/sell"
              className="inline-block mt-4 text-green-600 hover:text-green-700"
            >
              ← Try Again
            </Link>
          </div>
        ) : !status ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading status...</p>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-6">Sale Progress</h2>
              
              <div className="space-y-4">
                {phases.map((phase, index) => {
                  const currentIndex = getCurrentPhaseIndex();
                  const isComplete = index < currentIndex || status.phase === "complete";
                  const isActive = index === currentIndex && status.phase !== "complete";
                  const isPending = index > currentIndex;

                  return (
                    <div key={phase.id} className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-lg
                        ${isComplete ? "bg-green-500 text-white" : ""}
                        ${isActive ? "bg-green-100 text-green-600 animate-pulse" : ""}
                        ${isPending ? "bg-gray-100 text-gray-400" : ""}
                      `}>
                        {isComplete ? "✓" : phase.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isPending ? "text-gray-400" : "text-gray-900"}`}>
                          {phase.label}
                        </div>
                        {isActive && (
                          <div className="text-sm text-green-600">{status.message}</div>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-500 mt-2">
                  {status.progress}% complete
                </div>
              </div>
            </div>

            {/* Completion Card */}
            {status.phase === "complete" && status.details && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 animate-slide-up">
                <div className="text-center mb-6">
                  <span className="text-5xl mb-4 block">🎉</span>
                  <h2 className="text-2xl font-bold text-green-800">Sale Complete!</h2>
                  <p className="text-green-600">Your crop has been sold successfully</p>
                </div>

                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Buyer</span>
                    <span className="font-semibold text-gray-900">{status.details.buyerName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold text-gray-900">₹{status.details.pricePerKg}/kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-bold text-green-600 text-lg">₹{status.details.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Quality Grade</span>
                    <span className="font-semibold text-gray-900">Grade {status.details.grade}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Pickup Date</span>
                    <span className="font-semibold text-gray-900">{status.details.pickupDate}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/dashboard"
                    className="block w-full text-center bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/sell"
                    className="block w-full text-center text-green-600 py-3 hover:text-green-700"
                  >
                    Sell Another Crop
                  </Link>
                </div>
              </div>
            )}

            {/* Failed State */}
            {status.phase === "failed" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                <span className="text-5xl mb-4 block">😔</span>
                <h2 className="text-xl font-bold text-red-800 mb-2">Sale Failed</h2>
                <p className="text-red-600 mb-4">{status.message}</p>
                <Link
                  href="/sell"
                  className="inline-block bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  Try Again
                </Link>
              </div>
            )}

            {/* Execution ID */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Execution ID: {executionId}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
