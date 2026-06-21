import React from "react";
import { motion } from "motion/react";
import { Mic, Leaf, Sun, BarChart2, GraduationCap, AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from "lucide-react";
import { TabId } from "../types";

interface HomeScreenProps {
  district: string;
  weatherTemp: number;
  weatherRainSoon: boolean;
  mandiMarqueeText: string;
  isHighContrast: boolean;
  onSelectFeature: (tab: TabId) => void;
  onActivateVoice: () => void;
  isVoiceActive: boolean;
}

export default function HomeScreen({
  district,
  weatherTemp,
  weatherRainSoon,
  mandiMarqueeText,
  isHighContrast,
  onSelectFeature,
  onActivateVoice,
  isVoiceActive,
}: HomeScreenProps) {
  
  // Format current date nicely
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'long' 
    };
    return new Date().toLocaleDateString('hi-IN', options);
  };

  return (
    <div id="home-screen-view" className="flex-1 flex flex-col pb-4 select-none">
      
      {/* 1. Gradient Header Section */}
      <div 
        id="home-header-banner"
        className={`p-5 text-white ${isHighContrast ? "bg-black border-b-4 border-yellow-500" : "bg-gradient-to-br from-emerald-800 to-emerald-950"} rounded-b-[28px] shadow-md`}
      >
        <div className="flex justify-between items-start">
          <div id="user-greeting-sec">
            <span className="text-xs text-emerald-250 opacity-85 uppercase tracking-wider font-mono">किसान साथी</span>
            <h2 className="text-2xl font-bold flex items-center gap-1.5 font-sans">
              नमस्ते, Ramesh 🌾
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 opacity-90 mt-1 font-sans">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate()}</span>
              <span>•</span>
              <span className="font-semibold text-yellow-300">{district}, MH</span>
            </div>
          </div>

          {/* Quick Weather Widget */}
          <div 
            id="weather-widget-badge" 
            onClick={() => onSelectFeature("learn")} // or weather tab if we link
            className="cursor-pointer bg-black/20 hover:bg-black/35 transition-colors p-2.5 rounded-2xl flex flex-col items-center justify-center border border-white/10 text-center min-w-[84px]"
          >
            <span className="text-xs text-yellow-400 font-bold flex items-center gap-0.5">
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
              {weatherTemp}°C
            </span>
            <span className="text-[10px] text-white/80 scale-95 uppercase font-semibold block mt-0.5 mt-y">धूप खिली है</span>
            
            {weatherRainSoon && (
              <span className="mt-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] bg-amber-500 text-black font-extrabold animate-pulse">
                <AlertCircle className="w-2 h-2" />
                Rain in 2d
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Marquee Live Price Alert Banner */}
      <div 
        id="mandi-price-marquee-wrapper"
        className={`py-2 px-1 relative overflow-hidden flex items-center ${isHighContrast ? "bg-yellow-400 text-black border-y-2 border-black" : "bg-amber-100 text-amber-900"} font-medium`}
      >
        <div className="absolute left-0 z-10 bg-inherit px-2 text-xs font-bold shadow-md uppercase scale-95 tracking-wide flex items-center gap-0.5">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
          लाइव मंडी:
        </div>
        <div className="w-full pl-22">
          <div className="whitespace-nowrap overflow-hidden relative">
            <span className="marquee-text text-sm font-sans block">
              {mandiMarqueeText} • {mandiMarqueeText}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Central Voice Pulse Input Area */}
      <div id="voice-button-section" className="my-7 flex flex-col items-center justify-center py-4 bg-white/40 rounded-3xl mx-4 border border-emerald-100 relative">
        {/* Audio Waveform bouncing visualizer shown ONLY when speaking / mic activated */}
        <div className="h-10 flex items-end gap-1.5 justify-center mb-4 transition-all duration-30s">
          {isVoiceActive ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-amber-500 wave-bar"
                style={{
                  height: "40px",
                  animationDelay: `${i * 120}ms`,
                  animationDuration: `${0.6 + Math.random() * 0.8}s`
                }}
              />
            ))
          ) : (
            <p className="text-[13px] font-bold leading-snug px-6 text-center text-slate-800 drop-shadow-sm" style={{fontFamily: '"Inter", sans-serif'}}>
              कृषि सलाह के लिए हरी बटन दबाकर कुछ भी पूछें!
            </p>
          )}
        </div>

        {/* Triple circle pulsating ring wrapper */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Wave ring 3 */}
          <motion.div
            className={`absolute rounded-full pointer-events-none border ${isHighContrast ? "border-black border-4" : "border-emerald-500/25"} `}
            initial={{ width: 100, height: 100, opacity: 0.8 }}
            animate={{ 
              width: isVoiceActive ? 170 : 160, 
              height: isVoiceActive ? 170 : 160, 
              opacity: 0 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isVoiceActive ? 1.0 : 2.0, 
              ease: "easeOut" 
            }}
          />
          {/* Wave ring 2 */}
          <motion.div
            className={`absolute rounded-full pointer-events-none border ${isHighContrast ? "border-black border-2" : "border-emerald-400/35"}`}
            initial={{ width: 100, height: 100, opacity: 0.8 }}
            animate={{ 
              width: isVoiceActive ? 140 : 130, 
              height: isVoiceActive ? 140 : 130, 
              opacity: 0 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isVoiceActive ? 1.0 : 2.0, 
              delay: 0.5, 
              ease: "easeOut" 
            }}
          />
          {/* Wave ring 1 */}
          <motion.div
            className={`absolute rounded-full pointer-events-none border ${isHighContrast ? "border-black" : "border-emerald-300/45"}`}
            initial={{ width: 100, height: 100, opacity: 0.8 }}
            animate={{ 
              width: isVoiceActive ? 115 : 105, 
              height: isVoiceActive ? 115 : 105, 
              opacity: 0 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isVoiceActive ? 1.0 : 2.0, 
              delay: 1.0, 
              ease: "easeOut" 
            }}
          />

          {/* Core Master Micro Button */}
          <motion.button
            id="mic-pulse-button"
            whileTap={{ scale: 0.94 }}
            onClick={onActivateVoice}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-colors z-10 ${
              isHighContrast 
                ? "bg-black text-white hover:bg-zinc-900 border-4 border-yellow-500" 
                : isVoiceActive 
                  ? "bg-amber-500 hover:bg-amber-600 text-black" 
                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
            }`}
          >
            <Mic className={`w-10 h-10 ${isVoiceActive ? "animate-bounce" : ""}`} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider font-sans">
              {isVoiceActive ? "सुन रहा हूँ" : "बोलें"}
            </span>
          </motion.button>
        </div>

        {/* Dynamic bottom speech prompt instruction */}
        <p className="mt-2 text-sm font-bold text-sans select-none text-emerald-950 flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          {isVoiceActive ? "कृपया बोलिए..." : "बोलिए... (Tap to speak)"}
        </p>
      </div>

      {/* 4. 2x2 Feature Grid */}
      <div id="home-feature-cards" className="px-4 pb-4">
        <h3 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 font-sans flex justify-between items-center">
          <span>विशेष सेवाएं (Premium Services)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full">Offline Supported</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card 1: Crop Disease */}
          <button 
            onClick={() => onSelectFeature("disease")}
            className={`p-4 rounded-2xl bg-white text-left transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer flex flex-col justify-between h-[124px] relative border ${isHighContrast ? "border-black border-2" : "border-slate-100 shadow-sm"}`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Leaf className="w-5 h-5 fill-emerald-100" />
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans">फसल रोग (Disease ID)</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">फोटो या आवाज़ से पहचानें</p>
            </div>
          </button>

          {/* Card 2: Weather Advise */}
          <button 
            onClick={() => onSelectFeature("learn")} // Redirecting to learn/weather
            className={`p-4 rounded-2xl bg-white text-left transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer flex flex-col justify-between h-[124px] relative border ${isHighContrast ? "border-black border-2" : "border-slate-100 shadow-sm"}`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Sun className="w-5 h-5" />
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans">मौसम (Weather Advis)</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">अगले 7 दिन का अनुमान</p>
            </div>
          </button>

          {/* Card 3: Mandi Chart */}
          <button 
            onClick={() => onSelectFeature("market")}
            className={`p-4 rounded-2xl bg-white text-left transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer flex flex-col justify-between h-[124px] relative border ${isHighContrast ? "border-black border-2" : "border-slate-100 shadow-sm"}`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <BarChart2 className="w-5 h-5" />
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans">मंडी भाव (Market Prices)</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">आज के ताज़ा दाम</p>
            </div>
          </button>

          {/* Card 4: ZBNF Training */}
          <button 
            onClick={() => {
              // Switch to education tab
              onSelectFeature("learn");
            }}
            className={`p-4 rounded-2xl bg-white text-left transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer flex flex-col justify-between h-[124px] relative border ${isHighContrast ? "border-black border-2" : "border-slate-100 shadow-sm"}`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans">प्राकृतिक खेती (ZBNF)</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">तकनीक व विधियां सीखें</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
