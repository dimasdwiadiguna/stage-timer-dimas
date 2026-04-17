"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MathText from "@/components/MathText";

interface Results {
  score: number;
  total_questions: number;
  correct: number;
  wrong: number;
  not_answered: number;
  wrong_answers: {
    order_index: number;
    question_text: string;
    chosen_option: string;
    chosen_text: string;
    correct_option: string;
    correct_text: string;
  }[];
}

export default function HasilPage() {
  const [results, setResults] = useState<Results | null>(null);
  const [studentName, setStudentName] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [closingText, setClosingText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const sessRes = await fetch("/api/student/session");
      if (sessRes.status === 401) { router.push("/masuk"); return; }
      const sessData = await sessRes.json();
      if (!sessData.attempt?.submitted_at) { router.push("/tryout/soal"); return; }

      setStudentName(sessData.registration.students.name);
      setSessionName(sessData.registration.sessions.name);
      setClosingText(sessData.registration.sessions.closing_text ?? null);

      const resRes = await fetch("/api/student/results");
      const resData = await resRes.json();
      setResults(resData);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleFinish() {
    await fetch("/api/student/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Memuat hasil...</p>
        </div>
      </main>
    );
  }

  if (!results) return null;

  const pct = results.total_questions > 0 ? Math.round((results.correct / results.total_questions) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 px-5 pt-12 pb-8 text-center">
        <p className="text-blue-200 text-sm">{studentName}</p>
        <h1 className="text-xl font-bold text-white mt-1">{sessionName}</h1>
        <div className="mt-6">
          <div className="text-5xl font-black text-white">{pct}%</div>
          <div className="text-blue-200 mt-1 text-lg font-semibold">
            {results.correct} Benar dari {results.total_questions} Soal
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto">
        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm mt-4 p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{results.correct}</div>
              <div className="text-xs text-gray-500 mt-1">✅ Benar</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{results.wrong}</div>
              <div className="text-xs text-gray-500 mt-1">❌ Salah</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{results.not_answered}</div>
              <div className="text-xs text-gray-500 mt-1">— Kosong</div>
            </div>
          </div>
        </div>

        {/* Closing Text */}
        {closingText && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{closingText}</p>
          </div>
        )}

        {/* Wrong Answers */}
        {results.wrong_answers.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 px-1">Jawaban yang Salah:</h2>
            <div className="space-y-3">
              {results.wrong_answers.map((wa) => (
                <div key={wa.order_index} className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Soal {wa.order_index}</p>
                  <MathText text={wa.question_text} className="text-sm text-gray-800 mb-3 leading-relaxed block" />
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {wa.chosen_option}
                      </span>
                      <div>
                        <p className="text-xs text-red-500 font-medium">Jawaban kamu</p>
                        <MathText text={wa.chosen_text} className="text-sm text-red-700" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {wa.correct_option}
                      </span>
                      <div>
                        <p className="text-xs text-green-500 font-medium">Jawaban benar</p>
                        <MathText text={wa.correct_text} className="text-sm text-green-700" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-lg mx-auto">
        <button
          onClick={handleFinish}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base
            hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[48px]"
        >
          Selesai
        </button>
      </div>
    </main>
  );
}
