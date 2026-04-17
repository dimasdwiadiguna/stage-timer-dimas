"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import AdminNav from "@/components/AdminNav";

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

interface Session { id: string; name: string; }

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};
const statusLabels: Record<string, string> = { pending: "Pending", approved: "Disetujui", rejected: "Ditolak" };

export default function ApprovalsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionFilter, setSessionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState<{ regId: string; password: string; name: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const fetchData = useCallback(async () => {
    const url = sessionFilter ? `/api/admin/approvals?session_id=${sessionFilter}` : "/api/admin/approvals";
    const [regRes, sessRes] = await Promise.all([fetch(url), fetch("/api/admin/sessions")]);
    if (regRes.ok) setRegistrations(await regRes.json());
    if (sessRes.ok) setSessions(await sessRes.json());
    setLoading(false);
  }, [sessionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  return (
    <>
      <AdminNav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Approval Siswa</h1>
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Sesi</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada pendaftaran.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Nama Siswa</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">No. WA</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Sesi</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Daftar</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{reg.students.name}</td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/${reg.students.wa_number}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline">{reg.students.wa_number}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{reg.sessions.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(reg.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[reg.status]}`}>
                          {statusLabels[reg.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {reg.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(reg.id, reg.students.name)} disabled={acting}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 disabled:opacity-50">
                                Setujui
                              </button>
                              <button onClick={() => { setRejectModal(reg.id); setRejectReason(""); }}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">
                                Tolak
                              </button>
                            </>
                          )}
                          {reg.status === "approved" && reg.plain_password && (
                            <button onClick={() => setPasswordModal({ regId: reg.id, password: reg.plain_password!, name: reg.students.name })}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">
                              Lihat Password
                            </button>
                          )}
                          {reg.status === "rejected" && reg.rejection_reason && (
                            <span className="text-xs text-gray-400 italic">{reg.rejection_reason}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
            <button onClick={() => copyPassword(passwordModal.password)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 mb-3">
              Salin Password
            </button>
            <p className="text-xs text-amber-600 mb-4">
              Kirim password ini ke siswa melalui WhatsApp, lalu tutup modal ini. Password akan dihapus setelah modal ditutup.
            </p>
            <button onClick={handleClosePasswordModal}
              className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50">
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
              <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Bukti pembayaran tidak valid"
                className="w-full border rounded-xl px-4 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">
                Batal
              </button>
              <button onClick={handleReject} disabled={acting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
                {acting ? "Menolak..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
