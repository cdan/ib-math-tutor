"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import "tldraw/tldraw.css";

// Use unpkg to avoid CORS issues with cdn.tldraw.com
// We'll use a specific version to ensure stability
const ASSET_URL = "https://unpkg.com/@tldraw/assets@2.0.0-alpha.19";

const assetUrls = {
  fonts: `${ASSET_URL}/fonts`,
  icons: `${ASSET_URL}/icons`,
  embedIcons: `${ASSET_URL}/embed-icons`,
  translations: `${ASSET_URL}/translations`,
};

// Dynamically import Tldraw with no SSR
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
        assetUrls={assetUrls}
        hideUi={false} 
      />
    </div>
  );
}
