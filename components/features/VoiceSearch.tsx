"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

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

function extractSearchTerms(transcript: string): { query: string; city: string | null } {
  const lower = transcript.toLowerCase();
  const city = NEPAL_CITIES.find((c) => lower.includes(c)) ?? null;
  const query = lower
    .replace(
      /\b(i want|i need|show me|find me|search for|look for|book|hotel in|hotels in|a hotel|the hotel)\b/gi,
      "",
    )
    .replace(/\b(please|now|quickly)\b/gi, "")
    .trim();
  return { query, city };
}

export default function VoiceSearch({ onResult, onCity, className = "" }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const lastErrorRef = useRef<any>(null);
  const retryTimerRef = useRef<number | null>(null);
  const MAX_RETRIES = 1;

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setSupported(false);
    }

    return () => {
      // cleanup
      try {
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        const r = recognitionRef.current;
        if (r) {
          r.onresult = null;
          r.onend = null;
          r.onstart = null;
          r.onerror = null;
          try {
            r.stop?.();
          } catch (e) {
            // ignore
          }
        }
        recognitionRef.current = null;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const createRecognition = (autoStart = true) => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return null;
    }

    // Clean previous instance
    try {
      const prev = recognitionRef.current;
      if (prev) {
        prev.onresult = null;
        prev.onend = null;
        prev.onstart = null;
        prev.onerror = null;
        try {
          prev.stop?.();
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configuration for better reliability
    recognition.lang = "en-US"; // Changed from en-IN for better compatibility
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setPulse(true);
      setTranscript("");
      setErrorMsg(null);
      setShowFallback(false);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        const { city } = extractSearchTerms(text);
        onResult(text);
        if (city && onCity) onCity(city.charAt(0).toUpperCase() + city.slice(1));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[VOICE] error", event.error);
      lastErrorRef.current = event;
      const code = event.error;

      // Network errors: retry once, then show fallback
      if (code === "network" && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setErrorMsg("🔄 Network error detected. Retrying...");
        
        try {
          recognition.stop?.();
        } catch (e) {
          // ignore
        }

        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
        }

        // Wait before retrying
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null;
          setErrorMsg(null);
          setTranscript("");
          try {
            const newRecognition = createRecognition(true);
            if (!newRecognition) {
              setErrorMsg("❌ Failed to restart voice recognition");
              setShowFallback(true);
            }
          } catch (e) {
            console.error("[VOICE] retry failed", e);
            setErrorMsg("❌ Retry failed. Please use text input instead.");
            setShowFallback(true);
          }
        }, 500);

        return;
      }

      // After retries exhausted or other errors
      const message =
        code === "not-allowed"
          ? "❌ Microphone access denied. Please enable microphone in your browser settings and try again."
          : code === "no-speech"
          ? "🔇 No speech detected. Please speak clearly and try again."
          : code === "network"
          ? "📡 Network issue with speech service. Using text input instead."
          : code === "service-not-available"
          ? "⚠️ Speech service temporarily unavailable. Try again in a moment."
          : code === "bad-grammar"
          ? "📝 Couldn't process your speech. Try again with clearer words."
          : code === "timeout"
          ? "⏱️ Request timed out. Please try again."
          : `Error: ${code}. Please try again.`;

      setErrorMsg(message);
      setShowFallback(true);
      setListening(false);
      setPulse(false);
    };

    recognition.onend = () => {
      setListening(false);
      setPulse(false);
    };

    if (autoStart) {
      try {
        recognition.start();
      } catch (e) {
        console.error("[VOICE] start failed", e);
      }
    }

    return recognition;
  };

  const startListening = () => {
    // reset state and start fresh
    retryCountRef.current = 0;
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    createRecognition(true);
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      /* ignore */
    }
    setListening(false);
    setPulse(false);
    retryCountRef.current = 0;
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  if (!supported) {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}>
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
              <span className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
              <span className="w-1.5 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "250ms" }} />
            </div>
            <p className="text-xs text-slate-500">Listening…</p>
            {transcript && (
              <p className="text-xs text-slate-700 font-medium bg-slate-100 rounded-lg px-3 py-1 max-w-xs">{`"${transcript}"`}</p>
            )}
            <p className="text-xs text-slate-400">Say a city or hotel type</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Tap to search by voice</p>
            <p className="text-xs text-slate-400">Try: "hotel in Pokhara"</p>
          </div>
        )}
        {errorMsg && (
          <div className="mt-2 max-w-xs text-left">
            <p className="text-xs text-red-600">{errorMsg}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  // manual retry: reset count and start
                  retryCountRef.current = 0;
                  setErrorMsg(null);
                  setShowFallback(false);
                  startListening();
                }}
                className="text-xs px-2 py-1 bg-slate-100 rounded-xl"
              >
                Retry
              </button>
              {showFallback && (
                <div className="flex items-center gap-2">
                  <input
                    value={fallbackText}
                    onChange={(e) => setFallbackText(e.target.value)}
                    placeholder="Type your search..."
                    className="text-xs px-2 py-1 rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={() => {
                      if (fallbackText.trim()) {
                        onResult(fallbackText.trim());
                        setFallbackText("");
                        setShowFallback(false);
                        setErrorMsg(null);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-emerald-100 rounded-xl"
                  >
                    Send
                  </button>
                </div>
              )}
              <button
                onClick={async () => {
                  // copy diagnostics
                  const evt = lastErrorRef.current;
                  const payload = evt
                    ? JSON.stringify({ error: evt.error, message: evt.message, timeStamp: evt.timeStamp }, null, 2)
                    : "no event";
                  try {
                    await navigator.clipboard.writeText(payload);
                    setErrorMsg("Diagnostics copied to clipboard");
                    setTimeout(() => setErrorMsg(null), 1500);
                  } catch (e) {
                    setErrorMsg("Failed to copy diagnostics");
                    setTimeout(() => setErrorMsg(null), 1500);
                  }
                }}
                className="text-xs px-2 py-1 bg-slate-100 rounded-xl"
              >
                Copy diagnostics
              </button>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-xs px-2 py-1 bg-slate-100 rounded-xl"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
