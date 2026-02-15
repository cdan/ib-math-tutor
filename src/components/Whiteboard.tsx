"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import "tldraw/tldraw.css";

// Dynamically import Tldraw with no SSR to avoid hydration mismatches
const TldrawComponent = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-gray-50 text-gray-400">
      <Loader2 className="animate-spin mr-2" /> Loading Canvas...
    </div>
  ),
});

export default function Whiteboard() {
  return (
    <div className="w-full h-full relative">
      <TldrawComponent 
        persistenceKey="ib-math-whiteboard-v4" 
        hideUi={false} 
      />
    </div>
  );
}
