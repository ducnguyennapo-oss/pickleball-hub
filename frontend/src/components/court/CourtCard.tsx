"use client";
import { useState } from "react";
import { formatCurrency, getSlotStatusLabel, getSlotStatusColor } from "@/lib/utils";
import BookingModal from "./BookingModal";
import type { CourtAvailability, CourtSlot } from "@/types";

interface Props {
  availability: CourtAvailability;
  selectedDate: string;
}

export default function CourtCard({ availability, selectedDate }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{availability.court.name}</h3>
          <span className="text-xs text-gray-400">{availability.slots.length} khung giờ</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {availability.slots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => slot.status !== "full" && slot.status !== "closed" && setSelectedSlot(slot)}
              disabled={slot.status === "full" || slot.status === "closed"}
              className={`rounded-lg border p-2 text-left transition ${
                slot.status === "full" || slot.status === "closed"
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-green-400 hover:bg-green-50 cursor-pointer"
              } ${getSlotStatusColor(slot.status)}`}
            >
              <p className="text-xs font-semibold">{slot.start_time.slice(0, 5)}</p>
              <p className="text-xs">{slot.end_time.slice(0, 5)}</p>
              <p className="text-xs mt-1 font-medium">{slot.current_players}/{slot.max_players}</p>
              <p className="text-xs">{formatCurrency(slot.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedSlot && (
        <BookingModal
          court={availability.court}
          slot={selectedSlot}
          date={selectedDate}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  );
}
