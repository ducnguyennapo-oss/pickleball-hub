"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/request-otp", { phone });
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-otp", { phone, otp_code: otp });
      router.push("/courts");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏓</div>
          <h1 className="text-2xl font-bold text-gray-900">Pickleball Hub</h1>
          <p className="text-gray-500 mt-1">Đăng nhập bằng số điện thoại</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP qua Zalo"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-green-600 font-medium hover:underline">Đăng ký ngay</a>
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP (6 số)</label>
              <p className="text-sm text-gray-500 mb-2">Đã gửi OTP qua Zalo đến số <strong>{phone}</strong></p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-2xl text-center tracking-[0.5em] font-mono"
                maxLength={6}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Đang xác minh..." : "Xác nhận OTP"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
            >
              Đổi số điện thoại
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
