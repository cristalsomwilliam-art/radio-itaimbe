"use client";

import React, { useEffect } from "react";

export default function Player() {
  useEffect(() => {
    const runRescan = () => {
      // @ts-ignore
      if (typeof window !== "undefined" && typeof window.casterfmWidgetsRescan === "function") {
        // @ts-ignore
        window.casterfmWidgetsRescan();
      }
    };

    const existingScript = document.getElementById("casterfm-embed-script");

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.cloud.caster.fm/widgets/embed.js";
      script.id = "casterfm-embed-script";
      script.async = true;
      script.onload = () => {
        setTimeout(runRescan, 100);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(runRescan, 100);
    }
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/95 border-t border-zinc-800/80 shadow-2xl backdrop-blur-md select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[90px] py-1">
        {/* Widget oficial com links requeridos para validação do iframe */}
        <div
          data-type="newStreamPlayer"
          data-publicToken="1e6fbe9d-1219-4da6-ba83-37a55b5e4cb0"
          data-theme="dark"
          data-color="ef4444"
          data-channelId=""
          data-rendered="false"
          className="cstrEmbed w-full flex justify-center"
        >
          <a href="https://www.caster.fm" target="_blank" rel="noopener noreferrer">Shoutcast Hosting</a>
          <a href="https://www.caster.fm" target="_blank" rel="noopener noreferrer">Stream Hosting</a>
          <a href="https://www.caster.fm" target="_blank" rel="noopener noreferrer">Radio Server Hosting</a>
        </div>
      </div>
    </div>
  );
}
