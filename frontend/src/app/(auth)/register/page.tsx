"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Step = "info" | "otp" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState({ phone: "", full_name: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Nhập đủ 6 chữ số"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-otp", { phone: form.phone, otp: code });
      setStep("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Mã OTP không đúng");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏓</div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký tham gia</h1>
          <p className="text-gray-500 mt-1">Tạo tài khoản Pickleball Hub</p>
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["info", "otp"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === s ? "bg-green-600 text-white" :
                  (step === "otp" && s === "info") ? "bg-green-200 text-green-700" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {step === "otp" && s === "info" ? "✓" : i + 1}
                </div>
                <span className="text-xs text-gray-500">
                  {s === "info" ? "Thông tin" : "Xác minh OTP"}
                </span>
                {i === 0 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Info */}
        {step === "info" && (
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Tiếp tục →"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-green-600 font-medium hover:underline">Đăng nhập</a>
            </p>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Mã xác minh đã được gửi đến số
              </p>
              <p className="font-semibold text-gray-900">{form.phone}</p>
            </div>
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Đang xác minh..." : "Xác minh & Hoàn tất"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("info"); setOtp(["","","","","",""]); setError(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              ← Quay lại
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-700 font-medium text-lg">Đăng ký thành công!</p>
            <p className="text-gray-500 text-sm mt-1">Đang chuyển đến trang đăng nhập...</p>
          </div>
        )}
      </div>
    </div>
  );
}
