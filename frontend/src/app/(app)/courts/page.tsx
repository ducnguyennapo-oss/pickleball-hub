"use client";
import { useState } from "react";
import useSWR from "swr";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";
import CourtCard from "@/components/court/CourtCard";
import { useSSE } from "@/hooks/useSSE";
import type { CourtAvailability } from "@/types";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function CourtsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  useSSE(); // Listen for realtime slot updates

  const { data, isLoading } = useSWR<CourtAvailability[]>(
    `/courts/availability?play_date=${selectedDate}`,
    fetcher,
    { refreshInterval: 0 }
  );

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE dd/MM", { locale: vi }) };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đặt sân pickleball</h1>
        <p className="text-gray-500 mt-1">Chọn ngày và slot phù hợp</p>
      </div>

      {/* Date picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {dates.map((d) => (
          <button
            key={d.value}
            onClick={() => setSelectedDate(d.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedDate === d.value
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-green-400"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.map((availability) => (
            <CourtCard key={availability.court.id} availability={availability} selectedDate={selectedDate} />
          ))}
        </div>
      )}
    </div>
  );
}
