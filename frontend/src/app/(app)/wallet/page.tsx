"use client";
import { useState } from "react";
import { useWallet, useTransactions } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000];

export default function WalletPage() {
  const { wallet, refresh } = useWallet();
  const { transactions } = useTransactions();
  const [topupAmount, setTopupAmount] = useState(100000);
  const [provider, setProvider] = useState<"momo" | "zalopay">("momo");
  const [qrData, setQrData] = useState<{ qr_code_url: string; pay_url: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function initTopup() {
    setLoading(true);
    try {
      const { data } = await api.post("/wallet/topup/init", { amount: topupAmount, provider });
      setQrData(data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Có lỗi khi tạo QR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ví của tôi</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-2xl p-6 text-white mb-6">
        <p className="text-green-100 text-sm">Số dư hiện tại</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(wallet?.balance || 0)}</p>
        <p className="text-green-200 text-xs mt-2">Cập nhật: {wallet ? new Date(wallet.updated_at).toLocaleString("vi-VN") : "..."}</p>
      </div>

      {/* Topup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Nạp tiền</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Chọn số tiền</p>
          <div className="grid grid-cols-2 gap-2">
            {TOPUP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setTopupAmount(amount)}
                className={`py-2 rounded-lg text-sm font-medium transition ${
                  topupAmount === amount
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(Number(e.target.value))}
            placeholder="Nhập số tiền khác"
            className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Phương thức</p>
          <div className="flex gap-3">
            {(["momo", "zalopay"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                  provider === p ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"
                }`}
              >
                {p === "momo" ? "MoMo" : "ZaloPay"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={initTopup}
          disabled={loading || topupAmount < 10000}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Đang tạo QR..." : `Nạp ${formatCurrency(topupAmount)} qua ${provider === "momo" ? "MoMo" : "ZaloPay"}`}
        </button>

        {qrData && (
          <div className="mt-4 text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Quét mã QR hoặc nhấn nút bên dưới</p>
            {qrData.qr_code_url && (
              <img src={qrData.qr_code_url} alt="QR Code" className="w-48 h-48 mx-auto mb-3" />
            )}
            <a
              href={qrData.pay_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              Mở ứng dụng thanh toán
            </a>
            <button onClick={() => { setQrData(null); refresh(); }} className="block mx-auto mt-2 text-sm text-gray-500 hover:text-gray-700">
              Đã thanh toán xong
            </button>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Lịch sử giao dịch</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Chưa có giao dịch nào</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{txn.note || txn.type}</p>
                  <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <span className={`font-semibold text-sm ${txn.type === "deduct" ? "text-red-600" : "text-green-600"}`}>
                  {txn.type === "deduct" ? "-" : "+"}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
