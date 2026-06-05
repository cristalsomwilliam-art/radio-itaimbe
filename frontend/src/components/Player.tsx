"use client";

import React from "react";

export default function Player() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/95 border-t border-zinc-800/80 shadow-2xl backdrop-blur-md select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-center h-[90px] overflow-hidden">
        <iframe
          src="https://widgets.cloud.caster.fm/player/?token=1e6fbe9d-1219-4da6-ba83-37a55b5e4cb0&theme=dark&color=ef4444"
          width="100%"
          height="90"
          style={{ border: "none", overflow: "hidden" }}
          scrolling="no"
          title="Rádio Itaimbé 87.9 FM"
          className="w-full"
        />
      </div>
    </div>
  );
}
