"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [lang, setLang] = useState<"en" | "hi">("en");

  const content = {
    en: {
      title: "Agri-Link",
      tagline: "Your Crop, Fair Price",
      subtitle: "AI-powered crisis prevention for farmers",
      description: "Never sell at a loss again. Our AI agents negotiate the best prices and protect you when markets crash.",
      cta: "Sell Your Crop",
      features: [
        {
          icon: "🔍",
          title: "Real-Time Market Data",
          desc: "Live prices from Government of India Mandi database",
        },
        {
          icon: "🤖",
          title: "AI Negotiation",
          desc: "5 AI agents negotiate with buyers simultaneously",
        },
        {
          icon: "🛡️",
          title: "Crisis Shield",
          desc: "Auto-diverts to food processors when prices crash",
        },
        {
          icon: "📱",
          title: "One-Click Sale",
          desc: "Upload photo, set quantity, we handle the rest",
        },
      ],
      howItWorks: "How It Works",
      steps: [
        { num: "1", title: "Upload Photo", desc: "Take a photo of your produce" },
        { num: "2", title: "AI Grades Quality", desc: "Get instant quality assessment" },
        { num: "3", title: "Market Check", desc: "Real-time Mandi price analysis" },
        { num: "4", title: "Auto-Negotiate", desc: "AI finds the best buyer" },
      ],
    },
    hi: {
      title: "एग्री-लिंक",
      tagline: "आपकी फसल, सही दाम",
      subtitle: "किसानों के लिए AI-संचालित संकट सुरक्षा",
      description: "कभी घाटे में न बेचें। हमारे AI एजेंट सर्वोत्तम मूल्य पर बातचीत करते हैं और बाज़ार गिरने पर आपकी रक्षा करते हैं।",
      cta: "अपनी फसल बेचें",
      features: [
        {
          icon: "🔍",
          title: "रीयल-टाइम मार्केट डेटा",
          desc: "भारत सरकार मंडी डेटाबेस से लाइव कीमतें",
        },
        {
          icon: "🤖",
          title: "AI बातचीत",
          desc: "5 AI एजेंट एक साथ खरीदारों से बातचीत करते हैं",
        },
        {
          icon: "🛡️",
          title: "संकट शील्ड",
          desc: "कीमतें गिरने पर ऑटो-डायवर्ट करता है",
        },
        {
          icon: "📱",
          title: "एक-क्लिक बिक्री",
          desc: "फोटो अपलोड करें, बाकी हम संभालेंगे",
        },
      ],
      howItWorks: "यह कैसे काम करता है",
      steps: [
        { num: "१", title: "फोटो अपलोड करें", desc: "अपनी फसल की फोटो लें" },
        { num: "२", title: "AI ग्रेड देता है", desc: "तुरंत गुणवत्ता मूल्यांकन" },
        { num: "३", title: "बाज़ार जाँच", desc: "रीयल-टाइम मंडी मूल्य विश्लेषण" },
        { num: "४", title: "ऑटो-बातचीत", desc: "AI सर्वश्रेष्ठ खरीदार खोजता है" },
      ],
    },
  };

  const t = content[lang];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-green-800 text-xl">{t.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition"
            >
              {lang === "en" ? "हिंदी" : "English"}
            </button>
            <Link
              href="/dashboard"
              className="text-sm text-green-700 hover:text-green-900"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-20">
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className={`text-4xl md:text-6xl font-bold text-green-900 mb-4 ${lang === "hi" ? "hindi-text" : ""}`}>
              {t.tagline}
            </h1>
            <p className={`text-xl md:text-2xl text-green-700 mb-6 ${lang === "hi" ? "hindi-text" : ""}`}>
              {t.subtitle}
            </p>
            <p className={`text-gray-600 mb-8 max-w-xl mx-auto ${lang === "hi" ? "hindi-text" : ""}`}>
              {t.description}
            </p>
            <Link
              href="/sell"
              className={`inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl ${lang === "hi" ? "hindi-text" : ""}`}
            >
              {t.cta}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {t.features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-md card-hover"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className={`font-semibold text-gray-900 mb-2 ${lang === "hi" ? "hindi-text" : ""}`}>
                  {feature.title}
                </h3>
                <p className={`text-gray-600 text-sm ${lang === "hi" ? "hindi-text" : ""}`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className={`text-3xl font-bold text-center text-gray-900 mb-12 ${lang === "hi" ? "hindi-text" : ""}`}>
              {t.howItWorks}
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {t.steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 text-green-800 text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className={`font-semibold text-gray-900 mb-2 ${lang === "hi" ? "hindi-text" : ""}`}>
                    {step.title}
                  </h3>
                  <p className={`text-gray-600 text-sm ${lang === "hi" ? "hindi-text" : ""}`}>
                    {step.desc}
                  </p>
                  {i < t.steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-green-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-16 bg-gradient-to-b from-green-50 to-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-green-600 text-white p-6 text-center">
                <h3 className="text-xl font-semibold">Live Demo</h3>
                <p className="text-green-100 text-sm mt-1">See how Agri-Link works</p>
              </div>
              <div className="p-8">
                <div className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-xl p-6 crisis-border">
                      <div className="text-sm text-red-600 font-medium mb-2">Crisis Shield Activated</div>
                      <div className="text-3xl font-bold text-red-800 mb-2">₹6.5/kg</div>
                      <div className="text-gray-600 text-sm mb-4">Diverted to food processor, saved 30% loss</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="status-dot crisis"></span>
                        Market Status: Crisis Detected
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-4">
                        When market prices crash below cost, AI automatically finds alternative buyers
                      </p>
                      <Link
                        href="/sell?demo=crisis"
                        className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                      >
                        Try Crisis Shield Demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🌾</span>
              <span className="font-bold text-white text-xl">Agri-Link</span>
            </div>
            <p className="text-sm mb-4">
              Powered by Kestra AI Agents • Deployed on Vercel
            </p>
            <p className="text-xs">
              Data source: data.gov.in (Government of India)
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800 text-xs">
              Built for AI Agents Assemble Hackathon 2025
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
