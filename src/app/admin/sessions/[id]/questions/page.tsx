"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AdminNav from "@/components/AdminNav";
import Papa from "papaparse";

interface Question {
  id: string;
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
  correct_option: string;
}

const emptyForm = {
  order_index: "", question_text: "", option_a: "", option_b: "",
  option_c: "", option_d: "", option_e: "", correct_option: "A", has_e: false,
};

interface CsvRow {
  order_index: string; question_text: string; option_a: string; option_b: string;
  option_c: string; option_d: string; option_e?: string; correct_option: string;
  _error?: string; _valid?: boolean;
}

export default function QuestionsPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = useCallback(async () => {
    const res = await fetch(`/api/admin/questions/${sessionId}`);
    if (res.ok) setQuestions(await res.json());
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchQuestions();
    fetch(`/api/admin/sessions`).then((r) => r.json()).then((ss) => {
      const s = ss.find((x: { id: string; name: string }) => x.id === sessionId);
      if (s) setSessionName(s.name);
    });
  }, [sessionId, fetchQuestions]);

  function openCreate() {
    setEditQ(null);
    const nextIdx = questions.length > 0 ? Math.max(...questions.map((q) => q.order_index)) + 1 : 1;
    setForm({ ...emptyForm, order_index: String(nextIdx) });
    setShowForm(true);
  }

  function openEdit(q: Question) {
    setEditQ(q);
    setForm({
      order_index: String(q.order_index),
      question_text: q.question_text,
      option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d,
      option_e: q.option_e || "", correct_option: q.correct_option,
      has_e: !!q.option_e,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      toast.error("Teks soal dan opsi A-D wajib diisi"); return;
    }
    setSaving(true);
    const payload = { ...form, option_e: form.has_e ? form.option_e : null };
    const url = editQ
      ? `/api/admin/questions/${sessionId}/${editQ.id}`
      : `/api/admin/questions/${sessionId}`;
    const res = await fetch(url, {
      method: editQ ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { toast.success("Soal berhasil disimpan"); setShowForm(false); fetchQuestions(); }
    else { const d = await res.json(); toast.error(d.error || "Gagal menyimpan"); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/questions/${sessionId}/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Soal dihapus"); setDeleteId(null); fetchQuestions(); }
    else { const d = await res.json(); toast.error(d.error || "Gagal menghapus"); }
  }

  function downloadTemplate() {
    const csv = "order_index,question_text,option_a,option_b,option_c,option_d,option_e,correct_option\n1,Contoh soal?,Opsi A,Opsi B,Opsi C,Opsi D,,A\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-soal.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const rows: CsvRow[] = (result.data as Record<string, string>[]).map((row) => {
          const errors: string[] = [];
          if (!row.order_index || isNaN(Number(row.order_index))) errors.push("order_index tidak valid");
          if (!row.question_text?.trim()) errors.push("teks soal kosong");
          if (!row.option_a?.trim()) errors.push("opsi A kosong");
          if (!row.option_b?.trim()) errors.push("opsi B kosong");
          if (!row.option_c?.trim()) errors.push("opsi C kosong");
          if (!row.option_d?.trim()) errors.push("opsi D kosong");
          if (!["A","B","C","D","E"].includes((row.correct_option || "").toUpperCase())) errors.push("correct_option tidak valid");
          if (row.correct_option?.toUpperCase() === "E" && !row.option_e?.trim()) errors.push("opsi E kosong tapi jawaban benar adalah E");
          const csvRow: CsvRow = {
            order_index: row.order_index || "",
            question_text: row.question_text || "",
            option_a: row.option_a || "",
            option_b: row.option_b || "",
            option_c: row.option_c || "",
            option_d: row.option_d || "",
            option_e: row.option_e || "",
            correct_option: row.correct_option || "",
            _valid: errors.length === 0,
            _error: errors.join(", "),
          };
          return csvRow;
        });
        setCsvRows(rows);
        setShowCsvPreview(true);
      },
    });
  }

  async function handleImport() {
    const valid = csvRows.filter((r) => r._valid);
    if (valid.length === 0) { toast.error("Tidak ada baris valid"); return; }
    setImporting(true);
    const payload = valid.map((r) => ({
      order_index: r.order_index, question_text: r.question_text,
      option_a: r.option_a, option_b: r.option_b, option_c: r.option_c, option_d: r.option_d,
      option_e: r.option_e || null, correct_option: r.correct_option.toUpperCase(),
    }));
    const res = await fetch(`/api/admin/questions/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const skipped = csvRows.length - valid.length;
      toast.success(`${valid.length} soal berhasil diimport${skipped > 0 ? `, ${skipped} soal diskip` : ""}`);
      setShowCsvPreview(false); setCsvRows([]);
      if (fileRef.current) fileRef.current.value = "";
      fetchQuestions();
    } else { const d = await res.json(); toast.error(d.error || "Gagal import"); }
    setImporting(false);
  }

  return (
    <>
      <AdminNav />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/sessions" className="text-sm text-gray-400 hover:text-gray-600">← Kembali</Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Soal Ujian</h1>
            {sessionName && <p className="text-gray-500 text-sm">{sessionName}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={downloadTemplate}
              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
              Template CSV
            </button>
            <label className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 cursor-pointer">
              Import CSV
              <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvFile} className="hidden" />
            </label>
            <button onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
              + Tambah Soal
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada soal. Tambah atau import CSV.</div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{q.order_index}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Jawaban: {q.correct_option}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{q.question_text.slice(0, 100)}{q.question_text.length > 100 ? "..." : ""}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                      <span>A. {q.option_a.slice(0, 30)}</span>
                      <span>B. {q.option_b.slice(0, 30)}</span>
                      <span>C. {q.option_c.slice(0, 30)}</span>
                      <span>D. {q.option_d.slice(0, 30)}</span>
                      {q.option_e && <span>E. {q.option_e.slice(0, 30)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(q)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(q.id)}
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

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editQ ? "Edit Soal" : "Tambah Soal"}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nomor Urut</label>
                  <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Teks Soal</label>
                  <textarea rows={3} value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                {(["a","b","c","d"] as const).map((opt) => {
                  type OptKey = `option_${typeof opt}`;
                  const key: OptKey = `option_${opt}`;
                  return (
                    <div key={opt}>
                      <label className="text-sm font-medium text-gray-700">Opsi {opt.toUpperCase()}</label>
                      <input type="text" value={form[key] as string}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full border rounded-xl px-4 py-2.5 text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  );
                })}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="has_e" checked={form.has_e}
                    onChange={(e) => setForm({ ...form, has_e: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="has_e" className="text-sm font-medium text-gray-700">Ada Opsi E</label>
                </div>
                {form.has_e && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Opsi E</label>
                    <input type="text" value={form.option_e}
                      onChange={(e) => setForm({ ...form, option_e: e.target.value })}
                      className="w-full border rounded-xl px-4 py-2.5 text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Jawaban Benar</label>
                  <select value={form.correct_option} onChange={(e) => setForm({ ...form, correct_option: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>A</option><option>B</option><option>C</option><option>D</option>
                    {form.has_e && <option>E</option>}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">Batal</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Preview Modal */}
      {showCsvPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold">Preview Import CSV</h2>
              <p className="text-sm text-gray-500 mt-1">
                {csvRows.filter((r) => r._valid).length} soal valid, {csvRows.filter((r) => !r._valid).length} diskip
              </p>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-2">
                {csvRows.map((row, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-sm ${row._valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">Baris {i + 1}: {row.question_text?.slice(0, 60)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${row._valid ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"}`}>
                        {row._valid ? "Valid" : "Error"}
                      </span>
                    </div>
                    {!row._valid && <p className="text-red-600 text-xs mt-1">{row._error}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button onClick={() => { setShowCsvPreview(false); setCsvRows([]); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">Batal</button>
              <button onClick={handleImport} disabled={importing || csvRows.filter((r) => r._valid).length === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                {importing ? "Mengimport..." : `Import ${csvRows.filter((r) => r._valid).length} Soal`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-3">Hapus Soal?</h2>
            <p className="text-gray-600 text-sm mb-5">Soal ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold">Batal</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
