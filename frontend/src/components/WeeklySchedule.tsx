"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  image_url: string | null;
  hosts: {
    name: string;
    photo_url: string | null;
  } | null;
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export default function WeeklySchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Definir dia atual como selecionado por padrão (0-6)
    const currentDay = new Date().getDay();
    setSelectedDay(currentDay);

    const fetchSchedule = async () => {
      setIsLoading(true);
      // Query com relacionamento join na tabela hosts
      const { data, error } = await supabase
        .from("schedules")
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          day_of_week,
          image_url,
          hosts (
            name,
            photo_url
          )
        `)
        .order("start_time", { ascending: true });

      if (data && !error) {
        setSchedule(data as unknown as ScheduleItem[]);
      } else if (error) {
        console.error("Erro ao buscar programação:", error);
      }
      setIsLoading(false);
    };

    fetchSchedule();
  }, []);

  // Filtrar programação do dia selecionado
  const filteredSchedule = schedule.filter((item) => item.day_of_week === selectedDay);

  // Formatar horário TIME (ex: "08:00:00" -> "08:00")
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  return (
    <div className="w-full bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-bold text-white">Grade de Programação</h3>
      </div>

      {/* Tabs dos dias da semana */}
      <div role="tablist" aria-label="Dias da semana" className="flex overflow-x-auto gap-2 pb-3 mb-6 scrollbar-thin border-b border-zinc-800">
        {DAYS_OF_WEEK.map((dayName, idx) => {
          const isToday = new Date().getDay() === idx;
          const isSelected = selectedDay === idx;
          return (
            <button
              key={idx}
              role="tab"
              aria-selected={isSelected}
              id={`tab-${idx}`}
              aria-controls={`panel-${idx}`}
              onClick={() => setSelectedDay(idx)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/25"
                  : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {dayName}
              {isToday && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-primary-500"
                  } animate-pulse`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista da programação */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 font-medium">Carregando programação...</span>
        </div>
      ) : filteredSchedule.length > 0 ? (
        <div
          role="tabpanel"
          id={`panel-${selectedDay}`}
          aria-labelledby={`tab-${selectedDay}`}
          className="grid gap-4 md:grid-cols-2"
        >
          {filteredSchedule.map((item) => (
            <div
              key={item.id}
              className="glass-panel rounded-xl p-4 flex gap-4 items-start transition-all hover:border-zinc-700/50"
            >
              {/* Imagem do programa ou locutor */}
              <div className="relative w-16 h-16 rounded-lg bg-zinc-800 border border-zinc-700/30 overflow-hidden flex-shrink-0">
                {item.image_url || item.hosts?.photo_url ? (
                  <img
                    src={item.image_url || item.hosts?.photo_url || ""}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-950">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-accent-400 text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-normal leading-relaxed">
                  {item.description || "Sem descrição disponível."}
                </p>
                {item.hosts?.name && (
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                    Locução: {item.hosts.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`panel-${selectedDay}`}
          aria-labelledby={`tab-${selectedDay}`}
          className="text-center py-12 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-xl"
        >
          <p className="text-sm text-zinc-500 font-medium">Nenhum programa agendado para este dia.</p>
        </div>
      )}
    </div>
  );
}
