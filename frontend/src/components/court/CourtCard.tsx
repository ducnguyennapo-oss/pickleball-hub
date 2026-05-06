"use client";
import { useState, useEffect } from "react";
import { formatCurrency, getSlotStatusColor } from "@/lib/utils";
import BookingModal from "./BookingModal";
import type { CourtAvailability, CourtSlot } from "@/types";

interface Props {
  availability: CourtAvailability;
  selectedDate: string;
}

function useCountdowns(date: string, slots: CourtSlot[]) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  return slots.map((slot) => {
    const target = new Date(`${date}T${slot.start_time}`);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h${m}p` : `${m}p`;
  });
}

const AVATAR_COLORS = [
  "bg-blue-400", "bg-purple-400", "bg-orange-400",
  "bg-pink-400", "bg-teal-400", "bg-indigo-400",
];

export default function CourtCard({ availability, selectedDate }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const countdowns = useCountdowns(selectedDate, availability.slots);

  function handleSlotClick(slot: CourtSlot) {
    if (slot.status === "full" || slot.status === "closed") return;
    if (expandedSlotId === slot.id) {
      setSelectedSlot(slot);
    } else {
      setExpandedSlotId(slot.id);
    }
  }

  const expandedSlot = availability.slots.find((s) => s.id === expandedSlotId) ?? null;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{availability.court.name}</h3>
          <span className="text-xs text-gray-400">{availability.slots.length} khung giờ</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {availability.slots.map((slot, idx) => {
            const countdown = countdowns[idx];
            const isExpanded = expandedSlotId === slot.id;
            const disabled = slot.status === "full" || slot.status === "closed";
            return (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                disabled={disabled}
                className={`rounded-lg border p-2 text-left transition ${
                  disabled
                    ? "opacity-60 cursor-not-allowed"
                    : isExpanded
                    ? "border-green-500 ring-1 ring-green-400 cursor-pointer"
                    : "hover:border-green-400 hover:bg-green-50 cursor-pointer"
                } ${getSlotStatusColor(slot.status)}`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold">{slot.start_time.slice(0, 5)}</p>
                  {countdown && (
                    <span className="text-[9px] text-gray-400 leading-tight">⏱{countdown}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{slot.end_time.slice(0, 5)}</p>

                {/* Players count + avatars */}
                <div className="mt-1">
                  <p className="text-xs font-medium">
                    {slot.current_players}/{slot.max_players} 👥
                  </p>
                  {slot.players && slot.players.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {slot.players.slice(0, 3).map((p, i) => (
                        <span
                          key={p.id}
                          title={p.full_name}
                          className={`w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center font-bold ${
                            AVATAR_COLORS[i % AVATAR_COLORS.length]
                          }`}
                        >
                          {p.full_name[0]}
                        </span>
                      ))}
                      {slot.players.length > 3 && (
                        <span className="text-[8px] text-gray-400 self-center">
                          +{slot.players.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs mt-0.5">{formatCurrency(slot.price)}</p>
              </button>
            );
          })}
        </div>

        {/* Expanded slot detail */}
        {expandedSlot && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-green-800">
                {expandedSlot.start_time.slice(0, 5)} – {expandedSlot.end_time.slice(0, 5)}
              </p>
              <button
                onClick={() => setExpandedSlotId(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>
                Người tham gia: <strong>{expandedSlot.current_players}/{expandedSlot.max_players}</strong>
              </span>
              <span>{formatCurrency(expandedSlot.price)}/người</span>
            </div>

            {/* Player list */}
            {expandedSlot.players && expandedSlot.players.length > 0 ? (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Đã tham gia:</p>
                <div className="flex flex-wrap gap-1">
                  {expandedSlot.players.map((p, i) => (
                    <span
                      key={p.id}
                      className={`flex items-center gap-1 text-xs text-white px-2 py-0.5 rounded-full ${
                        AVATAR_COLORS[i % AVATAR_COLORS.length]
                      }`}
                    >
                      {p.full_name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-3">Chưa có ai tham gia</p>
            )}

            {/* Slot remaining time */}
            {(() => {
              const target = new Date(`${selectedDate}T${expandedSlot.start_time}`);
              const diff = target.getTime() - Date.now();
              if (diff > 0) {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return (
                  <p className="text-xs text-green-700 mb-2">
                    ⏱ Còn <strong>{h > 0 ? `${h} giờ ${m} phút` : `${m} phút`}</strong> đến giờ chơi
                  </p>
                );
              }
              return null;
            })()}

            <button
              onClick={() => setSelectedSlot(expandedSlot)}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1.5 rounded-lg transition"
            >
              Đặt sân ngay
            </button>
          </div>
        )}
      </div>

      {selectedSlot && (
        <BookingModal
          court={availability.court}
          slot={selectedSlot}
          date={selectedDate}
          onClose={() => {
            setSelectedSlot(null);
            setExpandedSlotId(null);
          }}
        />
      )}
    </>
  );
}
