import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Try Out Online</h1>
          <p className="text-gray-500 mt-2 text-sm">Platform ujian online terpercaya</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/daftar"
            className="block w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base
              hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[48px] flex items-center justify-center"
          >
            Daftar Try Out
          </Link>
          <Link
            href="/masuk"
            className="block w-full bg-white border-2 border-blue-600 text-blue-600 py-4 rounded-xl font-semibold
              text-base hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-[48px] flex items-center justify-center"
          >
            Login Ujian
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link href="/admin/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
