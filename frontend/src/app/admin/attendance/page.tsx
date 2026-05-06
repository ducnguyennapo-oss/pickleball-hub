"use client";
import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const { data: availability } = useSWR(`/courts/availability?play_date=${selectedDate}`, fetcher);
  const { data: attendees, mutate } = useSWR(
    selectedSlotId ? `/attendance/slot/${selectedSlotId}` : null,
    fetcher
  );

  async function checkin(bookingId: string) {
    try {
      await api.post(`/attendance/${bookingId}/checkin`);
      mutate();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Lỗi điểm danh");
    }
  }

  const allSlots = availability?.flatMap((a: any) =>
    a.slots.map((s: any) => ({ ...s, court_name: a.court.name }))
  ) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Điểm danh</h1>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlotId(""); }}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn slot</label>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Chọn sân và khung giờ --</option>
            {allSlots.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.court_name} | {s.start_time.slice(0, 5)}-{s.end_time.slice(0, 5)} ({s.current_players}/{s.max_players})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSlotId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
            <span className="font-medium text-gray-800">Danh sách người đăng ký</span>
            <span className="text-sm text-gray-500">{attendees?.filter((a: any) => a.checked_in).length || 0}/{attendees?.length || 0} đã điểm danh</span>
          </div>
          {!attendees?.length ? (
            <p className="p-4 text-gray-400 text-sm">Chưa có đăng ký nào</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {attendees.map((a: any) => (
                  <tr key={a.booking_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{a.user_name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.phone}</td>
                    <td className="px-4 py-3 text-center">
                      {a.checked_in ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Đã điểm danh</span>
                      ) : (
                        <button
                          onClick={() => checkin(a.booking_id)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                        >
                          Điểm danh
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
