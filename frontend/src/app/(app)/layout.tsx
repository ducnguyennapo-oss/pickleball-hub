import Navbar from "@/components/layout/Navbar";
import AuthInitializer from "@/components/layout/AuthInitializer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthInitializer />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
