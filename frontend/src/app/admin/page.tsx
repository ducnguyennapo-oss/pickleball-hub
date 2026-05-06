"use client";
import useSWR from "swr";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function AdminDashboard() {
  const { data: stats } = useSWR("/admin/dashboard", fetcher, { refreshInterval: 30000 });

  const cards = [
    { label: "Đặt sân hôm nay", value: stats?.bookings_today || 0, unit: "lượt" },
    { label: "Tổng thành viên", value: stats?.total_members || 0, unit: "người" },
    { label: "Doanh thu hôm nay", value: formatCurrency(stats?.revenue_today || 0), unit: "" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {card.value} <span className="text-sm font-normal text-gray-400">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
