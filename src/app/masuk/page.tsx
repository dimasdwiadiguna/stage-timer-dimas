"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function MasukPage() {
  const [form, setForm] = useState({ wa_number: "", session_code: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.wa_number || !form.session_code || !form.password) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/student/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login gagal");
        return;
      }
      router.push(data.redirect || "/tryout");
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-5">
          <Link href="/" className="text-blue-200 text-sm hover:text-white flex items-center gap-1 mb-3">
            ← Kembali
          </Link>
          <h1 className="text-xl font-bold text-white">Login Ujian</h1>
          <p className="text-blue-200 text-sm mt-1">Masuk dengan akun yang sudah disetujui</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
            <input
              type="tel"
              required
              inputMode="numeric"
              value={form.wa_number}
              onChange={(e) => setForm({ ...form, wa_number: e.target.value })}
              placeholder="Contoh: 081234567890"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Sesi</label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={form.session_code}
              onChange={(e) => setForm({ ...form, session_code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="6 digit angka"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              inputMode="numeric"
              maxLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value.replace(/\D/g, "").slice(0, 8) })}
              placeholder="8 digit angka"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
            />
            <p className="text-xs text-gray-400 mt-1">Password dikirim admin via WhatsApp setelah pendaftaran disetujui</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base
              hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-500">
            Belum daftar?{" "}
            <Link href="/daftar" className="text-blue-600 hover:underline font-medium">Daftar Sekarang</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
