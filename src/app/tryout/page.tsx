"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ExamSession {
  id: string;
  name: string;
  code: string;
  status: string;
  duration_minutes: number;
  scheduled_open_at: string | null;
  instruction_text: string | null;
}

interface SessionInfo {
  registration: {
    id: string;
    students: { name: string; wa_number: string };
    sessions: ExamSession;
  };
  attempt: { id: string; started_at: string; submitted_at: string | null } | null;
}

export default function TryoutPage() {
  const [data, setData] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/student/session");
      if (res.status === 401) { router.push("/masuk"); return; }
      if (!res.ok) { toast.error("Gagal memuat data sesi"); return; }
      const json = await res.json();

      if (json.attempt?.submitted_at) { router.push("/tryout/hasil"); return; }
      if (json.attempt?.started_at) { router.push("/tryout/soal"); return; }

      setData(json);
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Polling every 30s for status
  useEffect(() => {
    const interval = setInterval(fetchSession, 30000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch("/api/student/attempts/start", { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Gagal memulai ujian"); return; }
      router.push("/tryout/soal");
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { sessions: session, students: student } = data.registration;
  const status = session.status;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Selamat datang,</p>
          <h2 className="text-lg font-bold text-gray-900">{student.name}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-lg font-bold text-white">{session.name}</h1>
            <p className="text-blue-200 text-sm">Kode: {session.code || "-"}</p>
          </div>

          {status === "draft" || status === "scheduled" ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-800 mb-2">Sesi Belum Dibuka</h2>
              <p className="text-sm text-gray-500">
                {session.scheduled_open_at
                  ? `Dijadwalkan dibuka pada: ${new Date(session.scheduled_open_at).toLocaleString("id-ID")}`
                  : "Menunggu admin membuka sesi ini."}
              </p>
              <p className="text-xs text-gray-400 mt-3">Halaman ini akan otomatis diperbarui setiap 30 detik.</p>
            </div>
          ) : status === "closed" ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-800 mb-2">Sesi Telah Ditutup</h2>
              <p className="text-sm text-gray-500">Ujian sudah tidak dapat dikerjakan.</p>
            </div>
          ) : (
            /* status === "open" */
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <span className="text-2xl">⏱</span>
                  <div>
                    <p className="text-xs text-gray-500">Durasi</p>
                    <p className="font-semibold text-gray-800">{session.duration_minutes} menit</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-amber-800 mb-2">Petunjuk Pengerjaan:</p>
                {session.instruction_text ? (
                  <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-line">{session.instruction_text}</p>
                ) : (
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Setiap soal tampil satu per satu</li>
                    <li>• Kamu bisa berpindah antar soal</li>
                    <li>• Jawaban tersimpan otomatis</li>
                    <li>• Timer berjalan setelah kamu menekan Mulai</li>
                    <li>• Jawaban dikumpulkan otomatis saat waktu habis</li>
                  </ul>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-base
                  hover:bg-green-600 active:bg-green-700 transition-colors disabled:opacity-50 min-h-[48px]"
              >
                {starting ? "Memulai..." : "Mulai Ujian"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
