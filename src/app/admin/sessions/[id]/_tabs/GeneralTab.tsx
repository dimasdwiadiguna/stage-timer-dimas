"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Session {
  id: string;
  name: string;
  open_mode: string;
  scheduled_open_at: string | null;
  scheduled_close_at: string | null;
  duration_minutes: number;
  instruction_text: string | null;
  closing_text: string | null;
}

export default function GeneralTab({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: session.name,
    duration_minutes: String(session.duration_minutes),
    open_mode: session.open_mode,
    scheduled_open_at: session.scheduled_open_at ? session.scheduled_open_at.slice(0, 16) : "",
    scheduled_close_at: session.scheduled_close_at ? session.scheduled_close_at.slice(0, 16) : "",
    instruction_text: session.instruction_text || "",
    closing_text: session.closing_text || "",
  });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!form.name || !form.duration_minutes) { toast.error("Nama dan durasi wajib diisi"); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Sesi berhasil diperbarui");
      onSaved();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal menyimpan");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (deleteConfirm !== session.name) { toast.error("Nama sesi tidak cocok"); return; }
    setDeleting(true);
    const res = await fetch(`/api/admin/sessions/${session.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sesi berhasil dihapus");
      router.push("/admin/sessions");
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal menghapus");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Pengaturan Sesi</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teks Instruksi</label>
            <p className="text-xs text-gray-400 mb-1">Ditampilkan di ruang tunggu sebelum siswa mulai ujian</p>
            <textarea rows={4} value={form.instruction_text}
              onChange={(e) => setForm({ ...form, instruction_text: e.target.value })}
              placeholder="Contoh: Bacalah soal dengan teliti sebelum menjawab..."
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teks Penutup</label>
            <p className="text-xs text-gray-400 mb-1">Ditampilkan di halaman hasil setelah siswa menyelesaikan ujian</p>
            <textarea rows={3} value={form.closing_text}
              onChange={(e) => setForm({ ...form, closing_text: e.target.value })}
              placeholder="Contoh: Terima kasih telah mengikuti try out ini. Hasil akan diumumkan..."
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="font-semibold text-red-700 mb-1">Zona Berbahaya</h2>
        <p className="text-sm text-gray-500 mb-4">
          Menghapus sesi akan menghapus semua data terkait secara permanen (soal, pendaftaran, jawaban, hasil).
        </p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100">
            Hapus Sesi Ini
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Ketik <b className="text-gray-900">{session.name}</b> untuk konfirmasi:
            </p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={session.name}
              className="w-full border border-red-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-red-500" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="px-4 py-2.5 border-2 border-gray-300 text-gray-600 rounded-xl text-sm font-semibold">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting || deleteConfirm !== session.name}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40">
                {deleting ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
