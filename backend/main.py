"""
KisanVani Backend — FastAPI
Complete backend with all endpoints:
  1. Disease Prediction (HuggingFace + Gemini fallback)
  2. Weather Advisory (Open-Meteo real API)
  3. Market Prices (Simulated Agmarknet feed)
  4. Voice Consultant (Gemini / Groq AI)
  5. Finance & Subsidies (Static JSON)
  6. Education Lessons (Static JSON)
"""

import os
import io
import json
import base64
import traceback
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="KisanVani — Voice-Based Natural Farming Consultant",
    version="1.0.0",
    description="Backend API for multilevel natural farming consultant with disease detection, weather, market intelligence, and voice consultation."
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Keys ─────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

# ─── HuggingFace Disease Detection Config ─────────────────
HF_MODEL = "rarfileexe/Plant-Disease-Detector"
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

# ─── Comprehensive Organic Remedy Knowledge Base ──────────
REMEDY_MAP = {
    "Apple___Apple_scab": {
        "disease_hi": "सेब पपड़ी रोग (Apple Scab)",
        "remedies": [
            {"name": "नीम तेल स्प्रे (Neem Oil Spray)", "instruction": "15 लीटर पानी में 50 मिली नीम तेल और 5 मिली लिक्विड सोप मिलाकर पत्तियों पर 7 दिन के अंतराल पर छिड़कें।"},
            {"name": "बॉर्डो मिश्रण (Bordeaux Mixture - Organic)", "instruction": "1% बॉर्डो मिश्रण (100 ग्राम कॉपर सल्फेट + 100 ग्राम बुझा चूना + 10 लीटर पानी) पत्तियों पर छिड़कें।"},
            {"name": "जीवामृत (Jeevamrutha)", "instruction": "जड़ क्षेत्र में 500 मिली/पौधा जीवामृत डालें। मिट्टी के लाभकारी जीवाणु रोग प्रतिरोधक क्षमता बढ़ाते हैं।"}
        ]
    },
    "Apple___Black_rot": {
        "disease_hi": "सेब काला सड़न (Apple Black Rot)",
        "remedies": [
            {"name": "संक्रमित शाखाओं की छंटाई", "instruction": "संक्रमित शाखाओं और फलों को तुरंत काटकर जला दें। स्वस्थ लकड़ी से 15 सेमी नीचे तक काटें।"},
            {"name": "ट्राइकोडर्मा उपचार (Trichoderma)", "instruction": "100 ग्राम ट्राइकोडर्मा पाउडर को 10 किलो सड़ी गोबर खाद में मिलाकर जड़ क्षेत्र में डालें।"},
            {"name": "पंचगव्य स्प्रे (Panchagavya)", "instruction": "3% पंचगव्य घोल (30 मिली/लीटर पानी) का छिड़काव 15 दिनों के अंतराल पर करें।"}
        ]
    },
    "Tomato___Early_blight": {
        "disease_hi": "टमाटर अगेती झुलसा (Tomato Early Blight)",
        "remedies": [
            {"name": "नीम तेल छिड़काव (Neem Oil Spray)", "instruction": "15 लीटर पानी में 50 मिली नीम तेल डालकर पत्तों के नीचे व ऊपर छिड़कें। सुबह या शाम को करें।"},
            {"name": "जीवामृत अनुप्रयोग (Jeevamrutha)", "instruction": "पौधे के चारों ओर जड़ क्षेत्र में 10% सघन जीवामृत घोल डालें ताकि सुरक्षा रोगाणु पनपें।"},
            {"name": "ट्राइकोडर्मा जैविक उपचार (Trichoderma)", "instruction": "100 ग्राम ट्राइकोडर्मा पाउडर 10 किलो सड़ी गोबर खाद में मिलाकर संक्रमित क्यारियों की मिट्टी में मिलाएं।"}
        ]
    },
    "Tomato___Late_blight": {
        "disease_hi": "टमाटर पछेती झुलसा (Tomato Late Blight)",
        "remedies": [
            {"name": "बॉर्डो मिश्रण (Bordeaux Mixture)", "instruction": "1% बॉर्डो मिश्रण तैयार कर सप्ताह में दो बार छिड़काव करें। बारिश के बाद तुरंत दोबारा करें।"},
            {"name": "दशपर्णी अर्क (Dashparni Ark)", "instruction": "नीम, धतूरा, सीताफल, आक आदि 10 पत्तियों का अर्क बनाकर 5% घोल में छिड़कें।"},
            {"name": "अग्निअस्त्र (Agniastra)", "instruction": "तम्बाकू, लहसुन, हरी मिर्च, नीम पत्ती का काढ़ा बनाकर 10% घोल में छिड़काव करें।"}
        ]
    },
    "Tomato___Leaf_Mold": {
        "disease_hi": "टमाटर पत्ती फफूंद (Tomato Leaf Mold)",
        "remedies": [
            {"name": "वायु संचार सुधारें", "instruction": "पौधों के बीच पर्याप्त दूरी रखें। निचली पत्तियाँ हटाकर हवा का प्रवाह बढ़ाएं।"},
            {"name": "नीम तेल + बेकिंग सोडा", "instruction": "1 लीटर पानी में 5 मिली नीम तेल और 5 ग्राम बेकिंग सोडा मिलाकर छिड़कें।"},
            {"name": "छाछ स्प्रे (Buttermilk Spray)", "instruction": "1 भाग छाछ + 9 भाग पानी मिलाकर पत्तियों पर छिड़कें। लैक्टिक एसिड फफूंद को रोकता है।"}
        ]
    },
    "Potato___Early_blight": {
        "disease_hi": "आलू अगेती झुलसा (Potato Early Blight)",
        "remedies": [
            {"name": "नीम तेल स्प्रे (Neem Oil)", "instruction": "5 मिली नीम तेल प्रति लीटर पानी में मिलाकर 7-10 दिनों के अंतराल पर छिड़कें।"},
            {"name": "बीजामृत बीज उपचार (Beejamrutha)", "instruction": "बुआई पूर्व बीजों को बीजामृत में 30 मिनट डुबोकर सुखाएं। फफूंद संक्रमण 80% तक कम होता है।"},
            {"name": "मल्चिंग (Mulching)", "instruction": "पौधों के चारों ओर 3-4 इंच गहरी पुआल बिछाएं। मिट्टी की नमी बनी रहती है और बीजाणु नहीं उछलते।"}
        ]
    },
    "Potato___Late_blight": {
        "disease_hi": "आलू पछेती झुलसा (Potato Late Blight)",
        "remedies": [
            {"name": "बॉर्डो मिश्रण (Bordeaux Mixture)", "instruction": "1% बॉर्डो मिश्रण का छिड़काव पत्तियों और तनों पर करें। बारिश के बाद दोहराएं।"},
            {"name": "ट्राइकोडर्मा (Trichoderma)", "instruction": "ट्राइकोडर्मा विरिडी 4 ग्राम/लीटर पानी में मिलाकर ड्रेंचिंग करें।"},
            {"name": "फसल चक्र (Crop Rotation)", "instruction": "आलू के बाद अगली फसल में गेहूं या सरसों लगाएं। 3 साल तक एक ही खेत में आलू न लगाएं।"}
        ]
    },
    "Corn_(maize)___Common_rust_": {
        "disease_hi": "मक्का सामान्य रस्ट (Corn Common Rust)",
        "remedies": [
            {"name": "नीम तेल स्प्रे", "instruction": "5 मिली नीम तेल/लीटर पानी, सप्ताह में दो बार पत्तियों पर छिड़कें।"},
            {"name": "स्यूडोमोनास (Pseudomonas)", "instruction": "स्यूडोमोनास फ्लोरेसेंस 10 ग्राम/लीटर पानी में मिलाकर जैविक फफूंदनाशक के रूप में छिड़कें।"},
            {"name": "प्रतिरोधी किस्में (Resistant Varieties)", "instruction": "अगली बार HQPM-1 या DHM-117 जैसी रस्ट-प्रतिरोधी किस्में लगाएं।"}
        ]
    },
    "Grape___Black_rot": {
        "disease_hi": "अंगूर काला सड़न (Grape Black Rot)",
        "remedies": [
            {"name": "संक्रमित फलों को हटाएं", "instruction": "सभी संक्रमित फलों और पत्तियों को तुरंत हटाकर नष्ट करें।"},
            {"name": "बॉर्डो मिश्रण", "instruction": "0.5% बॉर्डो मिश्रण का छिड़काव फूल आने से पहले और बाद में करें।"},
            {"name": "पंचगव्य (Panchagavya)", "instruction": "3% पंचगव्य घोल हर 15 दिन में छिड़कें। रोग प्रतिरोधक क्षमता बढ़ती है।"}
        ]
    },
}

# Default fallback remedy
DEFAULT_REMEDY = {
    "disease_hi": "अज्ञात रोग — कृपया कृषि विज्ञानी से संपर्क करें",
    "remedies": [
        {"name": "नीम तेल स्प्रे (Neem Oil Spray)", "instruction": "15 लीटर पानी में 50 मिली नीम तेल मिलाकर पत्तियों पर छिड़कें।"},
        {"name": "जीवामृत (Jeevamrutha)", "instruction": "200 लीटर पानी + 10 किलो गोबर + 10 लीटर गोमूत्र + 2 किलो गुड़ + 2 किलो बेसन + 1 किलो मिट्टी — 48 घंटे सड़ाकर जड़ों में डालें।"},
        {"name": "ट्राइकोडर्मा (Trichoderma)", "instruction": "100 ग्राम ट्राइकोडर्मा पाउडर 10 किलो सड़ी गोबर खाद में मिलाकर मिट्टी में मिलाएं।"}
    ]
}

# ─── Education Lessons Database ───────────────────────────
LESSONS_DATABASE = [
    {
        "id": "l_1",
        "title": "बीजामृत विधि (Seed Treatment with Beejamrutha)",
        "duration": "3:45",
        "progress": 100,
        "category": "बीज संस्कार",
        "difficulty": "सभी स्तर (Beginner)",
        "completed": True,
        "speaker": "डॉ. सुभाष पालेकर",
        "description": "गाय के गोबर, गोमूत्र, चूना और स्थानीय मिट्टी के उपयोग से बीजों का जैविक उपचार कर फंगस रोगों से शत-प्रतिशत मुक्ति पाएँ।"
    },
    {
        "id": "l_2",
        "title": "जीवामृत सघन खाद (Jeevamrutha Mastery)",
        "duration": "4:32",
        "progress": 60,
        "category": "जीवाणु संवर्धन",
        "difficulty": "सभी स्तर (Beginner)",
        "completed": False,
        "speaker": "आचार्य रामचंद्र राम",
        "description": "200 लीटर पानी में 10 किलो गाय गोमूत्र व गोबर द्वारा सूक्ष्मजीव पैदा कर मिट्टी की उड़नशीलता को आश्चर्यजनक रूप से बढ़ाएं।"
    },
    {
        "id": "l_3",
        "title": "मल्चिंग या आच्छादन (Mulching Science)",
        "duration": "5:15",
        "progress": 0,
        "category": "नमी संरक्षण",
        "difficulty": "मध्यम (Intermediate)",
        "completed": False,
        "speaker": "श्रीमती सुनीता चौधरी",
        "description": "फसल अवशेषों और भूसे से ज़मीन को ढककर वाष्पीकरण रोकना, केंचुओं को सक्रिय करना तथा खरपतवार नियंत्रण करना।"
    },
    {
        "id": "l_4",
        "title": "वापसा विधि (Whapasa — Air & Water Balance)",
        "duration": "4:10",
        "progress": 0,
        "category": "सिंचाई प्रबंधन",
        "difficulty": "उन्नत (Advanced)",
        "completed": False,
        "speaker": "राजेश पाटिल (जैविक विशेषज्ञ)",
        "description": "मिट्टी में पानी देने के बजाय केवल वाष्प और हवा का संतुलन बनाए रखकर 90% तक पानी की भारी बचत करने का अनूठा तरीका।"
    },
    {
        "id": "l_5",
        "title": "दशपर्णी अर्क (Dashparni Ark — 10 Leaf Extract)",
        "duration": "6:00",
        "progress": 0,
        "category": "कीट नियंत्रण",
        "difficulty": "मध्यम (Intermediate)",
        "completed": False,
        "speaker": "डॉ. सुभाष पालेकर",
        "description": "10 विभिन्न पौधों की पत्तियों से बना प्राकृतिक कीटनाशक जो रासायनिक स्प्रे का पूर्ण विकल्प है।"
    }
]

# ─── Subsidies Database ───────────────────────────────────
SUBSIDIES_DATA = {
    "farmerName": "Ramesh Patil",
    "pmKisanStatus": "Active — 16वीं किस्त ₹2,000 स्वीकृत (12 अप्रैल 2026 को हस्तांतरित)",
    "schemes": [
        {
            "id": "pm_kisan",
            "name": "PM-Kisan — पीएम किसान सम्मान निधि",
            "benefit": "₹6,000 / वर्ष",
            "eligibility": "योग्य (पात्र हैं)",
            "statusColor": "success",
            "description": "सभी छोटे सीमांत भूमि धारकों के बैंक खातों में सीधी सहायता किस्तें।"
        },
        {
            "id": "pmfby",
            "name": "PMFBY — प्रधानमंत्री फसल बीमा योजना",
            "benefit": "फसल नुकसान पर 100% तक भरपाई",
            "eligibility": "जांचें (समीक्षा जारी)",
            "statusColor": "warning",
            "description": "सूखा, ओलावृष्टि व भारी बारिश जैसी प्राकृतिक आपदाओं के संकट से सुरक्षा कवच।"
        },
        {
            "id": "kcc_loan",
            "name": "KCC Loan — किसान क्रेडिट कार्ड",
            "benefit": "4% रियायती ब्याज दर पर कृषि ऋण",
            "eligibility": "दावा करें (Apply Now)",
            "statusColor": "success",
            "description": "फसल उपजाने के खर्चों, बीज, उर्वरक और उपकरण हेतु विशेष रियायती लोन योजना।"
        }
    ]
}

# ─── Market Prices Database (Simulated Agmarknet) ─────────
def get_market_prices(district: str = "Nashik"):
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "mandiLocation": district,
        "prices": [
            {
                "id": "onion",
                "emoji": "🧅",
                "name": "Onion — प्याज",
                "category": "सब्ज़ी",
                "price": 2340,
                "change": 12,
                "trend": "up",
                "sparkline": [2100, 2150, 2200, 2240, 2220, 2300, 2340],
                "mandi": f"{district} Mandi",
                "prediction": "अगले 15 दिनों में निर्यात मांग बढ़ने से प्याज के दाम ₹2,500/कुंतल तक छू सकते हैं। अनुकूल बिकवाली समय।"
            },
            {
                "id": "tomato",
                "emoji": "🍅",
                "name": "Tomato — टमाटर",
                "category": "सब्ज़ी",
                "price": 890,
                "change": -5,
                "trend": "down",
                "sparkline": [980, 950, 940, 910, 920, 900, 890],
                "mandi": f"{district} Mandi",
                "prediction": "स्थानीय आवक में बढ़ोतरी से कीमतों में मंदी है। आगामी सप्ताह भाव ₹850-₹900 पर स्थिर रहने की संभावना।"
            },
            {
                "id": "wheat",
                "emoji": "🌾",
                "name": "Wheat — गेहूं",
                "category": "अनाज",
                "price": 2150,
                "change": 0,
                "trend": "stable",
                "sparkline": [2150, 2150, 2160, 2150, 2150, 2150, 2150],
                "mandi": f"{district} Mandi",
                "prediction": "एमएसपी खरीद केंद्र पूर्ण सक्रिय हैं। भाव ₹2,150 पर ही स्थिर रहने की ठोस संभावना।"
            },
            {
                "id": "gram",
                "emoji": "🌱",
                "name": "Bengal Gram (Chana) — चना",
                "category": "दलहन",
                "price": 5410,
                "change": 3,
                "trend": "up",
                "sparkline": [5200, 5250, 5310, 5350, 5320, 5380, 5410],
                "mandi": f"{district} Apex Mandi",
                "prediction": "सरकारी खरीद लक्ष्य पूरा होने के समीप है। दलहनी दालों के दाम में मामूली बढ़ोतरी जारी रहने का रुख है।"
            },
            {
                "id": "pomegranate",
                "emoji": "🍎",
                "name": "Pomegranate — अनार",
                "category": "फल",
                "price": 8400,
                "change": 8,
                "trend": "up",
                "sparkline": [7800, 7900, 8100, 8150, 8200, 8350, 8400],
                "mandi": "Maharashtra Wholesale Bazaar",
                "prediction": "बाहरी राज्यों से मजबूत निर्यात ऑर्डरों के कारण अनार के दामों में लगातार तेजी बनी हुई है।"
            }
        ]
    }


# ════════════════════════════════════════════════════════════
# ENDPOINT 1: Disease Prediction (HuggingFace + Gemini fallback)
# ════════════════════════════════════════════════════════════

class DiseasePredictRequest(BaseModel):
    image: Optional[str] = None       # base64 image data URI
    symptoms: Optional[str] = None
    cropName: Optional[str] = None


async def call_huggingface(image_bytes: bytes) -> list:
    """Call HuggingFace Inference API for plant disease classification."""
    headers = {"Accept": "application/json"}
    if HF_API_TOKEN:
        headers["Authorization"] = f"Bearer {HF_API_TOKEN}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(HF_API_URL, headers=headers, content=image_bytes)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"HuggingFace API returned {response.status_code}: {response.text}")


async def call_gemini_vision(image_b64: str, symptoms: str = "", crop_name: str = "") -> dict:
    """Use Gemini Vision API for disease analysis as fallback."""
    if not GEMINI_API_KEY:
        return None
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""You are an expert plant pathologist specialized in Indian Agriculture and Natural Farming / Zero Budget Natural Farming (ZBNF).
A farmer is submitting diagnostic data.
{f'Crop: {crop_name}.' if crop_name else ''}
{f'Symptoms described by farmer: "{symptoms}".' if symptoms else ''}

Look closely at the image or text description and respond with a structured JSON format containing:
1. disease: Disease name in English and translated Hindi (e.g. "Early Blight - अगेती झुलसा")
2. confidence: An estimated accuracy statistic (e.g. "89% सटीकता")
3. analysisText: Brief diagnosis background details in simple Hindi.
4. remedies: List of exactly 3 natural, organic, or ZBNF treatments. Every remedy must have "name" and "instruction" keys with natural preparation details.

Respond with ONLY valid JSON, no markdown wrappers."""

    parts = [{"text": prompt}]
    
    if image_b64:
        # Extract mime type and data
        if "," in image_b64:
            header, data = image_b64.split(",", 1)
            mime_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        else:
            data = image_b64
            mime_type = "image/jpeg"
        
        parts.append({
            "inlineData": {
                "mimeType": mime_type,
                "data": data
            }
        })
    
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 200:
            result = resp.json()
            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
    return None


@app.post("/api/disease/predict")
async def predict_disease(request: DiseasePredictRequest):
    """
    Disease prediction endpoint.
    
    Pipeline:
    1. Try HuggingFace rarfileexe/Plant-Disease-Detector model
    2. Fallback to Gemini Vision API
    3. Final fallback to hardcoded organic remedies
    """
    image_b64 = request.image
    symptoms = request.symptoms or ""
    crop_name = request.cropName or ""
    
    # --- Try HuggingFace Model First ---
    hf_result = None
    if image_b64:
        try:
            # Decode base64 image
            if "," in image_b64:
                img_data = base64.b64decode(image_b64.split(",")[1])
            else:
                img_data = base64.b64decode(image_b64)
            
            predictions = await call_huggingface(img_data)
            if predictions and isinstance(predictions, list) and len(predictions) > 0:
                top = predictions[0]
                label = top.get("label", "Unknown")
                score = round(float(top.get("score", 0)) * 100, 1)
                
                # Map to remedies from knowledge base
                remedy_info = REMEDY_MAP.get(label, DEFAULT_REMEDY)
                
                hf_result = {
                    "disease": f"{label} — {remedy_info['disease_hi']}",
                    "confidence": f"{score}% सटीकता (HuggingFace AI)",
                    "crop": crop_name or "Unknown",
                    "analysisText": f"HuggingFace AI मॉडल ({HF_MODEL}) ने {score}% सटीकता के साथ '{label}' रोग की पहचान की है। यह प्राकृतिक कृषि पद्धतियों से उपचार योग्य है।",
                    "remedies": remedy_info["remedies"],
                    "model": "HuggingFace Plant-Disease-Detector",
                    "belowLimit": score < 70
                }
                return JSONResponse(content=hf_result)
        except Exception as e:
            print(f"[WARNING] HuggingFace inference failed: {e}")
            traceback.print_exc()
    
    # --- Fallback to Gemini Vision ---
    try:
        gemini_result = await call_gemini_vision(image_b64, symptoms, crop_name)
        if gemini_result:
            gemini_result["model"] = "Gemini Vision API"
            return JSONResponse(content=gemini_result)
    except Exception as e:
        print(f"[WARNING] Gemini Vision failed: {e}")
    
    # --- Final Fallback: Raise Exception if both failed ---
    raise HTTPException(
        status_code=500,
        detail="Disease prediction failed. Both HuggingFace and Gemini Vision model services are currently unavailable."
    )


# ════════════════════════════════════════════════════════════
# ENDPOINT 2: Weather Advisory (Open-Meteo real API)
# ════════════════════════════════════════════════════════════

@app.get("/api/weather-advisory")
async def weather_advisory(lat: str = "19.9975", lon: str = "73.7898", district: str = "Nashik"):
    """
    Real weather data from Open-Meteo API with farming-specific advisories.
    No API key required.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current_weather=true"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode"
        f"&timezone=auto&forecast_days=7"
    )
    
    weather_data = {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                weather_data = response.json()
            else:
                raise Exception("Open-Meteo request failed")
    except Exception as e:
        print(f"⚠️ Open-Meteo API failed, using fallback: {e}")
        # Fallback data
        today = datetime.utcnow()
        weather_data = {
            "current_weather": {"temperature": 31.4, "windspeed": 12.8, "weathercode": 3},
            "daily": {
                "time": [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)],
                "temperature_2m_max": [33, 34, 32, 29, 31, 32, 33],
                "temperature_2m_min": [24, 23, 22, 21, 23, 24, 25],
                "precipitation_probability_max": [10, 15, 65, 80, 45, 10, 5],
                "weathercode": [3, 3, 61, 80, 51, 1, 0]
            },
            "fallback": True
        }
    
    current = weather_data.get("current_weather", {})
    daily = weather_data.get("daily", {})
    precip = daily.get("precipitation_probability_max", [0, 0])
    
    rain_soon = len(precip) >= 2 and (precip[0] > 50 or precip[1] > 50)
    rain_warning = ("2 दिनों में भारी बारिश की चेतावनी! (Rain in 2 days)" 
                    if rain_soon 
                    else "मौसम अनुकूल है (No extreme weather expected)")
    
    recommendations = [
        {
            "id": "adv_irrigation",
            "title": "💧 सिंचाई सलाह (Irrigation)",
            "text": ("अगले दो दिनों में अच्छी वर्षा होने का अनुमान है, अतः सिंचाई पूर्णतः टालें। पानी जमा होने से बचाएं।"
                     if rain_soon
                     else "मिट्टी में नमी सामान्य है। फसल की जड़ अवस्था को देखते हुए सुबह के समय हल्की सतही सिंचाई करें।")
        },
        {
            "id": "adv_pesticide",
            "title": "🌱 कीटनाशक स्प्रे (Spray Alert)",
            "text": ("कीटनाशक स्प्रे न करें! (बारिश 2 दिन में संभव, छिड़काव निष्प्रभावी हो जाएगा)"
                     if rain_soon
                     else "कीटनाशक या जीवामृत स्प्रे का यह बिल्कुल सही समय है। हवा थमी होने पर हल्के छिड़काव करें।")
        },
        {
            "id": "adv_harvest",
            "title": "🌾 कटाई का सही समय (Harvest Tip)",
            "text": ("मंडी के लिए कटी हुई फसल को तिरपाल से ढक कर सुरक्षित स्थानों पर रखें।"
                     if rain_soon
                     else "खेत शुष्क व साफ़ है। पकी फसलों (विशेषकर ज्वार/मकई) की कटाई बेझिझक शुरू कर सकते हैं।")
        }
    ]
    
    return {
        "district": district,
        "latitude": lat,
        "longitude": lon,
        "temp": current.get("temperature", 31.2),
        "wind": current.get("windspeed", 11.5),
        "weathercode": current.get("weathercode", 3),
        "rainWarning": rain_warning,
        "rainSoon": rain_soon,
        "daily": daily,
        "recommendations": recommendations
    }


# ════════════════════════════════════════════════════════════
# ENDPOINT 3: Market Prices (Simulated Agmarknet)
# ════════════════════════════════════════════════════════════

@app.get("/api/market/prices")
async def market_prices(district: str = "Nashik"):
    """Simulated high-fidelity Agmarknet / data.gov.in mandi prices."""
    return get_market_prices(district)


# ════════════════════════════════════════════════════════════
# ENDPOINT 4: Voice Consultant (Gemini / Groq AI)
# ════════════════════════════════════════════════════════════

class VoiceConsultRequest(BaseModel):
    question: str
    language: str = "HI"  # HI, MR, EN


async def call_gemini_text(prompt: str) -> str:
    """Call Gemini text generation API."""
    if not GEMINI_API_KEY:
        return None
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 200:
            result = resp.json()
            return result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    return None


async def call_groq(prompt: str) -> str:
    """Call Groq API as secondary fallback."""
    if not GROQ_API_KEY:
        return None
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            result = resp.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "")
    return None


@app.post("/api/voice-consult")
async def voice_consult(request: VoiceConsultRequest):
    """
    Voice consultant endpoint.
    Pipeline: Gemini -> Groq -> Offline Fallback
    """
    question = request.question
    language = request.language
    
    if not question:
        raise HTTPException(status_code=400, detail="कृपया सवाल पूछें।")
    
    lang_name = {"HI": "Hindi", "MR": "Marathi", "EN": "English"}.get(language, "Hindi")
    
    prompt = f"""You are KisanVaani, an empathetic, expert agricultural specialist who helps Indian farmers adopt Natural Farming (ZBNF), soil regeneration, and organic crop methods.
Understand the user's query and respond in a clear, friendly, and comprehensive manner.
Query: "{question}"
Respond in {lang_name} (using Devanagari script for Hindi/Marathi). Keep the reply professional and direct, highlighting organic preparations like Jeevamrutha, Dashaparni Ark, Neem leaf extract, or Beejamrutha where relevant. Keep the response length below 150 words."""

    # Try Gemini first
    answer = await call_gemini_text(prompt)
    source = "Gemini API"
    
    # Fallback to Groq
    if not answer:
        answer = await call_groq(prompt)
        source = "Groq API"
    
    # Final offline fallback
    if not answer:
        source = "Offline Fallback"
        if language == "MR":
            answer = "जीवामृत बनवण्यासाठी साहित्य: १० किलो सेंद्रिय गाईचे शेण, १० लीटर गोमूत्र, २ किलो गुळ, २ किलो हरभरा डाळीचे पीठ, आणि १ किलो झाडाखालील जिवंत माती. २०० लीटर पाण्यात मिसळून ४८ तास सावलीत ठेवा व दिवसातून दोनदा काठीने हलवा."
        elif language == "EN":
            answer = "To prepare Jeevamrutha: Mix 10 kg fresh cow dung, 10 liters cow urine, 2 kg jaggery, 2 kg gram flour, and 1 kg soil from under a tree in 200 liters of water. Stir twice daily and let it ferment for 48 hours in shade. This is the cornerstone of Zero Budget Natural Farming."
        else:
            answer = "जीवामृत बनाने के लिए आवश्यक सामग्री: 10 किलो जैविक गाय का गोबर, 10 लीटर गोमूत्र, 2 किलो पुराना गुड़, 2 किलो बेसन (चने का आटा) और 1 किलो पेड़ के नीचे की सजीव मिट्टी। इसे 200 लीटर पानी में मिलाकर 48 घंटे के लिए छायादार स्थान पर लकड़ी से चलाएं।"
    
    return {
        "transcription": question,
        "detectedLanguage": language,
        "answer": answer,
        "source": source,
        "simulatedTTS": source == "Offline Fallback"
    }


# ════════════════════════════════════════════════════════════
# ENDPOINT 5: Finance & Subsidies
# ════════════════════════════════════════════════════════════

@app.get("/api/finance/subsidies")
async def finance_subsidies():
    """Government subsidy information, PM-Kisan status, and KCC loan details."""
    return SUBSIDIES_DATA


# ════════════════════════════════════════════════════════════
# ENDPOINT 6: Education Lessons
# ════════════════════════════════════════════════════════════

@app.get("/api/education/lessons")
async def education_lessons():
    """ZBNF training lessons database."""
    return {"lessons": LESSONS_DATABASE}


# ════════════════════════════════════════════════════════════
# ENDPOINT 7: Seed Recommendations (Rule-based engine)
# ════════════════════════════════════════════════════════════

@app.get("/api/seeds/recommend")
async def seed_recommend(season: str = "kharif", soil_type: str = "black", region: str = "Maharashtra"):
    """Rule-based seed recommendation engine based on season + soil + region."""
    
    recommendations = {
        ("kharif", "black", "Maharashtra"): [
            {"crop": "Soybean — सोयाबीन", "variety": "JS-9305", "source": "ICAR", "tip": "काली मिट्टी और अच्छी बारिश में उच्च उत्पादकता"},
            {"crop": "Cotton — कपास", "variety": "NH-615 (Non-Bt)", "source": "PDKV Akola", "tip": "प्राकृतिक कृषि के लिए उपयुक्त, कम पानी चाहिए"},
            {"crop": "Tur Dal — तूर दाल", "variety": "ICPL-87119 (Asha)", "source": "ICRISAT", "tip": "150 दिन में तैयार, कम वर्षा सहनशील"}
        ],
        ("rabi", "black", "Maharashtra"): [
            {"crop": "Wheat — गेहूं", "variety": "NIAW-3170 (Phule Samadhan)", "source": "MPKV Rahuri", "tip": "सिंचित क्षेत्रों में सर्वश्रेष्ठ उपज"},
            {"crop": "Gram — चना", "variety": "Vijay (ICCV-2)", "source": "ICAR", "tip": "बारानी खेती में उत्तम, 90-95 दिन"},
            {"crop": "Safflower — कुसुम", "variety": "Bhima", "source": "NRCS Solapur", "tip": "कम पानी, तिलहन फसल, काली मिट्टी उपयुक्त"}
        ],
        ("kharif", "red", "Maharashtra"): [
            {"crop": "Groundnut — मूंगफली", "variety": "TAG-24", "source": "ICAR", "tip": "लाल मिट्टी में बेहतरीन उत्पादकता"},
            {"crop": "Finger Millet — रागी", "variety": "Phule Nachni", "source": "MPKV", "tip": "पोषक अनाज, कम वर्षा सहनशील"},
            {"crop": "Pearl Millet — बाजरा", "variety": "ICTP-8203", "source": "ICRISAT", "tip": "सूखा प्रतिरोधी, 70-80 दिन में तैयार"}
        ],
    }
    
    key = (season.lower(), soil_type.lower(), region)
    seeds = recommendations.get(key, recommendations[("kharif", "black", "Maharashtra")])
    
    return {
        "season": season,
        "soilType": soil_type,
        "region": region,
        "recommendations": seeds
    }


# ════════════════════════════════════════════════════════════
# ENDPOINT 8: Jeevamrutha Dosage Calculator
# ════════════════════════════════════════════════════════════

@app.get("/api/calculator/jeevamrutha")
async def jeevamrutha_calculator(field_acres: float = 1.0):
    """Calculate exact Jeevamrutha quantities based on field size."""
    # Standard: 200 liters for 1 acre
    water = round(field_acres * 200, 1)
    cow_dung = round(field_acres * 10, 1)
    cow_urine = round(field_acres * 10, 1)
    jaggery = round(field_acres * 2, 1)
    gram_flour = round(field_acres * 2, 1)
    soil = round(field_acres * 1, 1)
    
    return {
        "fieldAcres": field_acres,
        "recipe": {
            "water_liters": water,
            "cow_dung_kg": cow_dung,
            "cow_urine_liters": cow_urine,
            "jaggery_kg": jaggery,
            "gram_flour_kg": gram_flour,
            "live_soil_kg": soil
        },
        "instructions_hi": f"विधि: {water} लीटर पानी में {cow_dung} किलो गोबर, {cow_urine} लीटर गोमूत्र, {jaggery} किलो गुड़, {gram_flour} किलो बेसन और {soil} किलो जीवित मिट्टी मिलाएं। 48 घंटे छायादार स्थान पर रखें, दिन में 2 बार लकड़ी से हिलाएं।",
        "application": f"तैयार जीवामृत को {field_acres} एकड़ खेत में शाम के समय सिंचाई के पानी के साथ या सीधे पौधों की जड़ों पर डालें। महीने में 2 बार उपयोग करें।"
    }


# ════════════════════════════════════════════════════════════
# Health Check
# ════════════════════════════════════════════════════════════

@app.get("/")
async def health_check():
    return {
        "status": "🌾 KisanVani Backend is running!",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/disease/predict",
            "GET  /api/weather-advisory",
            "GET  /api/market/prices",
            "POST /api/voice-consult",
            "GET  /api/finance/subsidies",
            "GET  /api/education/lessons",
            "GET  /api/seeds/recommend",
            "GET  /api/calculator/jeevamrutha",
        ],
        "models": {
            "disease": f"HuggingFace: {HF_MODEL}",
            "llm_primary": "Gemini 2.0 Flash",
            "llm_fallback": "Groq Llama 3.3 70B",
        },
        "api_keys_configured": {
            "gemini": bool(GEMINI_API_KEY),
            "groq": bool(GROQ_API_KEY),
            "huggingface": bool(HF_API_TOKEN),
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
