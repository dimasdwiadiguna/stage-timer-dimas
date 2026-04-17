"use client";
import { useState, useEffect, useCallback } from "react";
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
  studentCount: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-yellow-100 text-yellow-700",
  open: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-600",
};
const statusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  open: "Buka",
  closed: "Tutup",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [form, setForm] = useState({
    name: "", duration_minutes: "", open_mode: "manual",
    scheduled_open_at: "", scheduled_close_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/admin/sessions");
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Auto sync scheduled sessions every 30s
  useEffect(() => {
    const sync = async () => {
      await fetch("/api/admin/sessions/sync-status", { method: "POST" });
      fetchSessions();
    };
    const interval = setInterval(sync, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  function openCreate() {
    setEditSession(null);
    setForm({ name: "", duration_minutes: "", open_mode: "manual", scheduled_open_at: "", scheduled_close_at: "" });
    setShowForm(true);
  }

  function openEdit(s: Session) {
    setEditSession(s);
    setForm({
      name: s.name,
      duration_minutes: String(s.duration_minutes),
      open_mode: s.open_mode,
      scheduled_open_at: s.scheduled_open_at ? s.scheduled_open_at.slice(0, 16) : "",
      scheduled_close_at: s.scheduled_close_at ? s.scheduled_close_at.slice(0, 16) : "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.duration_minutes) { toast.error("Nama dan durasi wajib diisi"); return; }
    setSaving(true);
    const url = editSession ? `/api/admin/sessions/${editSession.id}` : "/api/admin/sessions";
    const method = editSession ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editSession ? "Sesi berhasil diperbarui" : "Sesi berhasil dibuat");
      setShowForm(false);
      fetchSessions();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal menyimpan");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) {
      toast.error("Nama sesi tidak cocok");
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/sessions/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sesi berhasil dihapus");
      setDeleteTarget(null);
      setDeleteConfirmName("");
      fetchSessions();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal menghapus");
    }
    setDeleting(false);
  }

  return (
    <>
      <AdminNav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Sesi</h1>
          <button onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            + Buat Sesi
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Belum ada sesi. Buat sesi pertama!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/sessions/${s.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {s.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status]}`}>
                        {statusLabels[s.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      <span>Kode: <b className="font-mono text-gray-700">{s.code}</b></span>
                      <span>Durasi: {s.duration_minutes} menit</span>
                      <span>Siswa: {s.studentCount}</span>
                      <span>Mode: {s.open_mode === "manual" ? "Manual" : "Terjadwal"}</span>
                    </div>
                    {s.scheduled_open_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Buka: {new Date(s.scheduled_open_at).toLocaleString("id-ID")}
                        {s.scheduled_close_at && ` • Tutup: ${new Date(s.scheduled_close_at).toLocaleString("id-ID")}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/sessions/${s.id}`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                      Detail
                    </Link>
                    <button onClick={() => openEdit(s)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200">
                      Edit
                    </button>
                    <button onClick={() => { setDeleteTarget(s); setDeleteConfirmName(""); }}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Session Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editSession ? "Edit Sesi" : "Buat Sesi Baru"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sesi</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                  <input type="number" min="1" value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode Buka</label>
                  <select value={form.open_mode} onChange={(e) => setForm({ ...form, open_mode: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="manual">Manual</option>
                    <option value="scheduled">Terjadwal</option>
                  </select>
                </div>
                {form.open_mode === "scheduled" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Buka</label>
                      <input type="datetime-local" value={form.scheduled_open_at}
                        onChange={(e) => setForm({ ...form, scheduled_open_at: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Tutup</label>
                      <input type="datetime-local" value={form.scheduled_close_at}
                        onChange={(e) => setForm({ ...form, scheduled_close_at: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Hapus Sesi</h2>
            <p className="text-sm text-gray-600 mb-2">
              Ini akan menghapus permanen sesi <b>{deleteTarget.name}</b> beserta SEMUA data terkait
              (soal, registrasi, attempt, jawaban). Tindakan ini tidak dapat dibatalkan.
            </p>
            <p className="text-sm text-gray-700 mb-3">Ketik nama sesi untuk konfirmasi:</p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={deleteTarget.name}
              className="w-full border border-red-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteConfirmName(""); }}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirmName !== deleteTarget.name}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-40">
                {deleting ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
