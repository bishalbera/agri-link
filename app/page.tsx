'use client'

import { useState } from 'react'
import FarmerForm from '@/components/FarmerForm'
import ExecutionDashboard from '@/components/ExecutionDashboard'

export default function Home() {
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleExecutionStart = (id: string) => {
    setExecutionId(id)
    setIsExecuting(true)
  }

  const handleExecutionComplete = () => {
    setIsExecuting(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-800">
                Agri-Link
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                The Crisis Shield for Farmers - Autonomous AI Agent Negotiation
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold shadow-lg">
                AssembleHack25 - Wakanda Data Award
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Protect Farmers from
            <span className="block text-green-600">Market Crashes</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            AI-powered agents that detect price crashes and autonomously negotiate with multiple buyers to prevent distress sales
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div>
            <FarmerForm
              onExecutionStart={handleExecutionStart}
              isExecuting={isExecuting}
            />
          </div>

          {/* Right Column - Execution Dashboard */}
          <div>
            {executionId ? (
              <ExecutionDashboard
                executionId={executionId}
                onComplete={handleExecutionComplete}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-24 w-24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Crisis Shield Ready
                </h3>
                <p className="text-gray-500">
                  Submit farmer details to activate AI agents
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            How the Crisis Shield Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Market Monitor',
                description: 'Fetches real-time prices from data.gov.in API',
                icon: '📊',
              },
              {
                step: '2',
                title: 'Crisis Detection',
                description: 'AI detects if price < cost of production',
                icon: '🛡️',
              },
              {
                step: '3',
                title: 'Smart Negotiation',
                description: 'AI negotiates with 3+ alternative buyers',
                icon: '💼',
              },
              {
                step: '4',
                title: 'Logistics',
                description: 'Arranges pickup and generates invoice',
                icon: '📦',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-sm font-semibold text-green-600 mb-2">
                  Step {item.step}
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
