<div align="center">

# 🌾 किसानवाणी — KisanVani

### *Aapka Khet, Aapki Aawaz* — Your Farm, Your Voice

**Voice-First AI Agricultural Consultant for Indian Farmers**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## 📖 Overview

KisanVani is a **voice-first, AI-powered agricultural advisory platform** built for Indian farmers practicing **Zero Budget Natural Farming (ZBNF)**. It delivers real-time crop disease diagnosis, mandi prices, weather advisories, and AI-driven farming guidance — all in **Hindi, Marathi, and English** — through an intuitive mobile-first interface designed for rural connectivity and low-bandwidth environments.

---

## 🌟 Key Features

### 🎤 Voice-First Interaction
- Central microphone with pulsating triple-ring animation for voice input
- **Speech-to-Text (STT)** and **Text-to-Speech (TTS)** via Web Speech API
- Voice-guided sell form: 6-step guided flow entirely by speech
- Three language support: Hindi, Marathi, English

### 🌿 Crop Disease Identification
- Upload image via **camera** or **gallery**, or use built-in demo presets
- AI-powered analysis using **Gemini Vision** and **Groq Vision** models
- Returns: disease name, confidence %, severity level, organic remedies, precautions, prevention tips
- Animated green laser scanner during analysis

### 📊 Mandi Market Prices
- Live scrolling marquee on home dashboard
- Simulated Agmarknet data for 6 Maharashtra districts
- 5-day price sparkline charts and 15-day AI trend predictions
- Sell produce: farmers can list crops for sale with voice-guided form

### 🌦️ Weather Advisory
- Real-time weather from **Open-Meteo API** (no key required)
- 7-day forecast with max/min temperature and rain probability
- Dynamic farming recommendations: irrigation, spray timing, harvest tips

### 📚 ZBNF Learning School
- 4 structured lessons on Natural Farming techniques
- Categories: Beejamrutha, Jeevamrutha, Mulching, Whapasa
- Simulated audio player with waveform visualizer
- Progress tracking per lesson

### 💰 Government Schemes & Finance
- PM-Kisan, PMFBY, KCC Loan scheme details with eligibility status
- KCC Loan Calculator with real-time computation
- All data served from backend

### ♿ Accessibility
- **High Contrast Mode** for bright sunlight readability
- Hindi-first UI with Devanagari typography
- Large touch targets (36-48px minimum) for rural smartphone users
- All error messages in farmer-friendly Hindi

### 🔄 Offline Fallback
- Local disease knowledge base (8 diseases, 7 crop types)
- Offline voice responses when AI APIs are unavailable
- Static weather fallback data
- Embedded SVG demo images — no network required

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │  React 19 SPA │    │  Web Speech API (STT / TTS)  │   │
│  │  + Vite       │    │  + SpeechSynthesis           │   │
│  │  + Tailwind 4 │    └──────────────────────────────┘   │
│  │  + Motion     │                                       │
│  └──────┬───────┘                                        │
│         │ fetch() to VITE_API_URL                        │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              FASTAPI BACKEND (Python)                     │
│                  Port 8000                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  API Endpoints                                   │    │
│  │  • POST /api/disease/predict                    │    │
│  │  • POST /api/voice-consult                      │    │
│  │  • GET  /api/weather-advisory                   │    │
│  │  • GET  /api/market/prices                      │    │
│  │  • POST /api/market/listings                    │    │
│  │  • GET  /api/finance/subsidies                  │    │
│  │  • GET  /api/education/lessons                  │    │
│  │  • GET  /api/seeds/recommend                    │    │
│  │  • GET  /api/calculator/jeevamrutha             │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │  AI Fallback Chain                               │    │
│  │  1. Google Gemini (gemini-2.0-flash)            │    │
│  │  2. Groq (llama-3.2-90b-vision / llama-3.3-70b)│    │
│  │  3. Local Knowledge Base (offline)              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  External APIs                                   │    │
│  │  • Open-Meteo (weather, free)                   │    │
│  │  • Google Gemini API                            │    │
│  │  • Groq API                                     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Photo / Voice / Query
        │
        ▼
  React SPA (Vercel — static)
        │
        │ HTTP requests
        ▼
  FastAPI Backend (Render)
        │
        ├──► Gemini Vision/Text API ──► Diagnosis / Voice Answer
        ├──► Groq Vision/Text API   ──► Fallback if Gemini fails
        ├──► Open-Meteo API         ──► Real weather data
        └──► Local Knowledge Base   ──► Offline fallback
```

---

## 🔁 AI Fallback Chains

### Disease Detection
```
Gemini Vision (gemini-2.0-flash, base64 image + prompt)
    │ fail
    ▼
Groq Vision (llama-3.2-90b-vision-preview)
    │ fail
    ▼
Local Knowledge Base (keyword matching, 8 diseases, 7 crops)
```

### Voice Consultation
```
Gemini Text (gemini-2.0-flash / gemini-3.5-flash)
    │ fail
    ▼
Groq Text (llama-3.3-70b-versatile)
    │ fail
    ▼
Offline Responses (pre-written Hindi/Marathi/English)
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.0 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6.2 | Build tool & dev server |
| Tailwind CSS | 4.1 | Utility-first styling |
| Motion (Framer Motion) | 12.23 | Animations |
| Lucide React | 0.546 | Icons |
| @google/genai | 2.4.0 | Gemini SDK |

### Backend
| Technology | Purpose |
|---|---|
| Python 3 | Runtime |
| FastAPI | API framework |
| Uvicorn | ASGI server |
| httpx | Async HTTP client |
| Pydantic | Data validation |
| python-dotenv | Env variable management |

---

## 📁 Project Structure

```
KisanVani/
├── src/                          # React frontend source
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main app — all tabs & overlays
│   ├── types.ts                  # TypeScript interfaces
│   ├── index.css                 # Tailwind CSS + custom animations
│   ├── components/
│   │   ├── SplashScreen.tsx      # Animated splash screen
│   │   └── HomeScreen.tsx        # Dashboard with voice input
│   └── assets/images/            # Static images
│
├── frontend/                     # Express server + build config
│   ├── server.ts                 # API proxy + Vite middleware
│   ├── vite.config.ts            # Vite configuration
│   ├── package.json              # Frontend dependencies
│   └── .env.example              # Environment template
│
├── backend/                      # Python FastAPI backend
│   ├── main.py                   # All API endpoints (980+ lines)
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment template
│
├── public/images/                # Static assets (served by Vite)
├── package.json                  # Root workspace config
├── vercel.json                   # Vercel SPA routing
└── index.html                    # SPA entry HTML
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))
- **Groq API Key** ([Get one here](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/AWMM-22/KisanVani.git
cd KisanVani
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your API keys to .env:
#   GEMINI_API_KEY=your_key
#   GROQ_API_KEY=your_key

python main.py
# Backend runs on http://localhost:8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file
cp .env.example .env
# For local dev, default BACKEND_URL=http://localhost:8000

npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Open in Browser
Navigate to `http://localhost:3000`

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI vision & text |
| `GROQ_API_KEY` | Yes | Groq API key (fallback AI) |
| `HF_API_TOKEN` | No | Hugging Face token for higher rate limits |
| `PORT` | No | Server port (default: 8000, Render auto-sets) |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes (production) | Backend API URL (e.g., `https://your-app.onrender.com`) |
| `BACKEND_URL` | No | Proxy target for local dev (default: `http://localhost:8000`) |
| `PORT` | No | Server port (default: 3000) |

---

## 🌐 Deployment

### Vercel (Frontend SPA)
| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `/` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| **Env Var** | `VITE_API_URL=https://your-backend.onrender.com` |

### Render (Backend)
| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python main.py` |
| **Env Vars** | `GEMINI_API_KEY`, `GROQ_API_KEY` |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/disease/predict` | Crop disease detection (image + symptoms → diagnosis) |
| `POST` | `/api/voice-consult` | AI voice consultation (question → expert answer) |
| `GET` | `/api/weather-advisory` | Weather data + farming advisories (Open-Meteo) |
| `GET` | `/api/market/prices` | Simulated mandi crop prices by district |
| `POST` | `/api/market/listings` | Create farmer sell listing |
| `GET` | `/api/market/listings` | Get all listings by district |
| `DELETE` | `/api/market/listings/:id` | Delete a listing |
| `GET` | `/api/finance/subsidies` | Government scheme details |
| `GET` | `/api/education/lessons` | ZBNF training lessons |
| `GET` | `/api/seeds/recommend` | Seed variety recommendations |
| `GET` | `/api/calculator/jeevamrutha` | Jeevamrutha dosage calculator |

---

## 👨‍🌾 Built With ❤️ for Indian Farmers

KisanVani bridges the gap between modern AI technology and traditional Indian farming. Every feature — from voice-first interaction to Hindi-first design to offline fallbacks — is engineered for the realities of rural India: low bandwidth, bright sunlight, diverse languages, and the wisdom of Zero Budget Natural Farming.

---

<div align="center">

**किसानवाणी** — *Technology जो किसान की भाषा बोले*

</div>
