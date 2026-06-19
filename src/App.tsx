import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, Leaf, Sun, BarChart2, GraduationCap, User, 
  AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Calendar, Upload, Camera, Image, Check, ChevronDown, 
  ChevronUp, Sparkles, Volume2, Search, ArrowRight,
  ShieldCheck, HelpCircle, Eye, Sliders, Info, MapPin, Home
} from "lucide-react";
import { 
  TabId, CropPrice, WeatherAdvisory, WeatherResponse, 
  DiseaseResult, EducationLesson, SubsidyScheme 
} from "./types";
import SplashScreen from "./components/SplashScreen";
import HomeScreen from "./components/HomeScreen";

// Simulated base64 images for quick user diagnostic presets (healthy vs diseased)
const DEMO_DISEASED_TOMATO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100%' height='100%'><rect width='100' height='100' fill='%23661100'/><circle cx='50' cy='50' r='30' fill='%23e63946'/><ellipse cx='35' cy='35' r='8' fill='%23450505'/><ellipse cx='60' cy='65' r='10' fill='%23250202'/><path d='M30 45 Q 50 20 70 45' stroke='%23445522' stroke-width='4' fill='none'/></svg>";
const DEMO_POTATO_LEAF = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100%' height='100%'><rect width='100' height='100' fill='%23224422'/><path d='M50 15 Q30 50 50 85 Q70 50 50 15 Z' fill='%234d7c0f'/><line x1='50' y1='15' x2='50' y2='85' stroke='%233f6212' stroke-width='3'/><circle cx='42' cy='45' r='5' fill='%2327270a'/><circle cx='58' cy='55' r='7' fill='%231f1f0a'/></svg>";

const AUDIO_SAMPLES = [
  { text: "टमाटर के पत्तों पर काले धब्बे दिख रहे हैं, यह कौन सा रोग है?", tag: "फसल रोग / Disease" },
  { text: "जीवामृत बनाने की सही विधि और सामग्री क्या है?", tag: "प्राकृतिक खेती / ZBNF" },
  { text: "खरीफ फसल के लिए पीएम किसान योजना की पात्रता कैसे जांचें?", tag: "योजना / Benefits" }
];

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [district, setDistrict] = useState<string>("Nashik");
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);

  // Core Dynamic Data State loaded from APIs
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [market, setMarket] = useState<{ timestamp: string; prices: CropPrice[] } | null>(null);
  const [subsidies, setSubsidies] = useState<{ schemes: SubsidyScheme[]; pmKisanStatus: string } | null>(null);

  // Sub-Features state
  // Disease Identifier State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [symptomsInput, setSymptomsInput] = useState<string>("");
  const [diseaseLoading, setDiseaseLoading] = useState<boolean>(false);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null);
  const [diseaseError, setDiseaseError] = useState<string | null>(null);
  const [scannedLineY, setScannedLineY] = useState<number>(0);

  // Market screen state
  const [marketCategory, setMarketCategory] = useState<string>("All");
  const [marketSearch, setMarketSearch] = useState<string>("");
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);
  const [trendAnalysisCrop, setTrendAnalysisCrop] = useState<CropPrice | null>(null);

  // Farmer Listings state
  const [farmerListings, setFarmerListings] = useState<any[]>([]);
  const [showSellForm, setShowSellForm] = useState<boolean>(false);
  const [sellForm, setSellForm] = useState({
    farmerName: "", phone: "", cropName: "", quantity: "", pricePerQuintal: "", description: ""
  });
  const [sellFormMsg, setSellFormMsg] = useState<string>("");
  const [marketSubTab, setMarketSubTab] = useState<"prices" | "sell">("prices");

  // Weather Screen state
  const [weatherHourlyIndex, setWeatherHourlyIndex] = useState<number>(0);

  // Learn ZBNF state
  const [selectedZbnfLesson, setSelectedZbnfLesson] = useState<EducationLesson | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>(["l_1"]);

  // Financial State
  const [landAcres, setLandAcres] = useState<number>(2.5);
  const [calculatedLoan, setCalculatedLoan] = useState<number>(92500);

  // Voice Consultant Overlay State
  const [voiceQuery, setVoiceQuery] = useState<string>("");
  const [voiceLanguage, setVoiceLanguage] = useState<"HI" | "MR" | "EN">("HI");
  const [voiceStateMessage, setVoiceStateMessage] = useState<string>("");
  const [voiceResponseText, setVoiceResponseText] = useState<string>("");
  const [ttsActive, setTtsActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Sell form voice state
  const [sellVoiceStep, setSellVoiceStep] = useState<number>(-1);
  const [sellVoiceActive, setSellVoiceActive] = useState<boolean>(false);
  const SELL_QUESTIONS = [
    "आपका नाम क्या है?",
    "आपका फ़ोन नंबर क्या है?",
    "कौन सी फसल बेचना चाहते हैं?",
    "कितनी मात्रा में है? कुंतल में बताएं।",
    "प्रति कुंतल क्या दाम रखना चाहते हैं?",
    "कोई और जानकारी देना चाहते हैं?"
  ];
  const SELL_FIELDS = ["farmerName", "phone", "cropName", "quantity", "pricePerQuintal", "description"];

  // TTS helper - speaks text in Hindi
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setTtsActive(true);
    utterance.onend = () => setTtsActive(false);
    utterance.onerror = () => setTtsActive(false);
    window.speechSynthesis.speak(utterance);
  };

  // STT helper - starts listening
  const startListening = (onResult: (text: string) => void) => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setVoiceStateMessage("आपका ब्राउज़र स्पीच रिकग्निशन सपोर्ट नहीं करता। कृपया Chrome या Edge का उपयोग करें।");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage === "HI" ? "hi-IN" : voiceLanguage === "MR" ? "mr-IN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStateMessage("🎤 सुन रहे हैं... बोलें (Listening...)");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        setVoiceStateMessage("कोई आवाज़ नहीं सुनी गई। फिर से प्रयास करें।");
      } else {
        setVoiceStateMessage("आवाज़ पहचानने में त्रुटि। पुनः प्रयास करें।");
      }
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop listening
  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Stop TTS
  const stopTts = () => {
    window.speechSynthesis.cancel();
    setTtsActive(false);
  };

  // List of preconfigured interactive natural farming ZBNF lessons
  const lessonsDatabase: EducationLesson[] = [
    {
      id: "l_1",
      title: "बीजामृत विधि (Seed Treatment with Beejamrutha)",
      duration: "3:45",
      progress: 100,
      category: "बीज संस्कार",
      difficulty: "सभी स्तर (Beginner)",
      completed: true,
      speaker: "डॉ. सुभाष पालेकर",
      description: "गाय के गोबर, गोमूत्र, चूना और स्थानीय मिट्टी के उपयोग से बीजों का जैविक उपचार कर फंगस रोगों से शत-प्रतिशत मुक्ति पाएँ।"
    },
    {
      id: "l_2",
      title: "जीवामृत सघन खाद (Jeevamrutha Mastery)",
      duration: "4:32",
      progress: 60,
      category: "जीवाणु संवर्धन",
      difficulty: "सभी स्तर (Beginner)",
      completed: false,
      speaker: "आचार्य रामचंद्र राम",
      description: "200 लीटर पानी में 10 किलो गाय गोमूत्र व गोबर द्वारा सूक्ष्मजीव पैदा कर मिट्टी की उड़नशीलता को आश्चर्यजनक रूप से बढ़ाएं।"
    },
    {
      id: "l_3",
      title: "मल्चिंग या आच्छादन (Mulching Science)",
      duration: "5:15",
      progress: 0,
      category: "नमी संरक्षण",
      difficulty: "मध्यम (Intermediate)",
      completed: false,
      speaker: "श्रीमती सुनीता चौधरी",
      description: "फसल अवशेषों और भूसे से ज़मीन को ढककर वाष्पीकरण रोकना, केंचुओं को सक्रिय करना तथा खरपतवार नियंत्रण करना।"
    },
    {
      id: "l_4",
      title: "वापसा विधि (Whapasa — Air & Water Balance)",
      duration: "4:10",
      progress: 0,
      category: "सिंचाई प्रबंधन",
      difficulty: "उन्नत (Advanced)",
      completed: false,
      speaker: "राजेश पाटिल (जैविक विशेषज्ञ)",
      description: "मिट्टी में पानी देने के बजाय केवल वाष्प और हवा का संतुलन बनाए रखकर 90% तक पानी की भारी बचत करने का अनूठा तरीका।"
    }
  ];

  // Load general dashboard weather and market data on startup
  useEffect(() => {
    fetchWeatherData();
    fetchMarketPrices();
    fetchSubsidies();
    fetchFarmerListings();
  }, [district]);

  // Handle calculator dynamics
  useEffect(() => {
    // KCC Loan amount is calculated based on simple formula: ₹37,000 per acre
    setCalculatedLoan(Math.round(landAcres * 37000));
  }, [landAcres]);

  // Simulated scan animation interval for disease predictor
  useEffect(() => {
    let interval: any;
    if (diseaseLoading) {
      interval = setInterval(() => {
        setScannedLineY((prev) => (prev >= 170 ? 0 : prev + 10));
      }, 80);
    } else {
      setScannedLineY(0);
    }
    return () => clearInterval(interval);
  }, [diseaseLoading]);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`/api/weather-advisory?district=${district}`);
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (e) {
      console.error("Error fetching weather advisory:", e);
    }
  };

  const fetchMarketPrices = async () => {
    try {
      const response = await fetch(`/api/market/prices?district=${district}`);
      if (response.ok) {
        const data = await response.json();
        setMarket(data);
      }
    } catch (e) {
      console.error("Error fetching market prices:", e);
    }
  };

  const fetchSubsidies = async () => {
    try {
      const response = await fetch("/api/finance/subsidies");
      if (response.ok) {
        const data = await response.json();
        setSubsidies(data);
      }
    } catch (e) {
      console.error("Error loading subsidies:", e);
    }
  };

  const fetchFarmerListings = async () => {
    try {
      const response = await fetch(`/api/market/listings?district=${district}`);
      if (response.ok) {
        const data = await response.json();
        setFarmerListings(data.listings || []);
      }
    } catch (e) {
      console.error("Error loading listings:", e);
    }
  };

  const handleCreateListing = async () => {
    if (!sellForm.farmerName || !sellForm.cropName || !sellForm.quantity || !sellForm.pricePerQuintal) {
      setSellFormMsg("कृपया सभी आवश्यक फील्ड भरें।");
      return;
    }
    try {
      const response = await fetch("/api/market/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellForm,
          location: district,
          pricePerQuintal: parseInt(sellForm.pricePerQuintal)
        })
      });
      if (response.ok) {
        setSellFormMsg("आपकी लिस्टिंग सफलतापूर्वक बनाई गई!");
        setSellForm({ farmerName: "", phone: "", cropName: "", quantity: "", pricePerQuintal: "", description: "" });
        fetchFarmerListings();
        setTimeout(() => setSellFormMsg(""), 3000);
      }
    } catch (e) {
      setSellFormMsg("लिस्टिंग बनाने में त्रुटि। पुनः प्रयास करें।");
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await fetch(`/api/market/listings/${id}`, { method: "DELETE" });
      fetchFarmerListings();
    } catch (e) {
      console.error("Error deleting listing:", e);
    }
  };

  // Voice-guided sell form
  const startSellVoice = () => {
    setSellVoiceStep(0);
    setSellVoiceActive(true);
    setSellFormMsg("");
    speakText(SELL_QUESTIONS[0]);
    setTimeout(() => {
      startListening((text) => handleSellVoiceAnswer(0, text));
    }, 1500);
  };

  const handleSellVoiceAnswer = (step: number, answer: string) => {
    const field = SELL_FIELDS[step];
    let processedAnswer = answer;

    // Clean up the answer
    if (field === "pricePerQuintal") {
      const nums = answer.match(/\d+/);
      processedAnswer = nums ? nums[0] : answer;
    }
    if (field === "phone") {
      const nums = answer.replace(/\s/g, "").match(/\d{10}/);
      processedAnswer = nums ? nums[0] : answer.replace(/\s/g, "");
    }

    setSellForm(prev => ({ ...prev, [field]: processedAnswer }));

    const nextStep = step + 1;
    if (nextStep < SELL_QUESTIONS.length) {
      setSellVoiceStep(nextStep);
      speakText(SELL_QUESTIONS[nextStep]);
      setTimeout(() => {
        startListening((text) => handleSellVoiceAnswer(nextStep, text));
      }, 1500);
    } else {
      setSellVoiceStep(-1);
      setSellVoiceActive(false);
      speakText("सभी जानकारी भर दी गई है। अब लिस्टिंग बनाने के लिए बटन दबाएं।");
      setSellFormMsg("आवाज़ से सभी फील्ड भर दिए गए हैं!");
    }
  };

  // disease predictive scan action
  const handleDiseasePrediction = async (imageType: "tomato" | "potato" | "uploaded", customImageSrc?: string) => {
    setDiseaseLoading(true);
    setDiseaseResult(null);
    setDiseaseError(null);

    let base64Img = "";
    if (imageType === "tomato") {
      base64Img = DEMO_DISEASED_TOMATO;
      setSelectedImage(DEMO_DISEASED_TOMATO);
    } else if (imageType === "potato") {
      base64Img = DEMO_POTATO_LEAF;
      setSelectedImage(DEMO_POTATO_LEAF);
    } else if (customImageSrc) {
      base64Img = customImageSrc;
      setSelectedImage(customImageSrc);
    }

    try {
      const response = await fetch("/api/disease/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Img,
          cropName: imageType === "tomato" ? "Tomato (टमाटर)" : "Potato (आलू)",
          symptoms: symptomsInput || "काले धब्बे और सूखी पत्तियां"
        })
      });

      if (response.ok) {
        const parsed = await response.json();
        // Artificial delay for robust scanning visualizer
        setTimeout(() => {
          setDiseaseResult(parsed);
          setDiseaseLoading(false);
        }, 1800);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || "Analysis failed");
      }
    } catch (err: any) {
      console.error(err);
      setDiseaseLoading(false);
      setDiseaseError(err.message || "रोग पहचान सेवा वर्तमान में अनुपलब्ध है। (Prediction service is unavailable)");
    }
  };

  // Triggering the Voice Chat Consult Dialog
  const handleVoiceQuery = async (presetText?: string) => {
    if (presetText) {
      // Preset clicked - send directly
      await sendVoiceQuery(presetText);
    } else {
      // Start listening for user's voice
      setVoiceQuery("");
      setVoiceResponseText("");
      setIsVoiceActive(true);
      startListening(async (transcript) => {
        setVoiceQuery(transcript);
        await sendVoiceQuery(transcript);
      });
    }
  };

  const sendVoiceQuery = async (text: string) => {
    setVoiceQuery(text);
    setIsVoiceActive(true);
    setVoiceStateMessage("AI जवाब तैयार हो रहा है... (Processing)");
    setVoiceResponseText("");

    try {
      const response = await fetch("/api/voice-consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          language: voiceLanguage
        })
      });

      if (response.ok) {
        const result = await response.json();
        setVoiceStateMessage("🔊 AI बोल रहा है... (Speaking)");
        setVoiceResponseText(result.answer);
        speakText(result.answer);
      }
    } catch (err) {
      console.error(err);
      setVoiceStateMessage("त्रुटि हुई।");
      const errorMsg = "माफ कीजिये, सर्वर से जुड़ने में गड़बड़ हुई। कृपया इंटरनेट कनेक्शन की जांच करें।";
      setVoiceResponseText(errorMsg);
      speakText(errorMsg);
    }
  };

  // Simulate file upload (converts uploaded file to base64)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        handleDiseasePrediction("uploaded", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleCompleteLesson = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons(completedLessons.filter(id => id !== lessonId));
    } else {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  // Generate dynamic marquee text for real-time rates
  const getMarqueeText = () => {
    if (!market || !market.prices) {
      return "🧅 Onion ₹2,340/कुंतल ↑12% · 🍅 Tomato ₹890/कुंतल ↓5% · 🌾 Wheat ₹2,150/कुंतल → · 🌱 Gram ₹5,410/कुंतल ↑3%";
    }
    return market.prices.map(crop => (
      `${crop.emoji} ${crop.name.split(" — ")[0]} ₹${crop.price}/कुंतल ${crop.trend === 'up' ? '↑' : crop.trend === 'down' ? '↓' : '→'}${crop.change !== 0 ? Math.abs(crop.change) + '%' : ''}`
    )).join(" · ");
  };

  return (
    <div className="h-screen bg-[#111c11] flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden select-none">
      
      {/* 1. Global Splash Overlay Wrapper */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Main Container Framing the Farmer Phone View */}
      <div 
        id="phone-device-wrapper"
        className="w-full max-w-md h-full sm:h-[850px] bg-[#F8F5F0] rounded-none sm:rounded-[36px] border-0 sm:border-[8px] border-[#1B4332] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-[#1A1A1A] font-sans"
      >
        {/* Real App Header replacing the mock/larping status bar */}
        <div id="app-brand-header" className="bg-[#1B4332] text-white px-5 py-3 flex justify-between items-center z-10 border-b border-emerald-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 flex items-center justify-center text-sm font-bold border border-emerald-500/20 shadow-xs">
              🌾
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide font-sans text-white leading-tight">किसान वाणी</h1>
              <p className="text-[9px] text-emerald-300 font-medium">KisanVaani • लाइव सहायता सक्रिय</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono bg-emerald-950 text-yellow-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              लाइव
            </span>
          </div>
        </div>

        {/* Global Banner for extreme sunlight high contrast mode toggle */}
        <div id="contrast-header-banner" className="bg-emerald-950 text-white text-[11px] px-4 py-1.5 flex justify-between items-center z-10">
          <span className="opacity-80 flex items-center gap-1 font-sans">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            तेज धूप में स्पष्ट पढ़ने के लिए हाई-कॉन्ट्रास्ट सक्षम करें
          </span>
          <button 
            id="contrast-mode-toggle"
            onClick={() => setIsHighContrast(!isHighContrast)}
            className="bg-amber-500 hover:bg-amber-600 font-extrabold text-black px-2 py-0.5 rounded text-[10px]"
          >
            {isHighContrast ? "लाइट मोड" : "हाई-कॉन्ट्रास्ट"}
          </button>
        </div>

        {/* Screen Dynamic content body scroll container */}
        <div 
          id="screen-content-area"
          className={`flex-1 overflow-y-auto scrollbar-hide flex flex-col pb-28 ${isHighContrast ? "bg-white font-extrabold text-black" : "bg-[#F8F5F0]"}`}
        >
          {activeTab === "home" && (
            <HomeScreen
              district={district}
              weatherTemp={weather?.temp ?? 32}
              weatherRainSoon={weather?.rainSoon ?? true}
              mandiMarqueeText={getMarqueeText()}
              isHighContrast={isHighContrast}
              onSelectFeature={(tab) => setActiveTab(tab)}
              onActivateVoice={() => {
                setIsVoiceActive(true);
                setVoiceResponseText("");
                setVoiceQuery("");
                setVoiceStateMessage("अपनी आवाज़ में सवाल पूछें या नीचे से चुनें");
              }}
              isVoiceActive={isVoiceActive}
            />
          )}

          {/* ----------------- SCREEN: DISEASE IDENTIFICATION ----------------- */}
          {activeTab === "disease" && (
            <div id="disease-tab-container" className="p-5 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-750" />
                  <h2 className="text-xl font-bold font-sans">फसल रोग पहचान (Crop Disease ID)</h2>
                </div>
                <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  // POST /api/disease/predict
                </span>
              </div>

              {/* Instructions and preset diagnostic simulator buttons */}
              <div className="bg-orange-50/60 rounded-2xl p-4.5 border border-amber-200 text-amber-950 text-xs mb-4">
                <p className="font-bold flex items-center gap-1.5 text-slate-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  त्वरित परीक्षण के लिए सैंपल चुनें या असली फोटो अपलोड करें:
                </p>
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <button 
                    onClick={() => handleDiseasePrediction("tomato")}
                    className="bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3 text-left flex items-center gap-2 transition-shadow shadow-xs"
                  >
                    <span className="text-lg">🍅</span>
                    <div>
                      <p className="font-bold text-slate-900">टमाटर का रोग</p>
                      <p className="text-[9px] text-slate-500">Early Blight</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleDiseasePrediction("potato")}
                    className="bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3 text-left flex items-center gap-2 transition-shadow shadow-xs"
                  >
                    <span className="text-lg">🥔</span>
                    <div>
                      <p className="font-bold text-slate-900">आलू की पत्ती</p>
                      <p className="text-[9px] text-slate-500">Powdery Leaf</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Large Dashed border upload zone */}
              <div className="bg-white rounded-3xl p-5 border-2 border-dashed border-emerald-400 text-center flex flex-col items-center justify-center min-h-[190px] relative mb-5">
                {selectedImage ? (
                  <div className="w-full relative overflow-hidden rounded-xl bg-slate-900 h-44 flex items-center justify-center">
                    <img 
                      src={selectedImage} 
                      className="w-full h-full object-cover" 
                      alt="Crop disease preview" 
                    />
                    
                    {/* Sweep scanner line animation */}
                    {diseaseLoading && (
                      <div 
                        className="absolute left-0 right-0 h-1.5 bg-green-400 shadow-[0_0_10px_#4ade80] pointer-events-none transition-all duration-30s"
                        style={{ top: `${scannedLineY}px` }}
                      />
                    )}

                    <button 
                      onClick={() => {
                        setSelectedImage(null);
                        setDiseaseResult(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 text-xs font-bold"
                    >
                      ✕ हटाएँ
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 mb-2">
                      <Camera className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">पत्तियों या रोगग्रस्त भाग की साफ फोटो लें</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">कैमरा या गैलरी विकल्प चुनें</p>
                    
                    <div className="flex items-center gap-2.5 mt-4">
                      <label 
                        htmlFor="camera-input-elem" 
                        className="bg-emerald-750 hover:bg-emerald-850 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        📷 Camera
                      </label>
                      <input 
                        type="file" 
                        id="camera-input-elem" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />

                      <label 
                        htmlFor="file-input-elem" 
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Image className="w-3.5 h-3.5" />
                        🖼️ Gallery
                      </label>
                      <input 
                        type="file" 
                        id="file-input-elem" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Symptom verbal input descriptive area */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
                <label className="text-[11px] uppercase tracking-widest text-slate-400 font-bold block mb-1">
                  मुखर विवरण (Optional symptoms)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    placeholder="जैसे: पत्ती सूख रही है, काले धब्बे हैं आदि..."
                    className="flex-1 bg-[#F8F5F0] border-0 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                  />
                  <button 
                    onClick={() => handleDiseasePrediction(selectedImage ? "uploaded" : "tomato")}
                    className="bg-emerald-700 hover:bg-emerald-850 text-white px-4 rounded-xl text-xs font-bold font-sans"
                  >
                    AI जानें
                  </button>
                </div>
              </div>

              {/* Loading Banner overlay for analysis */}
              {diseaseLoading && (
                <div className="bg-[#1A2E1A] text-white p-4 rounded-2xl flex items-center gap-3 animate-pulse border border-emerald-900 my-2">
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-300">AI विश्लेषण हो रहा है...</p>
                    <p className="text-[10px] text-slate-400 font-mono">Gemini Vision AI — छवि विश्लेषण जारी है</p>
                  </div>
                </div>
              )}

              {/* Disease analysis error message display */}
              {diseaseError && (
                <div className="bg-rose-50 text-rose-950 p-4 rounded-2xl border border-rose-200 text-xs my-2 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">विश्लेषण त्रुटि (Analysis Error)</p>
                    <p className="mt-0.5 opacity-90">{diseaseError}</p>
                  </div>
                </div>
              )}

              {/* AI Diagnostic Result Card output details */}
              {diseaseResult && (
                <div id="pathology-result-card" className="bg-white rounded-3xl border-l-[8px] border-emerald-600 p-5 shadow-md mt-2">
                  {/* Plant & Disease Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {diseaseResult.plantName && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          🌱 {diseaseResult.plantName}
                        </span>
                      )}
                      <h4 className="text-lg font-extrabold text-slate-900 mt-1 font-sans">
                        {diseaseResult.disease}
                      </h4>
                      {diseaseResult.diseaseNameEn && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{diseaseResult.diseaseNameEn}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-green-100 text-green-900 font-bold text-[11px] px-2.5 py-1 rounded-xl">
                        {diseaseResult.confidence || "85%"}
                      </span>
                      {diseaseResult.severity && (
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded-lg ${
                          diseaseResult.severity === 'high' ? 'bg-red-100 text-red-800' :
                          diseaseResult.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {diseaseResult.severity === 'high' ? '⚠️ गंभीर' :
                           diseaseResult.severity === 'medium' ? '🟡 मध्यम' : '🟢 हल्का'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Affected Parts */}
                  {diseaseResult.affectedParts && (
                    <div className="flex items-center gap-1.5 mb-3 text-[10px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <span className="font-bold">प्रभावित भाग:</span> {diseaseResult.affectedParts}
                    </div>
                  )}

                  {/* Detailed Analysis */}
                  <p className="text-xs text-slate-600 italic bg-[#F8F5F0] p-3 rounded-xl mb-4 font-sans leading-relaxed">
                    "{diseaseResult.detailedAnalysis || diseaseResult.analysisText}"
                  </p>

                  {/* Organic Remedies */}
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    फसल संजीवनी: जैविक उपचार
                  </h5>

                  <div className="space-y-2">
                    {diseaseResult.remedies?.map((rem, k) => (
                      <div key={k} className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs">
                        <strong className="text-emerald-950 font-bold block mb-0.5">🌱 {rem.name}</strong>
                        <span className="text-slate-600 leading-tight">{rem.instruction}</span>
                      </div>
                    ))}
                  </div>

                  {/* Precautions */}
                  {diseaseResult.precautions && diseaseResult.precautions.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        ⚠️ सावधानियाँ (Precautions)
                      </h5>
                      <div className="space-y-1.5">
                        {diseaseResult.precautions.map((precaution, k) => (
                          <div key={k} className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-[11px] text-amber-900 font-sans flex items-start gap-1.5">
                            <span className="text-amber-600 shrink-0">•</span>
                            {precaution}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prevention Tips */}
                  {diseaseResult.preventionTips && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-950 rounded-xl text-[11px] font-medium border border-blue-100">
                      <span className="font-bold">🛡️ भविष्य में रोकथाम:</span> {diseaseResult.preventionTips}
                    </div>
                  )}

                  {/* Trust warning if photo is blurry */}
                  <div className="mt-4 p-3 bg-red-50 text-red-950 rounded-xl text-[10px] font-medium border border-red-100">
                    ⚠️ बेहतर परिणाम के लिए: तीखी धूप में पत्ती की साफ ऊपरी फोटो भेजें। स्पष्ट फोटो से अधिक सटीक निदान होगा।
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----------------- SCREEN: MARKET PRICES ----------------- */}
          {activeTab === "market" && (
            <div id="mandi-tab-container" className="p-5 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-indigo-50">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-700" />
                  <h2 className="text-xl font-bold font-sans">मंडी बाज़ार (Mandi Market)</h2>
                </div>
                {/* Location select dropdown */}
                <select 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="bg-indigo-50 text-indigo-900 font-bold text-xs py-1 px-2.5 rounded-lg border-0"
                >
                  <option value="Nashik">Nashik (नाशिक)</option>
                  <option value="Nagpur">Nagpur (नागपुर)</option>
                  <option value="Pune">Pune (पुणे)</option>
                  <option value="Satara">Satara (सातारा)</option>
                  <option value="Ahmednagar">Ahmednagar (अहमदनगर)</option>
                  <option value="Solapur">Solapur (सोलापुर)</option>
                </select>
              </div>

              {/* Sub-tabs: Prices | Sell */}
              <div className="bg-white p-1 rounded-2xl flex border border-indigo-100 mb-4 select-none">
                <button 
                  onClick={() => setMarketSubTab("prices")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl text-center cursor-pointer ${
                    marketSubTab === "prices" ? "bg-indigo-700 text-white" : "text-slate-600"
                  }`}
                >
                  📊 मंडी भाव (Prices)
                </button>
                <button 
                  onClick={() => { setMarketSubTab("sell"); fetchFarmerListings(); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl text-center cursor-pointer ${
                    marketSubTab === "sell" ? "bg-emerald-700 text-white" : "text-slate-600"
                  }`}
                >
                  🛒 बेचें (Sell Produce)
                </button>
              </div>

              {/* SUBTAB: Market Prices */}
              {marketSubTab === "prices" && (
                <>
                  {/* Search input field */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={marketSearch}
                      onChange={(e) => setMarketSearch(e.target.value)}
                      placeholder="फसल का नाम खोजें (जैसे: प्याज, लहसुन, गेहूं)..."
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-xs focus:ring-1 focus:ring-indigo-500 shadow-xs font-sans text-slate-900"
                    />
                  </div>

                  {/* Crop category choice horizontal capsules */}
                  <div className="flex gap-1.5 overflow-x-auto pb-3 select-none">
                    {["All", "अनाज", "सब्ज़ी", "फल", "दलहन"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMarketCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          marketCategory === cat
                            ? "bg-indigo-700 text-white"
                            : "bg-white text-slate-700 border border-slate-100 shadow-xs"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Price card listing vertical cards */}
                  <div className="space-y-2.5 mt-1 flex-1">
                    {market?.prices
                      .filter((crop) => {
                        const matchCategory = marketCategory === "All" || crop.category === marketCategory;
                        const matchText = crop.name.toLowerCase().includes(marketSearch.toLowerCase());
                        return matchCategory && matchText;
                      })
                      .map((crop) => {
                        const isOpen = expandedCropId === crop.id;
                        return (
                          <div 
                            key={crop.id}
                            className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                              isOpen ? "border-indigo-400 shadow-md" : "border-slate-50 shadow-xs hover:border-slate-200"
                            }`}
                          >
                            {/* Principal Summary row */}
                            <div 
                              onClick={() => setExpandedCropId(isOpen ? null : crop.id)}
                              className="p-4 flex justify-between items-center cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-3xl p-1 bg-slate-50 rounded-xl">{crop.emoji}</span>
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900 font-sans">{crop.name}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <span>📍 {crop.mandi}</span>
                                    <span>•</span>
                                    <span>ताज़ा भाव</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right flex flex-col items-end">
                                <span className="font-bold text-base text-indigo-950 font-sans">
                                  ₹{crop.price.toLocaleString("hi-IN")}/कुंतल
                                </span>
                                
                                {/* Trend chip badge */}
                                <span className={`inline-flex items-center gap-0.5 text-[11px] font-black mt-1 px-2 py-0.5 rounded-full ${
                                  crop.trend === 'up' 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : crop.trend === 'down' 
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-100 text-slate-700"
                                }`}>
                                  {crop.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-800" />}
                                  {crop.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-rose-800" />}
                                  <span>{crop.change !== 0 ? `${crop.change}%` : "स्थिर"}</span>
                                </span>
                              </div>
                            </div>

                            {/* Expandable Sparkline and prediction bottom row */}
                            {isOpen && (
                              <div className="px-4 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                                <div className="my-3">
                                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                                    7-दिवसीय मूल्य उतार-चढ़ाव (7-Day Sparkline)
                                  </p>
                                  <div className="w-full bg-white border border-slate-100 rounded-xl p-3 h-24 flex items-center justify-center relative">
                                    <svg viewBox="0 0 100 30" className="w-full h-full text-indigo-500 stroke-indigo-600 fill-none stroke-[2.5]">
                                      <path d="M 0,25 Q 15,20 30,10 T 60,18 T 100,5" className="stroke-indigo-600" />
                                      <path d="M 0,25 Q 15,20 30,10 T 60,18 T 100,5 L 100,30 L 0,30 Z" className="fill-indigo-100/30 stroke-none" />
                                      <circle cx="100" cy="5" r="2.5" className="fill-indigo-700 stroke-white stroke-2" />
                                    </svg>
                                    <div className="absolute bottom-1 left-2 text-[8px] text-slate-400 font-mono">10 जून</div>
                                    <div className="absolute bottom-1 right-2 text-[8px] text-indigo-700 font-mono font-bold">17 जून (ताज़ा)</div>
                                  </div>
                                </div>

                                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
                                  <div className="flex items-center gap-1.5 text-indigo-950 font-bold mb-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    AI मूल्य भविष्यवाणी (15-Day Trend Analysis)
                                  </div>
                                  <p className="text-slate-700 leading-relaxed font-sans">{crop.prediction}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              {/* SUBTAB: Sell Your Produce */}
              {marketSubTab === "sell" && (
                <div className="space-y-4 flex-1">
                  {/* Sell Form Card */}
                  <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm">
                    <h3 className="font-bold text-sm text-emerald-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">🌾</span> अपनी फसल बेचें (Sell Your Produce)
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3">अपनी फसल की जानकारी भरें और सीधे खरीददारों से जुड़ें।</p>

                    {/* Voice Input Button */}
                    <button
                      onClick={sellVoiceActive ? () => { setSellVoiceActive(false); setSellVoiceStep(-1); stopListening(); stopTts(); } : startSellVoice}
                      className={`w-full mb-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        sellVoiceActive 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      {sellVoiceActive 
                        ? `🎤 प्रश्न ${sellVoiceStep + 1}/${SELL_QUESTIONS.length} — बोलें... (रोकें)` 
                        : "🎤 आवाज़ से भरें (Voice Fill Form)"}
                    </button>

                    {sellVoiceActive && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-center">
                        <p className="text-[11px] text-emerald-800 font-bold">
                          {SELL_QUESTIONS[sellVoiceStep]}
                        </p>
                        <p className="text-[9px] text-emerald-600 mt-1">
                          {isListening ? "🎤 सुन रहे हैं... बोलें" : "⏳ जवाब प्रोसेस हो रहा है..."}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">किसान का नाम *</label>
                        <input
                          type="text"
                          value={sellForm.farmerName}
                          onChange={(e) => setSellForm({ ...sellForm, farmerName: e.target.value })}
                          placeholder="जैसे: रामेश्वर पाटिल"
                          className="w-full bg-[#F8F5F0] border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">फ़ोन नंबर *</label>
                        <input
                          type="tel"
                          value={sellForm.phone}
                          onChange={(e) => setSellForm({ ...sellForm, phone: e.target.value })}
                          placeholder="जैसे: 9876543210"
                          className="w-full bg-[#F8F5F0] border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">फसल का नाम *</label>
                        <input
                          type="text"
                          value={sellForm.cropName}
                          onChange={(e) => setSellForm({ ...sellForm, cropName: e.target.value })}
                          placeholder="जैसे: गेहूं, प्याज, टमाटर"
                          className="w-full bg-[#F8F5F0] border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">मात्रा (कुंतल) *</label>
                          <input
                            type="text"
                            value={sellForm.quantity}
                            onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                            placeholder="जैसे: 10 कुंतल"
                            className="w-full bg-[#F8F5F0] border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">दाम प्रति कुंतल (₹) *</label>
                          <input
                            type="number"
                            value={sellForm.pricePerQuintal}
                            onChange={(e) => setSellForm({ ...sellForm, pricePerQuintal: e.target.value })}
                            placeholder="जैसे: 2200"
                            className="w-full bg-[#F8F5F0] border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">अतिरिक्त जानकारी (Optional)</label>
                        <input
                          type="text"
                          value={sellForm.description}
                          onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })}
                          placeholder="जैसे: जैविक गेहूं, ताज़ा कटाई"
                          className="w-full bg-[#F8F5F0] border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-900"
                        />
                      </div>
                    </div>

                    {sellFormMsg && (
                      <div className={`mt-3 p-2.5 rounded-xl text-xs font-bold text-center ${
                        sellFormMsg.includes("सफल") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}>
                        {sellFormMsg}
                      </div>
                    )}

                    <button
                      onClick={handleCreateListing}
                      className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors"
                    >
                      ✅ लिस्टिंग बनाएं (Create Listing)
                    </button>
                  </div>

                  {/* Active Farmer Listings */}
                  <div>
                    <h3 className="text-xs text-slate-500 font-extrabold uppercase tracking-widest mb-2.5 flex items-center gap-1">
                      🛒 {district} में बिक्री के लिए उपलब्ध (Available for Sale)
                    </h3>
                    {farmerListings.length === 0 ? (
                      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
                        <p className="text-sm text-slate-400">अभी कोई लिस्टिंग नहीं है।</p>
                        <p className="text-[10px] text-slate-300 mt-1">पहली लिस्टिंग बनाकर शुरुआत करें!</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {farmerListings.map((listing) => (
                          <div key={listing.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold py-0.5 px-2 rounded">
                                    {listing.cropName}
                                  </span>
                                  <span className="text-[9px] text-slate-400">📍 {listing.location}</span>
                                </div>
                                <h4 className="font-extrabold text-sm text-slate-900 font-sans">{listing.farmerName}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">📞 {listing.phone}</p>
                                {listing.description && (
                                  <p className="text-[10px] text-slate-400 mt-1 italic">{listing.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-base text-indigo-950 font-sans">
                                  ₹{listing.pricePerQuintal.toLocaleString("hi-IN")}/कुंतल
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">📦 {listing.quantity}</p>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="mt-2 text-[9px] text-rose-500 hover:text-rose-700 font-bold"
                                >
                                  ✕ हटाएँ
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----------------- SCREEN: WEATHER & ADVISORIES ----------------- */}
          {activeTab === "learn" && (
            <div id="learning-and-weather-tab" className="p-5 flex-1 flex flex-col">
              {/* Selector sub-tabs to switch between Weather and Education */}
              <div className="bg-white p-1 rounded-2xl flex border border-emerald-100 mb-4 select-none">
                <button 
                  onClick={() => setWeatherHourlyIndex(0)} 
                  className={`flex-1 py-2 text-xs font-bold rounded-xl text-center cursor-pointer ${
                    weatherHourlyIndex === 0 ? "bg-emerald-700 text-white" : "text-slate-600"
                  }`}
                >
                  ⛅ मौसम व कृषि सलाह
                </button>
                <button 
                  onClick={() => setWeatherHourlyIndex(1)} 
                  className={`flex-1 py-2 text-xs font-bold rounded-xl text-center cursor-pointer ${
                    weatherHourlyIndex === 1 ? "bg-emerald-700 text-white" : "text-slate-600"
                  }`}
                >
                  🎓 ZBNF प्राकृतिक स्कूल
                </button>
              </div>

              {/* SUBTAB 1: Weather Advices */}
              {weatherHourlyIndex === 0 && (
                <div id="weather-section-scroll" className="space-y-4 flex-1">
                  
                  {/* Big current card */}
                  <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-sm relative">
                    <p className="text-xs uppercase tracking-widest text-emerald-200 opacity-90 font-bold mb-1">
                      मौसम विभाग चेतावनी • {district}
                    </p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold">{weather?.temp ?? 31.4}°C</span>
                          <span className="text-sm">धूप खिली है</span>
                        </div>
                        <p className="text-xs text-emerald-150 mt-1 opacity-80 font-sans">वाष्पीकरण: सामान्य | हवा: {weather?.wind ?? 12.8} किमी/घंटा</p>
                      </div>
                      <Sun className="w-14 h-14 text-amber-400 fill-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
                    </div>

                    <div className="mt-4 bg-amber-500 text-black px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center shadow-xs">
                      <AlertCircle className="w-5 h-5 text-black animate-bounce shrink-0 mr-2" />
                      <div className="flex flex-col">
                        <span>{weather?.rainWarning || "2 दिनों में भारी बारिश की चेतावनी!"}</span>
                        <span className="text-[10px] text-amber-900 font-extrabold mt-0.5 leading-none">Rain in 2 days</span>
                      </div>
                    </div>
                  </div>

                  {/* 7-day horizontal scroll cards forecasting */}
                  <div>
                    <h3 className="text-xs text-slate-500 font-extrabold uppercase tracking-widest mb-2">
                      7 दिवसीय पूर्वानुमान (7-Day Forecast)
                    </h3>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide select-none relative">
                      {weather?.daily?.time?.map((tStr, idx) => {
                        const dateObj = new Date(tStr);
                        const labelDay = dateObj.toLocaleDateString("hi-IN", { weekday: "short" });
                        const maxTemp = weather?.daily?.temperature_2m_max[idx] ?? 32;
                        const minTemp = weather?.daily?.temperature_2m_min[idx] ?? 23;
                        const rainChance = weather?.daily?.precipitation_probability_max[idx] ?? 10;
                        return (
                          <div 
                            key={idx} 
                            className="bg-white rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center min-w-[76px] text-center shadow-xs"
                          >
                            <span className="text-[11px] font-bold text-slate-500">{labelDay}</span>
                            <Sun className="w-5 h-5 text-amber-500 mt-1.5 mb-1" />
                            <span className="text-xs font-extrabold text-slate-900">{maxTemp}°/{minTemp}°</span>
                            <span className="text-[9px] bg-sky-50 text-sky-800 font-bold px-1 py-0.2 rounded mt-1.5 flex items-center gap-0.5">
                              💧 {rainChance}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Farming advisories listed with amber warning left border */}
                  <div>
                    <h3 className="text-xs text-slate-500 font-extrabold uppercase tracking-widest mb-2.5 flex items-center gap-1">
                      🌱 एग्रो-मौसम परामर्श (AI Generated Advisories)
                    </h3>
                    
                    <div className="space-y-2.5">
                      {weather?.recommendations?.map((adv, idx) => (
                        <div 
                          key={adv.id || idx}
                          className="bg-white rounded-2xl border-l-4 border-amber-500 p-4 shadow-xs"
                        >
                          <h4 className="font-extrabold text-sm text-[#2D6A4F] font-sans">{adv.title}</h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans">{adv.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* SUBTAB 2: ZBNF Training School lessons lists */}
              {weatherHourlyIndex === 1 && (
                <div id="school-section" className="space-y-4 flex-1">
                  {/* Featured Banner lesson with progress bar 60% complete */}
                  <div className="bg-[#1A2E1A] text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-900/40 rounded-full" />
                    
                    <span className="bg-amber-500 text-black font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                      मुख्य पाठ (Featured Lesson)
                    </span>
                    <h3 className="text-lg font-bold mt-2 font-sans">ZBNF — ज़ीरो बजट प्राकृतिक कृषि</h3>
                    <p className="text-xs text-emerald-200/90 mt-1 font-sans">संस्थापक डॉ सुभाष पालेकर के मुख्य सिद्धांत</p>

                    <div className="mt-5 flex justify-between items-center">
                      <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                        ⏱️ अवधि: 4:32 मिनट
                      </span>
                      <button 
                        onClick={() => {
                          const subLesson = lessonsDatabase[0];
                          setSelectedZbnfLesson(subLesson);
                          setIsPlayingAudio(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
                      >
                        ▶️ प्ले वीडियो
                      </button>
                    </div>

                    {/* Progress slider bar 60% complete */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-[10px] text-emerald-200 mb-1">
                        <span>कोर्स प्रगति</span>
                        <span>60% पूर्ण</span>
                      </div>
                      <div className="w-full bg-emerald-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-yellow-400 h-full w-[60%]" />
                      </div>
                    </div>
                  </div>

                  {/* Horizontal lessons category filter chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                    {["सभी सामग्री", "भूमि संस्कार", "अमृत खाद", "सिंचाई", "कीट नियंत्रण"].map((pill) => (
                      <span key={pill} className="bg-white text-slate-700 text-[11px] font-bold py-1 px-3.5 rounded-full border border-slate-100 shadow-xs cursor-pointer hover:bg-emerald-50">
                        {pill}
                      </span>
                    ))}
                  </div>

                  {/* Lesson listing with active waveform audio icon indicators */}
                  <div className="space-y-2.5 mt-1">
                    {lessonsDatabase.map((lesson) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      return (
                        <div 
                          key={lesson.id}
                          className="bg-white hover:border-emerald-300 transition-all rounded-2xl p-4 border border-slate-100 shadow-xs flex justify-between items-center gap-3 relative"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold py-0.5 px-2 rounded">
                                {lesson.category}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium tracking-wide flex items-center gap-0.5">
                                🎙️ {lesson.speaker}
                              </span>
                            </div>
                            
                            <h4 className="font-extrabold text-xs text-slate-900 leading-tight block mb-0.5">
                              {lesson.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{lesson.description}</p>
                            
                            <div className="flex items-center gap-3.5 mt-2.5 text-[10px] font-mono text-slate-400">
                              <span>⏳ {lesson.duration}min</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">{lesson.difficulty}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-2 min-w-[50px]">
                            {/* Waveform / Completed state */}
                            <button 
                              onClick={() => setSelectedZbnfLesson(lesson)}
                              className="w-[36px] h-[36px] rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                            >
                              <Volume2 className="w-4 h-4 animate-bounce" />
                            </button>

                            <button 
                              onClick={() => handleToggleCompleteLesson(lesson.id)}
                              className={`p-1.5 rounded-full text-[9px] font-bold ${
                                isCompleted ? "bg-green-100 text-green-800" : "bg-slate-50 text-slate-400"
                              }`}
                            >
                              {isCompleted ? "✓ पूर्ण" : "बाकी है"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ----------------- SCREEN: FINANCIALS & PROFILE ----------------- */}
          {activeTab === "profile" && (
            <div id="profile-wealth-tab" className="p-5 flex-1 flex flex-col space-y-4">
              
              {/* Farmer Profile badge avatar banner */}
              <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 font-sans text-xl font-extrabold flex items-center justify-center text-emerald-950 border-2 border-white shadow-sm shadow-emerald-900/10">
                  RP
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-extrabold text-slate-900 text-base font-sans">Ramesh Patil</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold py-0.2 px-1.5 rounded-full">प्रगतिशील</span>
                  </div>
                  <p className="text-xs text-slate-500">स्थान: सिन्नर, नासिक (महाराष्ट्र)</p>
                  
                  {/* tag tags of crops */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    <span className="bg-amber-50 text-amber-800 text-[9px] font-bold py-0.5 px-2 rounded-full">🌾 Wheat</span>
                    <span className="bg-amber-50 text-amber-800 text-[9px] font-bold py-0.5 px-2 rounded-full">🧅 Onion</span>
                    <span className="bg-amber-50 text-amber-800 text-[9px] font-bold py-0.5 px-2 rounded-full">🍅 Tomato</span>
                  </div>
                </div>
              </div>

              {/* Subsidies government schemes dynamic checklist section */}
              <div>
                <h3 className="text-xs text-slate-500 font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1">
                  🏛️ सरकारी योजना पात्रता (PM-Kisan Status)
                </h3>

                <div className="space-y-2.5">
                  {subsidies?.schemes.map((scheme) => (
                    <div key={scheme.id} className="bg-white rounded-2xl p-4 border border-slate-150 flex justify-between items-start shadow-xs">
                      <div className="flex-1 pr-3">
                        <h4 className="font-extrabold text-sm text-slate-900 font-sans">{scheme.name}</h4>
                        <p className="text-xs text-emerald-700 font-bold mt-1">लाभ: {scheme.benefit}</p>
                        <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">{scheme.description}</p>
                      </div>

                      <div className="text-right flex flex-col items-end justify-between min-h-[72px]">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          scheme.statusColor === "success" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"
                        }`}>
                          {scheme.eligibility}
                        </span>

                        <button 
                          onClick={() => alert(`${scheme.name} के लिए ऑनलाइन फॉर्म प्रस्तुत किया गया है।`)}
                          className="bg-emerald-700 hover:bg-emerald-900 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg mt-3"
                        >
                          आवेदन करें
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive KCC Loan Calculator Sliders and acres calculation */}
              <div className="bg-emerald-950 text-white rounded-3xl p-5 shadow-sm border border-emerald-900 relative">
                <span className="absolute top-3 right-4 text-[9px] text-emerald-400 font-mono">
                  // KCC Interest Rate: 4% Subsidized
                </span>
                <h4 className="text-base font-bold font-sans text-amber-400 flex items-center gap-1">
                  🌾 KCC Loan – तत्काल ऋण संगणक (Estimator)
                </h4>
                <p className="text-xs text-slate-300 mt-1 mb-4 leading-normal font-sans">
                  अपनी कृषि भूमि का क्षेत्रफल दर्ज कर संभावित ऋण राशि प्राप्त करें।
                </p>

                {/* Input field */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-xs mb-1.5 text-slate-200">
                    <label className="font-bold">कुल कृषि भूमि (Acres)</label>
                    <span className="font-bold text-amber-400 text-sm bg-black/30 px-2.5 py-0.5 rounded-lg">{landAcres} एकड़</span>
                  </div>
                  
                  {/* Slider */}
                  <input 
                    type="range" 
                    min="1" 
                    max="15" 
                    step="0.5"
                    value={landAcres}
                    onChange={(e) => setLandAcres(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-emerald-900 rounded-lg appearance-none cursor-pointer h-1.5"
                  />
                </div>

                {/* Computational loan amount box output */}
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4.5 flex justify-between items-center text-white">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">अनुमानित ऋण राशि</span>
                    <h5 className="text-2xl font-extrabold text-white mt-1">₹{calculatedLoan.toLocaleString("hi-IN")}</h5>
                  </div>
                  <span className="bg-emerald-800 text-xs px-3 py-1.5 rounded-xl text-yellow-300 font-bold border border-emerald-700">
                    4% वार्षिक ब्याज
                  </span>
                </div>

                <button 
                  onClick={() => alert("KCC ऋण प्रस्ताव जांच पूर्ण हुई। सरकारी दस्तावेजों के साथ आपके स्थानीय नासिक को-ऑपरेटिव बैंक में संपर्क विवरण भेजा गया है।")}
                  className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md uppercase tracking-wider"
                >
                  🏦 बैंक विवरण जमा करें (Apply Loan)
                </button>
              </div>

            </div>
          )}
        </div>

        {/* ----------------- VOICE DIALOG INTERACTION OVERLAY ----------------- */}
        <AnimatePresence>
          {isVoiceActive && (
            <motion.div 
              id="voice-active-overlay"
              className="absolute inset-0 bg-black/70 z-40 flex flex-col justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Voice Slider Bottom Sheet */}
              <motion.div 
                className="bg-[#1A2E1A] text-white rounded-t-[34px] border-t-2 border-emerald-800 p-6 flex flex-col max-h-[75%]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
              >
                {/* Swipe down line header */}
                <div 
                  onClick={() => {
                    setIsVoiceActive(false);
                    stopTts();
                    stopListening();
                  }}
                  className="w-16 h-1.5 bg-emerald-900 rounded-full mx-auto mb-4 cursor-pointer hover:bg-emerald-800"
                />

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h4 className="font-extrabold text-sm tracking-wide text-emerald-400 font-sans uppercase">किसानवाणी एआई परामर्शदाता</h4>
                  </div>
                  
                  {/* Language switch badge top-right */}
                  <div className="bg-emerald-950 rounded-xl p-1 flex gap-1 border border-emerald-800 text-[11px] font-bold">
                    {(["HI", "MR", "EN"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setVoiceLanguage(lang)}
                        className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                          voiceLanguage === lang ? "bg-emerald-700 text-yellow-300" : "text-slate-400"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active audio visualizer graph */}
                <div className="flex items-end justify-center gap-2 h-16 bg-black/40 border border-emerald-900/50 rounded-2xl mb-5 px-3">
                  {Array.from({ length: 15 }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1 bg-amber-400 rounded-full"
                      animate={{
                        height: ttsActive || voiceStateMessage.includes("पहचान") ? [10, 50, 10] : [5, 10, 5]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + Math.random() * 0.4,
                        ease: "easeInOut",
                        delay: idx * 0.03
                      }}
                    />
                  ))}
                </div>

                {/* State dynamic indicator text */}
                <div id="state-prompt" className="text-center mb-4 font-mono text-[10px] text-emerald-300 tracking-wider">
                  {voiceStateMessage}
                </div>

                {/* Transcribed user speaking box */}
                <div className="mb-4">
                  <label className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block mb-1">
                    आपका सवाल (Transcribed Speaking text)
                  </label>
                  <div className="bg-black/20 border border-emerald-900 p-3 rounded-xl min-h-[44px] text-xs font-sans text-emerald-50 italic">
                    {voiceQuery ? `"${voiceQuery}"` : "कृपया कुछ बोलें या नीचे दिए गए नमूने पर क्लिक करें..."}
                  </div>
                </div>

                {/* Dynamic voice AI reply speech response content */}
                {voiceResponseText && (
                  <div className="bg-emerald-950/80 p-4.5 rounded-2xl border border-emerald-800 text-xs text-white my-3 flex-1 overflow-y-auto scrollbar-hide">
                    <strong className="text-yellow-400 block font-mono uppercase text-[10px] mb-1.5 tracking-wider font-bold">
                      💡 समाधान (KisanVaani Expert Guidance):
                    </strong>
                    <p className="leading-relaxed font-sans font-medium whitespace-pre-line text-[13px]">{voiceResponseText}</p>
                    
                    <div className="mt-4 flex gap-2 justify-end">
                      <button 
                        onClick={() => {
                          if (ttsActive) {
                            stopTts();
                          } else {
                            speakText(voiceResponseText);
                          }
                        }}
                        className={`text-slate-900 text-xs py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 ${
                          ttsActive ? "bg-amber-400 animate-pulse" : "bg-emerald-300"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {ttsActive ? "🔊 बंद करें" : "🔈 सुनें (TTS)"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggested audio verbal question presets slider */}
                {!voiceResponseText && (
                  <div className="mt-2">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2 font-sans">
                      पूछने के लिए सामान्य प्रश्न दबाएँ (Suggested Presets)
                    </p>
                    <div className="space-y-1.5">
                      {AUDIO_SAMPLES.map((sample, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleVoiceQuery(sample.text)}
                          className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 p-3 rounded-xl text-xs flex justify-between items-center cursor-pointer text-left font-sans"
                        >
                          <div>
                            <span className="text-[9px] text-amber-400 font-mono font-medium block mb-0.5">{sample.tag}</span>
                            <span className="text-emerald-50 opacity-95">{sample.text}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Big Microphone Button */}
                <div className="flex items-center gap-3 mt-4">
                  {isListening ? (
                    <button 
                      onClick={stopListening}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Mic className="w-5 h-5" />
                      🎤 सुन रहे हैं... रोकने के लिए दबाएं
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setVoiceResponseText("");
                        handleVoiceQuery();
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Mic className="w-5 h-5" />
                      🎤 बोलें (Speak)
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setIsVoiceActive(false);
                      stopTts();
                      stopListening();
                    }}
                    className="bg-black/40 hover:bg-black/60 border border-emerald-900 font-bold text-xs py-3.5 px-4 rounded-xl text-white"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- EXPANDED TREND BOTTOM SHEET DIALOG ----------------- */}
        <AnimatePresence>
          {trendAnalysisCrop && (
            <motion.div 
              id="trend-details-overlay"
              className="absolute inset-0 bg-black/75 z-40 flex flex-col justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-t-[34px] p-6 max-h-[80%] overflow-y-auto scrollbar-hide"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{trendAnalysisCrop.emoji}</span>
                    <div>
                      <h4 className="font-extrabold text-slate-950 text-base font-sans">{trendAnalysisCrop.name}</h4>
                      <p className="text-xs text-slate-500">📍 नासिक मंडी ऐतिहासिक भाव विवरण</p>
                    </div>
                  </div>
                  <button onClick={() => setTrendAnalysisCrop(null)} className="text-slate-400 hover:text-slate-800 text-lg font-bold">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <h5 className="font-bold text-indigo-950 text-xs mb-1.5">📊 ऐतिहासिक तुलनात्मक आरेख</h5>
                    <p className="text-xs text-slate-600 leading-normal">
                      पिछले सप्ताह की अपेक्षा कीमतों में {trendAnalysisCrop.change > 0 ? `+${trendAnalysisCrop.change}% की शुद्ध बढ़ोतरी` : `${trendAnalysisCrop.change}% का उतार-चढ़ाव`} दर्ज किया गया है।
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">साप्ताहिक रुझान विवरण</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">कल</span>
                        <strong className="text-xs font-bold text-slate-800">₹{trendAnalysisCrop.price - 40}</strong>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">आज</span>
                        <strong className="text-xs font-bold text-slate-800">₹{trendAnalysisCrop.price}</strong>
                      </div>
                      <div className="bg-green-50 p-2.5 rounded-xl border border-green-100">
                        <span className="text-[10px] text-green-700 block">+15 दिन</span>
                        <strong className="text-xs font-bold text-green-800">₹{Math.round(trendAnalysisCrop.price * 1.08)}</strong>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 block">उच्चतम</span>
                        <strong className="text-xs font-bold text-emerald-800">₹{Math.round(trendAnalysisCrop.price * 1.15)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs">
                    <strong className="text-amber-950 font-bold block mb-1">💡 कृषि विज्ञानी सलाह:</strong>
                    <p className="text-slate-800 font-sans leading-relaxed">
                      इस फसल की स्टॉक होल्डिंग क्षमता को बढ़ाने के लिए सूखी जूट बैगों या कोल्ड स्टोरेज भंडारों का इस्तेमाल करें। तेजी के रुख को देखते हुए आगामी 7 दिनों बाद उचित मंडियों में बिकवाली लाभकारी होगी।
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setTrendAnalysisCrop(null)}
                  className="mt-5 w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl"
                >
                  बंद करें (Close Analysis)
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- EXPANDED VIDEO / AUDIO LESSON PLAYER DIALOG ----------------- */}
        <AnimatePresence>
          {selectedZbnfLesson && (
            <motion.div 
              id="lesson-player-overlay"
              className="absolute inset-0 bg-black/80 z-40 flex flex-col justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-slate-900 text-white rounded-t-[34px] p-6 max-h-[85%] flex flex-col"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
              >
                {/* Drag handle */}
                <div onClick={() => setSelectedZbnfLesson(null)} className="w-16 h-1 bg-slate-700 rounded-full mx-auto mb-4 cursor-pointer" />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-amber-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded mr-2">ZBNF CLASSROOM</span>
                    <span className="text-[10px] font-mono text-slate-400">Speaker: {selectedZbnfLesson.speaker}</span>
                    <h4 className="text-base font-extrabold text-white mt-1.5 font-sans">{selectedZbnfLesson.title}</h4>
                  </div>
                  <button onClick={() => setSelectedZbnfLesson(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
                </div>

                {/* Simulated Waveform video background with running playback cursor */}
                <div className="bg-emerald-950 border border-emerald-900 rounded-3xl p-6 h-48 flex flex-col items-center justify-center text-center relative overflow-hidden mb-5">
                  <Volume2 className="w-12 h-12 text-amber-400 animate-pulse mb-3" />
                  
                  <div className="flex gap-1 justify-center items-end h-8">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-emerald-400 rounded-full"
                        style={{
                          height: isPlayingAudio ? `${5 + Math.random() * 25}px` : "6px",
                          transition: "height 0.2s"
                        }}
                      />
                    ))}
                  </div>

                  <span className="absolute bottom-2 right-4 font-mono text-[9px] text-slate-400">02:14 / {selectedZbnfLesson.duration}</span>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                  <p className="text-xs text-emerald-100/90 leading-relaxed bg-black/20 p-4 rounded-2xl border border-emerald-900/30">
                    {selectedZbnfLesson.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3.5">
                    <button 
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {isPlayingAudio ? "⏸️ ठहराएँ (Pause)" : "▶️ प्ले करें (Play Audio)"}
                    </button>
                    <button 
                      onClick={() => {
                        handleToggleCompleteLesson(selectedZbnfLesson.id);
                        setSelectedZbnfLesson(null);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl"
                    >
                      ✓ मार्क पूर्ण (Done)
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedZbnfLesson(null)}
                  className="mt-5 w-full bg-slate-850 hover:bg-slate-800 font-bold text-xs py-2.5 p-4 rounded-xl text-white uppercase tracking-wider"
                >
                  क्लासरूम बंद करें
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Mobile Device Bottom Tab Bar Navigation element with circular border & floating style */}
        <div id="floating-footer-navbar" className="absolute bottom-4 left-4 right-4 z-20">
          <nav className="bg-white/95 backdrop-blur-md border border-slate-200/90 h-[68px] rounded-full px-4 flex justify-between items-center shadow-[0_12px_32px_rgba(0,0,0,0.15)] relative">
            
            {/* Tab 1: Home */}
            <button 
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center justify-center cursor-pointer min-w-[50px] transition-all hover:scale-105 duration-200 ${
                activeTab === "home" ? "text-emerald-700 scale-105" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`p-1 rounded-full transition-colors ${activeTab === 'home' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <Home className="w-5 h-5 flex items-center justify-center" />
              </span>
              <span className="text-[9px] font-extrabold tracking-wider mt-0.5">होम / Home</span>
            </button>

            {/* Tab 2: Disease */}
            <button 
              onClick={() => setActiveTab("disease")}
              className={`flex flex-col items-center justify-center cursor-pointer min-w-[50px] transition-all hover:scale-105 duration-200 ${
                activeTab === "disease" ? "text-emerald-700 scale-105" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`p-1 rounded-full transition-colors ${activeTab === 'disease' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <Leaf className="w-5 h-5 flex items-center justify-center" />
              </span>
              <span className="text-[9px] font-extrabold tracking-wider mt-0.5">रोग / Disease</span>
            </button>

            {/* Tab 3: Markets */}
            <button 
              onClick={() => setActiveTab("market")}
              className={`flex flex-col items-center justify-center cursor-pointer min-w-[50px] transition-all hover:scale-105 duration-200 ${
                activeTab === "market" ? "text-emerald-700 scale-105" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`p-1 rounded-full transition-colors ${activeTab === 'market' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <BarChart2 className="w-5 h-5 flex items-center justify-center" />
              </span>
              <span className="text-[9px] font-extrabold tracking-wider mt-0.5">मंडी / Market</span>
            </button>

            {/* Tab 4: Learn / Weather */}
            <button 
              onClick={() => setActiveTab("learn")}
              className={`flex flex-col items-center justify-center cursor-pointer min-w-[50px] transition-all hover:scale-105 duration-200 ${
                activeTab === "learn" ? "text-emerald-700 scale-105" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`p-1 rounded-full transition-colors ${activeTab === 'learn' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <GraduationCap className="w-5 h-5 flex items-center justify-center" />
              </span>
              <span className="text-[9px] font-extrabold tracking-wider mt-0.5">स्कूल / Learn</span>
            </button>

            {/* Tab 5: Profile & Loan */}
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center justify-center cursor-pointer min-w-[50px] transition-all hover:scale-105 duration-200 ${
                activeTab === "profile" ? "text-emerald-700 scale-105" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`p-1 rounded-full transition-colors ${activeTab === 'profile' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <User className="w-5 h-5 flex items-center justify-center" />
              </span>
              <span className="text-[9px] font-extrabold tracking-wider mt-0.5">बायो / Bio</span>
            </button>

          </nav>
        </div>
      </div>
    </div>
  );
}
