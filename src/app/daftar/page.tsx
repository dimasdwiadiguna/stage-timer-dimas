"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isValidWaNumber, formatWaNumber } from "@/lib/utils";

export default function DaftarPage() {
  const [form, setForm] = useState({ name: "", wa_number: "", session_code: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ name: string; wa: string; session: string } | null>(null);

  const adminWa = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) { toast.error("Nama lengkap wajib diisi"); return; }
    if (!isValidWaNumber(form.wa_number)) {
      toast.error("Format nomor WhatsApp tidak valid (contoh: 081234567890)");
      return;
    }
    if (!/^\d{6}$/.test(form.session_code)) {
      toast.error("Kode sesi harus 6 digit angka");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Pendaftaran gagal"); return; }
      setSuccess({ name: data.student_name, wa: formatWaNumber(form.wa_number), session: data.session_name });
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const pesan = encodeURIComponent(
      `Halo Admin, saya ${success.name} dengan nomor WA ${success.wa} ingin mendaftar Try Out ${success.session}. Mohon verifikasi pembayaran saya. Terima kasih.`
    );
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h1>
          <p className="text-gray-600 text-sm mb-6">
            Langkah selanjutnya: kirim bukti pembayaran ke admin via WhatsApp.
          </p>
          <a
            href={`https://wa.me/${adminWa}?text=${pesan}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white py-4 rounded-xl font-semibold text-base
              hover:bg-green-600 active:bg-green-700 transition-colors mb-3 min-h-[48px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Kirim Bukti ke Admin via WhatsApp
          </a>
          <p className="text-xs text-gray-400 mb-4">
            Setelah admin mengkonfirmasi, Anda akan menerima password untuk login.
          </p>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Kembali ke Beranda</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-5">
          <Link href="/" className="text-blue-200 text-sm hover:text-white flex items-center gap-1 mb-3">
            ← Kembali
          </Link>
          <h1 className="text-xl font-bold text-white">Daftar Try Out</h1>
          <p className="text-blue-200 text-sm mt-1">Isi formulir pendaftaran di bawah ini</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            <p className="text-xs text-gray-400 mt-1">Format: dimulai dengan 08 atau 628</p>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base
              hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>
        </form>
      </div>
    </main>
  );
}
