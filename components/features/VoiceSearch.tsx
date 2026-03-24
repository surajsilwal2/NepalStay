"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";

interface Props {
  onResult: (transcript: string) => void;
  onCity?: (city: string) => void;
  className?: string;
}

// Nepal cities we try to detect from speech
const NEPAL_CITIES = [
  "kathmandu",
  "pokhara",
  "chitwan",
  "nagarkot",
  "lumbini",
  "bhaktapur",
  "patan",
  "namche",
  "janakpur",
  "butwal",
  "dharan",
  "bharatpur",
  "hetauda",
];

// Simple keyword extractor from speech
function extractSearchTerms(transcript: string): {
  query: string;
  city: string | null;
} {
  const lower = transcript.toLowerCase();

  // Detect city
  const city = NEPAL_CITIES.find((c) => lower.includes(c)) ?? null;

  // Clean up common filler words
  const query = lower
    .replace(
      /\b(i want|i need|show me|find me|search for|look for|book|hotel in|hotels in|a hotel|the hotel)\b/gi,
      "",
    )
    .replace(/\b(please|now|quickly)\b/gi, "")
    .trim();

  return { query, city };
}

export default function VoiceSearch({
  onResult,
  onCity,
  className = "",
}: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [pulse, setPulse] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN"; // Works well for Nepali accent
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setPulse(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        const { query, city } = extractSearchTerms(text);
        onResult(text);
        if (city && onCity)
          onCity(city.charAt(0).toUpperCase() + city.slice(1));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[VOICE]", event.error);
      setListening(false);
      setPulse(false);
    };

    recognition.onend = () => {
      setListening(false);
      setPulse(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setPulse(false);
  };

  if (!supported) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}
      >
        <MicOff className="w-4 h-4" />
        Voice search not supported in this browser
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Main mic button */}
      <button
        onClick={listening ? stopListening : startListening}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
          listening
            ? "bg-red-500 hover:bg-red-600 scale-110"
            : "bg-amber-500 hover:bg-amber-600"
        }`}
        title={listening ? "Stop listening" : "Search by voice"}
      >
        {/* Pulse rings when listening */}
        {pulse && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full bg-red-300 animate-pulse opacity-20" />
          </>
        )}

        {listening ? (
          <MicOff className="w-6 h-6 text-white relative z-10" />
        ) : (
          <Mic className="w-6 h-6 text-white relative z-10" />
        )}
      </button>

      {/* Status text */}
      <div className="mt-2 text-center">
        {listening ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "100ms" }}
              />
              <span
                className="w-1.5 h-3 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-2 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: "250ms" }}
              />
            </div>
            <p className="text-xs text-slate-500">Listening…</p>
            {transcript && (
              <p className="text-xs text-slate-700 font-medium bg-slate-100 rounded-lg px-3 py-1 max-w-xs">
                "{transcript}"
              </p>
            )}
            <p className="text-xs text-slate-400">Say a city or hotel type</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Tap to search by voice</p>
            <p className="text-xs text-slate-400">Try: "hotel in Pokhara"</p>
          </div>
        )}
      </div>
    </div>
  );
}
