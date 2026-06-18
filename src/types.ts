export type TabId = "home" | "disease" | "market" | "learn" | "profile";

export interface CropPrice {
  id: string;
  emoji: string;
  name: string;
  category: string;
  price: number;
  change: number;
  trend: "up" | "down" | "stable";
  sparkline: number[];
  mandi: string;
  prediction: string;
}

export interface WeatherAdvisory {
  id: string;
  title: string;
  text: string;
}

export interface WeatherResponse {
  district: string;
  latitude: string;
  longitude: string;
  temp: number;
  wind: number;
  weathercode: number;
  rainWarning: string;
  rainSoon: boolean;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weathercode: number[];
  };
  recommendations: WeatherAdvisory[];
}

export interface DiseaseRemedy {
  name: string;
  instruction: string;
}

export interface DiseaseResult {
  disease: string;
  pestsDetected?: string;
  confidence: string;
  crop: string;
  analysisText: string;
  remedies: DiseaseRemedy[];
  belowLimit?: boolean;
}

export interface EducationLesson {
  id: string;
  title: string;
  duration: string;
  progress: number;
  category: string;
  difficulty: "सभी स्तर (Beginner)" | "मध्यम (Intermediate)" | "उन्नत (Advanced)";
  completed: boolean;
  speaker: string;
  description: string;
}

export interface SubsidyScheme {
  id: string;
  name: string;
  benefit: string;
  eligibility: string;
  statusColor: "success" | "warning";
  description: string;
}
