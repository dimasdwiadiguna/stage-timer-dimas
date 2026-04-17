"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Analytics {
  session: { name: string; status: string };
  summary: { total_participants: number; avg_score: number; max_score: number; min_score: number };
  attempts: {
    id: string; student_name: string; student_wa: string;
    score: number; total_questions: number; started_at: string; submitted_at: string;
  }[];
  question_stats: {
    id: string; order_index: number; question_text: string;
    correct_count: number; total_answers: number; percent_correct: number;
  }[];
}

function buildDistribution(attempts: Analytics["attempts"]) {
  const bins: Record<string, number> = {};
  for (let i = 0; i <= 100; i += 10) bins[`${i}-${i + 9}`] = 0;
  attempts.forEach((a) => {
    const pct = a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;
    const bin = Math.floor(pct / 10) * 10;
    const key = `${bin}-${Math.min(bin + 9, 100)}`;
    if (bins[key] !== undefined) bins[key]++;
  });
  return Object.entries(bins).map(([range, count]) => ({ range, count }));
}

export default function AnalitikTab({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/analytics/${sessionId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [sessionId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const dist = buildDistribution(data.attempts);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Peserta", value: data.summary.total_participants },
          { label: "Rata-rata Skor", value: data.summary.avg_score },
          { label: "Skor Tertinggi", value: data.summary.max_score },
          { label: "Skor Terendah", value: data.summary.min_score },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Score Distribution Chart */}
      {data.attempts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Distribusi Skor (%)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Peserta" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-student table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Hasil Per Siswa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nama</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">No. WA</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Skor</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Benar</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Salah</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.attempts.map((a) => {
                const wrong = (a.total_questions || 0) - (a.score || 0);
                const durationMs = new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime();
                const durationMin = Math.floor(durationMs / 60000);
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{a.student_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <a href={`https://wa.me/${a.student_wa}`} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline">{a.student_wa}</a>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      {a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0}%
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">{a.score}</td>
                    <td className="px-4 py-3 text-right text-red-500">{wrong}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{durationMin} menit</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.attempts.length === 0 && (
            <div className="p-8 text-center text-gray-400">Belum ada peserta yang mengerjakan</div>
          )}
        </div>
      </div>

      {/* Per-question stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Tingkat Kesulitan Per Soal</h2>
          <p className="text-xs text-gray-400 mt-0.5">Diurutkan dari soal paling sulit (% benar terendah)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">No</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Teks Soal</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">% Benar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.question_stats.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono">#{q.order_index}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {q.question_text.slice(0, 80)}{q.question_text.length > 80 ? "..." : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${q.percent_correct < 40 ? "text-red-600" : q.percent_correct < 70 ? "text-yellow-600" : "text-green-600"}`}>
                      {q.percent_correct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
