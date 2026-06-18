import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON payloads up to 10mb for image uploads
app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Google Gen AI client
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is not defined. Falling back to local simulated response generator.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Weather Advisory Endpoint
// // GET /api/weather — Open-Meteo API (no key required)
app.get("/api/weather-advisory", async (req, res) => {
  try {
    const { lat = "19.9975", lon = "73.7898", district = "Nashik" } = req.query; // Default is Nashik, Maharashtra
    
    // Fetch real weather data from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`;
    
    let weatherData: any = {};
    try {
      const response = await fetch(url);
      if (response.ok) {
        weatherData = await response.json();
      } else {
        throw new Error("Failed to load meteorological data");
      }
    } catch (apiError) {
      console.error("Open-Meteo API request failed, resorting to static database forecast:", apiError);
      // Fallback data
      weatherData = {
        current_weather: {
          temperature: 31.4,
          windspeed: 12.8,
          weathercode: 3, // Partly cloudy
        },
        daily: {
          time: Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d.toISOString().split("T")[0];
          }),
          temperature_2m_max: [33, 34, 32, 29, 31, 32, 33],
          temperature_2m_min: [24, 23, 22, 21, 23, 24, 25],
          precipitation_probability_max: [10, 15, 65, 80, 45, 10, 5],
          weathercode: [3, 3, 61, 80, 51, 1, 0]
        },
        fallback: true
      };
    }

    const currentWeather = weatherData.current_weather || {};
    const rainNext2Days = (weatherData.daily?.precipitation_probability_max?.[0] > 50 || weatherData.daily?.precipitation_probability_max?.[1] > 50);
    const rainWarningHeader = rainNext2Days ? "2 दिनों में भारी बारिश की चेतावनी! (Rain in 2 days)" : "मौसम अनुकूल है (No extreme weather expected)";

    // Intelligent agricultural recommendations in Hindi based on coordinates and precipitation
    const recommendations = [
      {
        id: "adv_irrigation",
        title: "💧 सिंचाई सलाह (Irrigation)",
        text: rainNext2Days 
          ? "अगले दो दिनों में अच्छी वर्षा होने का अनुमान है, अतः सिंचाई पूर्णतः टालें। पानी जमा होने से बचाएं।" 
          : "मिट्टी में नमी सामान्य है। फसल की जड़ अवस्था को देखते हुए सुबह के समय हल्की सतही सिंचाई करें।"
      },
      {
        id: "adv_pesticide",
        title: "🌱 कीटनाशक स्प्रे (Spray Alert)",
        text: rainNext2Days
          ? "कीटनाशक स्प्रे न करें! (बारिश 2 दिन में संभव, छिड़काव निष्प्रभावी हो जाएगा)"
          : "कीटनाशक या जीवामृत स्प्रे का यह बिल्कुल सही समय है। हवा थमी होने पर हल्के छिड़काव करें।"
      },
      {
        id: "adv_harvest",
        title: "🌾 कटाई का सही समय (Harvest Tip)",
        text: rainNext2Days
          ? "मंडी के लिए कटी हुई फसल को तिरपाल से ढक कर सुरक्षित स्थानों पर रखें।"
          : "खेत शुष्क व साफ़ है। पकी फसलों (विशेषकर ज्वार/मकई) की कटाई बेझिझक शुरू कर सकते हैं।"
      }
    ];

    res.json({
      district,
      latitude: lat,
      longitude: lon,
      temp: currentWeather.temperature ?? 31.2,
      wind: currentWeather.windspeed ?? 11.5,
      weathercode: currentWeather.weathercode ?? 3,
      rainWarning: rainWarningHeader,
      rainSoon: rainNext2Days,
      daily: weatherData.daily || {},
      recommendations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Live Market Prices Endpoint (Simulates high-fidelity Agmarknet feed)
// // GET /api/market/prices — Agmarknet data.gov.in
app.get("/api/market/prices", (req, res) => {
  const { district = "Nashik" } = req.query;
  
  // Real crops in Indian Agriculture mandis
  const crops = [
    {
      id: "onion",
      emoji: "🧅",
      name: "Onion — प्याज",
      category: "सब्ज़ी",
      price: 2340,
      change: 12,
      trend: "up",
      sparkline: [2100, 2150, 2200, 2240, 2220, 2300, 2340],
      mandi: `${district} Mandi`,
      prediction: "अगले 15 दिनों में निर्यात मांग बढ़ने से प्याज के दाम ₹2,500/कुंतल तक छू सकते हैं। अनुकूल बिकवाली समय।"
    },
    {
      id: "tomato",
      emoji: "🍅",
      name: "Tomato — टमाटर",
      category: "सब्ज़ी",
      price: 890,
      change: -5,
      trend: "down",
      sparkline: [980, 950, 940, 910, 920, 900, 890],
      mandi: `${district} Mandi`,
      prediction: "स्थानीय आवक में बढ़ोतरी से कीमतों में मंदी है। आगामी सप्ताह भाव ₹850-₹900 पर स्थिर रहने की संभावना।"
    },
    {
      id: "wheat",
      emoji: "🌾",
      name: "Wheat — गेहूं",
      category: "अनाज",
      price: 2150,
      change: 0,
      trend: "stable",
      sparkline: [2150, 2150, 2160, 2150, 2150, 2150, 2150],
      mandi: `${district} Mandi`,
      prediction: "एमएसपी खरीद केंद्र पूर्ण सक्रिय हैं। भाव ₹2,150 पर ही स्थिर रहने की ठोस संभावना।"
    },
    {
      id: "gram",
      emoji: "🌱",
      name: "Bengal Gram (Chana) — चना",
      category: "दलहन",
      price: 5410,
      change: 3,
      trend: "up",
      sparkline: [5200, 5250, 5310, 5350, 5320, 5380, 5410],
      mandi: `${district} Apex Mandi`,
      prediction: "सरकारी खरीद लक्ष्य पूरा होने के समीप है। दलहनी दालों के दाम में मामूली बढ़ोतरी जारी रहने का रुख है।"
    },
    {
      id: "pomegranate",
      emoji: "🍎",
      name: "Pomegranate — अनार",
      category: "फल",
      price: 8400,
      change: 8,
      trend: "up",
      sparkline: [7800, 7900, 8100, 8150, 8200, 8350, 8400],
      mandi: "Maharashtra Wholesale Bazaar",
      prediction: "बाहरी राज्यों से मजबूत निर्यात ऑर्डरों के कारण अनार के दामों में लगातार तेजी बनी हुई है।"
    }
  ];

  res.json({
    timestamp: new Date().toISOString(),
    mandiLocation: district,
    prices: crops
  });
});

// 3. Disease Identification API
// // POST /api/disease/predict — HuggingFace EfficientNet
// We back this endpoint with actual Gemini AI vision requests for genuine diagnostic capabilities!
app.post("/api/disease/predict", async (req, res) => {
  const { image, symptoms, cropName } = req.body;
  const client = getGeminiClient();

  if (!client) {
    // Elegant hardcoded simulations if Gemini key is missing
    return res.json({
      disease: symptoms?.toLowerCase().includes("leaf spot") 
        ? "Early Blight (अगेती झुलसा)" 
        : "Powdery Mildew (चूर्णिल आसिता)",
      pestsDetected: "Spider Mites / लाल मकड़ी (नगण्य मात्रा)",
      confidence: "87% सटीकता (Simulated)",
      crop: cropName || "टमाटर (Tomato)",
      analysisText: "पत्तियों के धब्बों और पीले छल्लों के आधार पर यह संक्रमण अगेती झुलसा प्रतीत होता है। अत्यधिक आर्द्रता से फैला है।",
      remedies: [
        { name: "नीम तेल स्प्रे (Neem Oil Spray)", instruction: "15 लीटर पानी में 50 मिलीलीटर नीम तेल और तरल साबुन मिलाकर पत्तों के नीचे व ऊपर छिड़कें।" },
        { name: "जीवामृत अनुप्रयोग (Jeevamrutha Enrichment)", instruction: "पौधे के चारों ओर जड़ क्षेत्र में मिट्टी पर 10% सघन जीवामृत घोल डालें ताकि सुरक्षा रोगाणु पनपें।" },
        { name: "ट्राइकोडर्मा जैविक उपचार (Trichoderma)", instruction: "100 ग्राम ट्राइकोडर्मा पाउडर को 10 किलो सड़ी गोबर खाद में मिलाकर संक्रमित क्यारियों की मिट्टी में मिलाएं।" }
      ],
      belowLimit: false
    });
  }

  try {
    let promptText = `
      You are an expert plant pathologist specialized in Indian Agriculture and Natural Farming / Zero Budget Natural Farming (ZBNF).
      A farmer is submitting diagnostic data.
      ${cropName ? `Crop: ${cropName}.` : ""}
      ${symptoms ? `Syptoms described by farmer: "${symptoms}".` : ""}
      
      Look closely at the image or text description and respond with a structured JSON format containing:
      1. disease: Disease name in English and translated Hindi (e.g. "Early Blight - अगेती झुलसा")
      2. confidence: An estimated accuracy statistic (e.g. "89% सटीकता")
      3. analysisText: Brief diagnosis background details in simple Hindi.
      4. remedies: List of exactly 3 natural, organic, or ZBNF treatments. Every remedy must specify natural preparation (e.g., Neem oil, Jeevamrutha, Agniastra, Dashaparni ark, Trichoderma) and exact application directions.
      
      Respond MUST be strictly valid JSON according to this structure with nothing else. No markdown wrappers unless required, just raw JSON.
    `;

    let parts: any[] = [{ text: promptText }];
    if (image) {
      const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";
      const base64Data = image.split(",")[1] || image;
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    let cleanJson = response.text || "";
    cleanJson = cleanJson.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7).trim();
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3).trim();
    }

    const parsedResult = JSON.parse(cleanJson);
    res.json(parsedResult);

  } catch (err: any) {
    console.error("Gemini Disease analysis failed:", err);
    res.status(500).json({ error: "रोग का विश्लेषण नहीं हो सका। कृपया पुनः प्रयास करें।", detail: err.message });
  }
});

// 4. Voice Consultant Endpoint (Whisper and Ollama Simulation using Real Gemini API)
// // Whisper.cpp STT → Ollama Llama 3.2 → Coqui TTS
// The user sends their transcribed speech snippet (or clicks presets) and gets a professional, empathetic audio-ready answer.
app.post("/api/voice-consult", async (req, res) => {
  const { question, language = "HI" } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: "कृपया सवाल पूछें।" });
  }

  const client = getGeminiClient();
  const langPrompt = language === "MR" ? "Marathi" : language === "EN" ? "English" : "Hindi";

  if (!client) {
    // Beautiful offline/simulated intelligent farming assistance in Hindi/Marathi
    let answer = "जीवामृत बनाने के लिए आवश्यक सामग्री: 10 किलो जैविक गाय का गोबर, 10 लीटर गोमूत्र, 2 किलो पुराना गुड़, 2 किलो बेसन (चने का आटा) और 1 किलो पेड़ के नीचे की सजीव मिट्टी। इसे 200 लीटर पानी में मिलाकर 48 घंटे के लिए छायादार स्थान पर लकड़ी से चलाएं। इससे जीवाणु प्रचुर मात्रा में विकसित होते हैं जो प्राकृतिक कृषि के मुख्य आधार हैं।";
    if (language === "MR") {
      answer = "जीवामृत बनवण्यासाठी साहित्य: १० किलो सेंद्रिय गाईचे शेण, १० लीटर गोमूत्र, २ किलो गुळ, २ किलो हरभरा डाळीचे पीठ, आणि १ किलो झाडाखालील जिवंत माती. २०० लीटर पाण्यात मिसळून ४८ तास सावलीत ठेवा व दिवसातून दोनदा काठीने हलवा.";
    }
    return res.json({
      transcription: question,
      detectedLanguage: language,
      answer: answer,
      simulatedTTS: true
    });
  }

  try {
    const prompt = `
      You are KisanVaani, an empathetic, expert agricultural specialist who helps Indian farmers adopt Natural Farming (ZBNF), soil regeneration, and organic crop methods.
      Understand the user's query and respond in a clear, friendly, and comprehensive manner.
      Query: "${question}"
      Respond in ${langPrompt} (using Devanagari script for Hindi/Marathi). Keep the reply professional and direct, highlighting organic preparations like Jeevamrutha, Dashaparni Ark, Neem leaf extract, or Beejamrutha where relevant (e.g., if asking for pests or soil). Keep the response length below 150 words.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({
      transcription: question,
      detectedLanguage: language,
      answer: response.text || "माफ कीजिये, मुझे समझने में दिक्कत हुई। कृपया पुनः पूछें।"
    });

  } catch (err: any) {
    res.status(500).json({ error: "Gemini consult error details: " + err.message });
  }
});

// 5. Subsidies local endpoint
// // GET /api/finance/subsidies — local JSON + PM-Kisan status
app.get("/api/finance/subsidies", (req, res) => {
  res.json({
    farmerName: "Ramesh Patil",
    pmKisanStatus: "Active — 16वीं किस्त ₹2,000 स्वीकृत (12 अप्रैल 2026 को हस्तांतरित)",
    schemes: [
      {
        id: "pm_kisan",
        name: "PM-Kisan — पीएम किसान सम्मान निधि",
        benefit: "₹6,000 / वर्ष",
        eligibility: "योग्य (पात्र हैं)",
        statusColor: "success",
        description: "सभी छोटे सीमांत भूमि धारकों के बैंक खातों में सीधी सहायता किस्तें।"
      },
      {
        id: "pmfby",
        name: "PMFBY — प्रधानमंत्री फसल बीमा योजना",
        benefit: "फसल नुकसान पर 100% तक भरपाई",
        eligibility: "जांचें (समीक्षा जारी)",
        statusColor: "warning",
        description: "सूखा, ओलावृष्टि व भारी बारिश जैसी प्राकृतिक आपदाओं के संकट से सुरक्षा कवच।"
      },
      {
        id: "kcc_loan",
        name: "KCC Loan — किसान क्रेडिट कार्ड",
        benefit: "4% रियायती ब्याज दर पर कृषि ऋण",
        eligibility: "दावा करें (Apply Now)",
        statusColor: "success",
        description: "फसल उपजाने के खर्चों, बीज, उर्वरक और उपकरण हेतु विशेष रियायती लोन योजना।"
      }
    ]
  });
});

// Serve frontend static assets in production, otherwise Vite will proxy them or run as middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for smooth development hot module replacement proxy (even though control plane sets hmr: false, assets serve through Vite)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌾 KisanVaani backend up and running at http://localhost:${PORT}`);
  });
}

startServer();
