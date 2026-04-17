"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AdminNav from "@/components/AdminNav";

interface Session {
  id: string;
  name: string;
  code: string;
  status: string;
  open_mode: string;
  scheduled_open_at: string | null;
  scheduled_close_at: string | null;
  duration_minutes: number;
}

interface Registration {
  id: string;
  status: string;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  plain_password: string | null;
  students: { id: string; name: string; wa_number: string };
  sessions: { id: string; name: string; code: string };
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
const regColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};
const regLabels: Record<string, string> = {
  pending: "Pending", approved: "Disetujui", rejected: "Ditolak",
};

export default function SessionDetailPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ regId: string; password: string; name: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    const [sessRes, regRes] = await Promise.all([
      fetch("/api/admin/sessions"),
      fetch(`/api/admin/approvals?session_id=${sessionId}`),
    ]);
    if (sessRes.ok) {
      const sessions: Session[] = await sessRes.json();
      const found = sessions.find((s) => s.id === sessionId);
      if (!found) { router.push("/admin/sessions"); return; }
      setSession(found);
    }
    if (regRes.ok) setRegistrations(await regRes.json());
    setLoading(false);
  }, [sessionId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleToggle() {
    if (!session) return;
    const res = await fetch(`/api/admin/sessions/${sessionId}/toggle`, { method: "POST" });
    if (res.ok) { toast.success("Status sesi diperbarui"); fetchData(); }
    else { const d = await res.json(); toast.error(d.error || "Gagal"); }
  }

  async function handleApprove(regId: string, studentName: string) {
    setActing(true);
    const res = await fetch("/api/admin/approvals/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_id: regId }),
    });
    if (res.ok) {
      const d = await res.json();
      setPasswordModal({ regId, password: d.plain_password, name: studentName });
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal approve");
    }
    setActing(false);
  }

  async function handleClosePasswordModal() {
    if (passwordModal) {
      await fetch(`/api/admin/approvals/clear-password/${passwordModal.regId}`, { method: "POST" });
    }
    setPasswordModal(null);
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActing(true);
    const res = await fetch("/api/admin/approvals/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_id: rejectModal, reason: rejectReason }),
    });
    if (res.ok) {
      toast.success("Pendaftaran ditolak");
      setRejectModal(null); setRejectReason("");
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal reject");
    }
    setActing(false);
  }

  function copyPassword(pwd: string) {
    navigator.clipboard.writeText(pwd);
    toast.success("Password disalin!");
  }

  const filtered = statusFilter === "all"
    ? registrations
    : registrations.filter((r) => r.status === statusFilter);

  const counts = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

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

  return (
    <>
      <AdminNav />
      <main className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/admin/sessions" className="hover:text-gray-600">Daftar Sesi</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{session.name}</span>
        </div>

        {/* Session Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[session.status]}`}>
                  {statusLabels[session.status]}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                <span>Kode: <b className="font-mono text-gray-700 text-base tracking-wider">{session.code}</b></span>
                <span>Durasi: {session.duration_minutes} menit</span>
                <span>Mode: {session.open_mode === "manual" ? "Manual" : "Terjadwal"}</span>
              </div>
              {session.scheduled_open_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Buka: {new Date(session.scheduled_open_at).toLocaleString("id-ID")}
                  {session.scheduled_close_at && ` · Tutup: ${new Date(session.scheduled_close_at).toLocaleString("id-ID")}`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {session.open_mode === "manual" && session.status !== "closed" && (
                <button
                  onClick={handleToggle}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors
                    ${session.status === "open"
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                >
                  {session.status === "open" ? "Tutup Sesi" : "Buka Sesi"}
                </button>
              )}
              <Link
                href={`/admin/sessions/${sessionId}/questions`}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100"
              >
                Kelola Soal
              </Link>
              {session.status === "closed" && (
                <Link
                  href={`/admin/sessions/${sessionId}/analytics`}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100"
                >
                  Analitik
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Approvals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">Peserta</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {counts.all} terdaftar · {counts.pending} pending · {counts.approved} disetujui · {counts.rejected} ditolak
              </p>
            </div>
            {/* Status filter tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${statusFilter === s ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {s === "all" ? `Semua (${counts.all})` : `${regLabels[s]} (${counts[s]})`}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              {statusFilter === "all" ? "Belum ada peserta yang mendaftar." : `Tidak ada peserta dengan status "${regLabels[statusFilter]}".`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Nama</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">No. WA</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Daftar</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{reg.students.name}</td>
                      <td className="px-5 py-3">
                        <a
                          href={`https://wa.me/${reg.students.wa_number}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {reg.students.wa_number}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(reg.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${regColors[reg.status]}`}>
                          {regLabels[reg.status]}
                        </span>
                        {reg.rejection_reason && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">{reg.rejection_reason}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {reg.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(reg.id, reg.students.name)}
                                disabled={acting}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 disabled:opacity-50"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => { setRejectModal(reg.id); setRejectReason(""); }}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {reg.status === "approved" && reg.plain_password && (
                            <button
                              onClick={() => setPasswordModal({ regId: reg.id, password: reg.plain_password!, name: reg.students.name })}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100"
                            >
                              Lihat Password
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-1">Pendaftaran Disetujui!</h2>
            <p className="text-sm text-gray-500 mb-4">Password untuk <b>{passwordModal.name}</b>:</p>
            <div className="bg-gray-100 rounded-xl py-4 px-6 mb-4">
              <p className="text-3xl font-bold font-mono tracking-widest text-gray-900">{passwordModal.password}</p>
            </div>
            <button
              onClick={() => copyPassword(passwordModal.password)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 mb-3"
            >
              Salin Password
            </button>
            <p className="text-xs text-amber-600 mb-4">
              Kirim password ini ke siswa melalui WhatsApp, lalu tutup modal ini. Password akan dihapus setelah modal ditutup.
            </p>
            <button
              onClick={handleClosePasswordModal}
              className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50"
            >
              Tutup & Hapus Password
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-3">Tolak Pendaftaran</h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Alasan (opsional)</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Bukti pembayaran tidak valid"
                className="w-full border rounded-xl px-4 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">
                Batal
              </button>
              <button onClick={handleReject} disabled={acting} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
                {acting ? "Menolak..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
