"use client";
import { useEffect, useRef, useState } from "react";
import { Expand, X, Play, RotateCcw } from "lucide-react";

interface Props {
  imageUrl: string; // 360° equirectangular image URL
  title?: string;
  autoLoad?: boolean;
}

/**
 * Virtual 360° Room Tour using Pannellum (free, open source)
 * Pannellum is loaded from CDN — no npm install needed.
 *
 * To add 360° images:
 * 1. Take a 360° photo with your phone (any modern phone has this feature)
 * 2. Upload via UploadThing (vendor hotel photos)
 * 3. Pass the URL as imageUrl prop
 *
 * Free sample 360° images for testing:
 * https://pannellum.org/images/alma.jpg
 */
export default function VirtualTour({
  imageUrl,
  title = "Room Virtual Tour",
  autoLoad = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(autoLoad);
  const [fullscreen, setFullscreen] = useState(false);
  const [pannellumReady, setPannellumReady] = useState(false);

  // Load Pannellum CSS + JS from CDN
  useEffect(() => {
    if (document.getElementById("pannellum-css")) {
      setPannellumReady(true);
      return;
    }

    const css = document.createElement("link");
    css.id = "pannellum-css";
    css.rel = "stylesheet";
    css.href =
      "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.onload = () => setPannellumReady(true);
    script.onerror = () =>
      console.error("[VirtualTour] Failed to load Pannellum");
    document.head.appendChild(script);
  }, []);

  // Initialise viewer when loaded and pannellum ready
  useEffect(() => {
    if (!loaded || !pannellumReady || !containerRef.current) return;

    const pannellum = (window as any).pannellum;
    if (!pannellum) return;

    // Destroy previous instance
    if (viewerRef.current) {
      viewerRef.current.destroy();
    }

    viewerRef.current = pannellum.viewer(containerRef.current, {
      type: "equirectangular",
      panorama: imageUrl,
      autoLoad: true,
      autoRotate: -2, // slowly auto-rotate
      compassOffset: 0,
      showFullscreenCtrl: false, // we handle fullscreen ourselves
      showZoomCtrl: true,
      mouseZoom: true,
      hfov: 100,
      pitch: 0,
      yaw: 0,
      strings: {
        loadButtonLabel: "Click to\nLoad 360° Tour",
        loadingLabel: "Loading…",
      },
    });
  }, [loaded, pannellumReady, imageUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      viewerRef.current?.destroy();
    };
  }, []);

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 ${fullscreen ? "fixed inset-0 z-[100] rounded-none" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔭</span>
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
            360°
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loaded && (
            <button
              onClick={() => {
                viewerRef.current?.setPitch(0);
                viewerRef.current?.setYaw(0);
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <X className="w-4 h-4" />
            ) : (
              <Expand className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tour container */}
      {!loaded ? (
        /* Teaser — show static preview with launch button */
        <div
          className="relative bg-slate-800 flex items-center justify-center"
          style={{ height: fullscreen ? "calc(100vh - 50px)" : "280px" }}
        >
          {/* Background hint image */}
          <div
            className="absolute inset-0 opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="relative z-10 text-center">
            <button
              onClick={() => setLoaded(true)}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-xl transition-all group-hover:scale-110">
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  Launch 360° Tour
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Click and drag to look around
                </p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{ height: fullscreen ? "calc(100vh - 50px)" : "280px" }}
          className="w-full"
        />
      )}

      {/* Controls hint */}
      {loaded && !fullscreen && (
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <span>🖱️ Drag to look around · Scroll to zoom</span>
          <span>📱 Touch and drag on mobile</span>
        </div>
      )}
    </div>
  );
}
