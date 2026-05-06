"use client";
import { useState } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function MembersPage() {
  const { data: members, isLoading, mutate } = useSWR("/admin/members", fetcher);
  const [topupUser, setTopupUser] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState(100000);

  async function handleTopup() {
    if (!topupUser) return;
    try {
      await api.post(`/admin/members/${topupUser.id}/topup`, { amount });
      mutate();
      setTopupUser(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Lỗi nạp tiền");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Thành viên</h1>

      {isLoading ? (
        <p className="text-gray-400">Đang tải...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Họ tên</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">SĐT</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Số dư ví</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Trạng thái</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(m.balance)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${m.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.is_active ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setTopupUser({ id: m.id, name: m.full_name })}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      Nạp tiền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {topupUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTopupUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-1">Nạp tiền thủ công</h2>
            <p className="text-sm text-gray-500 mb-4">{topupUser.name}</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setTopupUser(null)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium">Huỷ</button>
              <button onClick={handleTopup} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold">Nạp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
