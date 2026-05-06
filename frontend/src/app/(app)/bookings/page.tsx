"use client";
import useSWR from "swr";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/types";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Đã đăng ký", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", color: "bg-gray-100 text-gray-500" },
  attended: { label: "Đã tham dự", color: "bg-blue-100 text-blue-700" },
  no_show: { label: "Vắng mặt", color: "bg-red-100 text-red-600" },
};

export default function BookingsPage() {
  const { data: bookings, isLoading, mutate } = useSWR<Booking[]>("/bookings/me", fetcher);

  async function cancelBooking(id: string) {
    if (!confirm("Bạn có chắc muốn huỷ đặt sân này?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      mutate();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Không thể huỷ");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử đặt sân</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📅</div>
          <p>Chưa có lịch đặt sân nào</p>
          <a href="/courts" className="mt-3 inline-block text-green-600 hover:underline text-sm font-medium">
            Đặt sân ngay
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings?.map((booking) => {
            const status = STATUS_LABELS[booking.status] || { label: booking.status, color: "bg-gray-100 text-gray-600" };
            return (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{booking.court_name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {new Date(booking.play_date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}
                      {" • "}
                      {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(booking.amount_charged)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Huỷ đăng ký
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
