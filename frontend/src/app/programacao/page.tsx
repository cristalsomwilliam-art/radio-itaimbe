import React from "react";
import WeeklySchedule from "@/components/WeeklySchedule";
import { Calendar } from "lucide-react";

export const metadata = {
  title: "Programação | Rádio Itaimbé 87.9 FM",
  description: "Confira a grade de programação semanal completa da Rádio Itaimbé 87.9 FM. Fique por dentro de nossos locutores, horários e programas.",
};

export default function ProgramacaoPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho de Página */}
      <div className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-400" />
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
            Nossa Programação
          </h1>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 font-medium">
          Confira o que está rolando na rádio de segunda a domingo. Siga seus locutores preferidos.
        </p>
      </div>

      {/* Grade de Programação */}
      <WeeklySchedule />
    </div>
  );
}
