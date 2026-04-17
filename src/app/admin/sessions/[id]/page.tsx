"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AdminNav from "@/components/AdminNav";
import GeneralTab from "./_tabs/GeneralTab";
import SiswaTab from "./_tabs/SiswaTab";
import SoalTab from "./_tabs/SoalTab";
import AnalitikTab from "./_tabs/AnalitikTab";

interface Session {
  id: string;
  name: string;
  code: string;
  status: string;
  open_mode: string;
  scheduled_open_at: string | null;
  scheduled_close_at: string | null;
  duration_minutes: number;
  instruction_text: string | null;
  closing_text: string | null;
  studentCount: number;
  questionCount: number;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-yellow-100 text-yellow-700",
  open: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-600",
};
const statusLabels: Record<string, string> = {
  draft: "Draft", scheduled: "Terjadwal", open: "Buka", closed: "Tutup",
};

type Tab = "general" | "siswa" | "soal" | "analitik";

export default function SessionDetailPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(new Set<Tab>(["general"]));

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/admin/sessions/${sessionId}`);
    if (!res.ok) { router.push("/admin/sessions"); return; }
    setSession(await res.json());
    setLoading(false);
  }, [sessionId, router]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setVisitedTabs((prev) => { const next = new Set(prev); next.add(tab); return next; });
  }

  async function handleToggle() {
    const res = await fetch(`/api/admin/sessions/${sessionId}/toggle`, { method: "POST" });
    if (res.ok) { toast.success("Status sesi diperbarui"); fetchSession(); }
    else { const d = await res.json(); toast.error(d.error || "Gagal mengubah status"); }
  }

  if (loading) {
    return (
      <>
        <AdminNav />
        <main className="max-w-6xl mx-auto p-6 flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!session) return null;

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "general", label: "General" },
    { key: "siswa", label: "Siswa" },
    { key: "soal", label: "Soal" },
    { key: "analitik", label: "Analitik", disabled: session.status !== "closed" },
  ];

  return (
    <>
      <AdminNav />
      <main className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/admin/sessions" className="hover:text-gray-600">Daftar Sesi</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate">{session.name}</span>
        </div>

        {/* Session Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-xl font-bold text-gray-900">{session.name}</h1>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[session.status]}`}>
                  {statusLabels[session.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-400">Kode:</span>
                <span className="font-mono text-2xl font-black tracking-widest text-blue-600">{session.code}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(session.code); toast.success("Kode disalin!"); }}
                  title="Salin kode"
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                <span>{session.studentCount} peserta</span>
                <span>{session.questionCount} soal</span>
                <span>{session.duration_minutes} menit</span>
                <span>{session.open_mode === "manual" ? "Manual" : "Terjadwal"}</span>
              </div>
              {session.open_mode === "scheduled" && session.scheduled_open_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Buka: {new Date(session.scheduled_open_at).toLocaleString("id-ID")}
                  {session.scheduled_close_at && ` · Tutup: ${new Date(session.scheduled_close_at).toLocaleString("id-ID")}`}
                </p>
              )}
            </div>
            {session.open_mode === "manual" && session.status !== "closed" && (
              <button
                onClick={handleToggle}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex-shrink-0 min-w-[130px]
                  ${session.status === "open"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"}`}
              >
                {session.status === "open" ? "Selesai Sesi" : "Mulai Sesi"}
              </button>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && switchTab(tab.key)}
              disabled={tab.disabled}
              title={tab.disabled ? "Analitik tersedia setelah sesi ditutup" : undefined}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : tab.disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content — all tabs stay mounted once visited to preserve form state */}
        <div className={activeTab === "general" ? "" : "hidden"}>
          {visitedTabs.has("general") && <GeneralTab session={session} onSaved={fetchSession} />}
        </div>
        <div className={activeTab === "siswa" ? "" : "hidden"}>
          {visitedTabs.has("siswa") && <SiswaTab sessionId={sessionId} />}
        </div>
        <div className={activeTab === "soal" ? "" : "hidden"}>
          {visitedTabs.has("soal") && <SoalTab sessionId={sessionId} onCountChange={fetchSession} />}
        </div>
        <div className={activeTab === "analitik" ? "" : "hidden"}>
          {visitedTabs.has("analitik") && <AnalitikTab sessionId={sessionId} />}
        </div>
      </main>
    </>
  );
}
