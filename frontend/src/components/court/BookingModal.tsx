"use client";
import { useState } from "react";
import { mutate } from "swr";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import type { Court, CourtSlot } from "@/types";

interface Props {
  court: Court;
  slot: CourtSlot;
  date: string;
  onClose: () => void;
}

export default function BookingModal({ court, slot, date, onClose }: Props) {
  const { wallet, refresh: refreshWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canAfford = (wallet?.balance || 0) >= slot.price;

  async function handleBook() {
    setLoading(true);
    setError("");
    try {
      await api.post("/bookings/", { court_slot_id: slot.id });
      setSuccess(true);
      refreshWallet();
      mutate((key) => typeof key === "string" && key.includes("availability"), undefined, { revalidate: true });
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-green-700">Đặt sân thành công!</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Xác nhận đặt sân</h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sân</span>
                <span className="font-medium">{court.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ngày</span>
                <span className="font-medium">{new Date(date).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giờ</span>
                <span className="font-medium">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Người chơi</span>
                <span className="font-medium">{slot.current_players}/{slot.max_players}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                <span className="font-semibold">Chi phí</span>
                <span className="font-bold text-green-700">{formatCurrency(slot.price)}</span>
              </div>
            </div>

            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-600">Số dư ví</span>
              <span className={`font-semibold ${canAfford ? "text-green-700" : "text-red-600"}`}>
                {formatCurrency(wallet?.balance || 0)}
              </span>
            </div>

            {!canAfford && (
              <p className="text-red-500 text-sm mb-3 text-center">
                Số dư không đủ.{" "}
                <a href="/wallet" className="underline font-medium">Nạp tiền ngay</a>
              </p>
            )}

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={handleBook}
                disabled={loading || !canAfford}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Đang đặt..." : "Xác nhận đặt sân"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
