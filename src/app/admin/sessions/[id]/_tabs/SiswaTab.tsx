"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

interface PasswordModal {
  regId: string;
  password: string;
  studentName: string;
  waNumber: string;
  sessionName: string;
  sessionCode: string;
}

const regColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};
const regLabels: Record<string, string> = {
  pending: "Pending", approved: "Disetujui", rejected: "Ditolak",
};

export default function SiswaTab({ sessionId }: { sessionId: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [passwordModal, setPasswordModal] = useState<PasswordModal | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRegs = useCallback(async () => {
    const res = await fetch(`/api/admin/approvals?session_id=${sessionId}`);
    if (res.ok) setRegistrations(await res.json());
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetchRegs(); }, [fetchRegs]);

  async function handleApprove(reg: Registration) {
    setActing(true);
    const res = await fetch("/api/admin/approvals/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_id: reg.id }),
    });
    if (res.ok) {
      const d = await res.json();
      setPasswordModal({
        regId: reg.id,
        password: d.plain_password,
        studentName: reg.students.name,
        waNumber: reg.students.wa_number,
        sessionName: reg.sessions.name,
        sessionCode: reg.sessions.code,
      });
      fetchRegs();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal approve");
    }
    setActing(false);
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
      fetchRegs();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal reject");
    }
    setActing(false);
  }

  function openPasswordModal(reg: Registration) {
    if (!reg.plain_password) return;
    setPasswordModal({
      regId: reg.id,
      password: reg.plain_password,
      studentName: reg.students.name,
      waNumber: reg.students.wa_number,
      sessionName: reg.sessions.name,
      sessionCode: reg.sessions.code,
    });
  }

  function buildWaLink(modal: PasswordModal) {
    const text = `Halo ${modal.studentName}, pembayaran kamu untuk ${modal.sessionName} dengan kode sesi ${modal.sessionCode} telah terverifikasi.\nBerikut adalah password kamu : ${modal.password}\nPassword hanya bisa digunakan untuk sesi ini saja`;
    return `https://wa.me/${modal.waNumber}?text=${encodeURIComponent(text)}`;
  }

  const counts = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };
  const filtered = statusFilter === "all" ? registrations : registrations.filter((r) => r.status === statusFilter);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-800">Peserta</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {counts.all} terdaftar · {counts.pending} pending · {counts.approved} disetujui · {counts.rejected} ditolak
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${statusFilter === s ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {s === "all" ? `Semua (${counts.all})` : `${regLabels[s]} (${counts[s as keyof typeof counts]})`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {statusFilter === "all"
              ? "Belum ada peserta yang mendaftar."
              : `Tidak ada peserta dengan status "${regLabels[statusFilter]}".`}
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
                      <a href={`https://wa.me/${reg.students.wa_number}`} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline">{reg.students.wa_number}</a>
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
                            <button onClick={() => handleApprove(reg)} disabled={acting}
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
                          <button onClick={() => openPasswordModal(reg)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">
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
            <p className="text-sm text-gray-500 mb-4">Password untuk <b>{passwordModal.studentName}</b>:</p>
            <div className="bg-gray-100 rounded-xl py-4 px-6 mb-4">
              <p className="text-3xl font-bold font-mono tracking-widest text-gray-900">{passwordModal.password}</p>
            </div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { navigator.clipboard.writeText(passwordModal.password); toast.success("Password disalin!"); }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 text-sm">
                Salin Password
              </button>
              <a
                href={buildWaLink(passwordModal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 text-sm flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Kirim WA
              </a>
            </div>
            <button onClick={() => setPasswordModal(null)}
              className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 text-sm">
              Tutup
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
              <button onClick={() => setRejectModal(null)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">Batal</button>
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
