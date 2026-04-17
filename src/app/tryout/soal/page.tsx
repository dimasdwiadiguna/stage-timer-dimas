"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import MathText from "@/components/MathText";

interface Question {
  id: string;
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
}

interface Answer {
  question_id: string;
  chosen_option: string;
}

export default function SoalPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitted = useRef(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);

  const doSubmit = useCallback(async () => {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    try {
      const res = await fetch("/api/student/attempts/submit", { method: "POST" });
      if (res.ok) router.push("/tryout/hasil");
      else { toast.error("Gagal mengumpulkan. Coba lagi."); autoSubmitted.current = false; }
    } catch {
      toast.error("Gagal mengumpulkan. Coba lagi.");
      autoSubmitted.current = false;
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      // Check session & attempt
      const sessRes = await fetch("/api/student/session");
      if (sessRes.status === 401) { router.push("/masuk"); return; }
      const sessData = await sessRes.json();

      if (!sessData.attempt?.started_at) { router.push("/tryout"); return; }
      if (sessData.attempt?.submitted_at) { router.push("/tryout/hasil"); return; }

      const session = sessData.registration.sessions;
      setSessionName(session.name);

      if (session.status === "closed") {
        await doSubmit();
        return;
      }

      // Calculate remaining time
      const startedAt = new Date(sessData.attempt.started_at).getTime() / 1000;
      const durationSec = session.duration_minutes * 60;
      const elapsed = Date.now() / 1000 - startedAt;
      const remaining = Math.max(0, Math.round(durationSec - elapsed));
      setTimeLeft(remaining);

      // Load questions
      const [qRes, aRes] = await Promise.all([
        fetch("/api/student/questions"),
        fetch("/api/student/answers"),
      ]);
      const qs: Question[] = await qRes.json();
      const ans: Answer[] = await aRes.json();

      setQuestions(qs);
      const ansMap: Record<string, string> = {};
      ans.forEach((a) => { if (a.chosen_option) ansMap[a.question_id] = a.chosen_option; });
      setAnswers(ansMap);
      setLoading(false);
    }
    init();
  }, [router, doSubmit]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      toast.info("Waktu habis! Jawaban dikumpulkan otomatis.");
      doSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, doSubmit]);

  // Polling: check session status every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/student/session");
        if (!res.ok) return;
        const data = await res.json();
        if (data.registration?.sessions?.status === "closed" && !autoSubmitted.current) {
          toast.info("Sesi telah ditutup. Jawaban dikumpulkan otomatis.");
          doSubmit();
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [doSubmit]);

  async function saveAnswer(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    try {
      await fetch("/api/student/answers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId, chosen_option: option }),
      });
    } catch {
      toast.error("Gagal menyimpan jawaban");
    }
  }

  function jumpToQuestion(idx: number) {
    setCurrentIdx(idx);
    // Scroll active pill into view in whichever navigator is visible
    [mobileNavRef, desktopNavRef].forEach((ref) => {
      if (ref.current) {
        const pill = ref.current.querySelector(`[data-idx="${idx}"]`);
        pill?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    await doSubmit();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Memuat soal...</p>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="text-center">
          <p className="text-gray-600">Tidak ada soal tersedia.</p>
        </div>
      </main>
    );
  }

  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const unanswered = questions.length - answeredCount;
  const options = [
    { key: "A", text: q.option_a },
    { key: "B", text: q.option_b },
    { key: "C", text: q.option_c },
    { key: "D", text: q.option_d },
    ...(q.option_e ? [{ key: "E", text: q.option_e }] : []),
  ];
  const isLowTime = timeLeft !== null && timeLeft < 300;

  const navPills = questions.map((question, idx) => {
    const isAnswered = !!answers[question.id];
    const isActive = idx === currentIdx;
    return (
      <button
        key={question.id}
        data-idx={idx}
        onClick={() => jumpToQuestion(idx)}
        className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all flex-shrink-0
          ${isActive
            ? "border-blue-600 bg-blue-600 text-white shadow-md"
            : isAnswered
              ? "border-green-400 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-100 text-gray-500"
          }`}
      >
        {idx + 1}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
          <p className="font-semibold text-gray-800 text-sm truncate max-w-[50%]">{sessionName}</p>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${isLowTime ? "text-red-600" : "text-gray-700"}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold
                hover:bg-red-600 active:bg-red-700 transition-colors min-h-[40px]"
            >
              Kumpulkan
            </button>
          </div>
        </div>
      </div>

      {/* Body: question area + desktop sidebar */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">

        {/* Question Area */}
        <div className="flex-1 px-4 pt-4 pb-36 lg:pb-8 lg:px-8 overflow-y-auto">
          <p className="text-sm text-gray-400 font-medium mb-3">Soal {currentIdx + 1} dari {questions.length}</p>
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 max-w-2xl">
            <MathText text={q.question_text} className="text-base text-gray-900 leading-relaxed font-medium" />
          </div>

          <div className="space-y-3 max-w-2xl">
            {options.map(({ key, text }) => {
              const selected = answers[q.id] === key;
              return (
                <button
                  key={key}
                  onClick={() => saveAnswer(q.id, key)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all min-h-[56px]
                    ${selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold
                    ${selected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-500"}`}>
                    {key}
                  </span>
                  <MathText text={text} className="text-base text-gray-800 pt-0.5" />
                </button>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6 max-w-2xl">
            <button
              onClick={() => jumpToQuestion(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="flex-1 border-2 border-gray-300 text-gray-600 py-4 rounded-xl font-semibold text-base
                hover:border-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed min-h-[52px]"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => jumpToQuestion(currentIdx + 1)}
              disabled={currentIdx === questions.length - 1}
              className="flex-1 border-2 border-blue-500 text-blue-600 py-4 rounded-xl font-semibold text-base
                hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed min-h-[52px]"
            >
              Selanjutnya →
            </button>
          </div>
        </div>

        {/* Desktop Right Sidebar Navigator */}
        <div className="hidden lg:flex flex-col w-64 xl:w-72 border-l border-gray-200 bg-white sticky top-[57px] h-[calc(100vh-57px)]">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Navigator Soal</p>
            <p className="text-xs text-gray-400 mt-0.5">{answeredCount} / {questions.length} dijawab</p>
          </div>
          <div ref={desktopNavRef} className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {navPills}
            </div>
          </div>
          {/* Legend */}
          <div className="p-3 border-t border-gray-100 flex gap-3 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 flex-shrink-0" /> Belum
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-400 flex-shrink-0" /> Dijawab
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 flex-shrink-0" /> Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigator (hidden on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:hidden">
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-gray-400 mb-2">Navigator Soal • {answeredCount}/{questions.length} dijawab</p>
        </div>
        <div ref={mobileNavRef} className="flex gap-2 px-4 pb-4 overflow-x-auto pb-safe">
          {navPills}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kumpulkan Jawaban?</h3>
            <p className="text-gray-600 text-sm mb-6">
              {unanswered > 0
                ? `Masih ada ${unanswered} soal yang belum dijawab. Jawaban tetap akan dikumpulkan.`
                : "Semua soal sudah dijawab. Apakah Anda yakin ingin mengumpulkan?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold min-h-[48px]"
              >
                Batal
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit(); }}
                disabled={submitting}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold
                  hover:bg-red-600 disabled:opacity-50 min-h-[48px]"
              >
                {submitting ? "Mengumpulkan..." : "Ya, Kumpulkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
