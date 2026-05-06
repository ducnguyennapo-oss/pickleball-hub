import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5); // "06:00:00" → "06:00"
}

export function getSlotStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "Còn trống",
    partial: "Còn chỗ",
    full: "Đã đầy",
    closed: "Đã đóng",
  };
  return labels[status] || status;
}

export function getSlotStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-green-100 text-green-800 border-green-200",
    partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
    full: "bg-red-100 text-red-800 border-red-200",
    closed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return colors[status] || "bg-gray-100 text-gray-500";
}
