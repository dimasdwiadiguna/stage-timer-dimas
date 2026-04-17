"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

interface Stats {
  totalSessions: number;
  totalPending: number;
  totalStudents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setStats);
  }, []);

  const cards = [
    { label: "Total Sesi", value: stats?.totalSessions ?? "—", color: "blue", href: "/admin/sessions" },
    { label: "Pending Approval", value: stats?.totalPending ?? "—", color: "yellow", href: "/admin/approvals" },
    { label: "Total Siswa", value: stats?.totalStudents ?? "—", color: "green", href: "/admin/approvals" },
  ];

  return (
    <>
      <AdminNav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan platform Try Out Online</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-3xl font-bold mt-1 text-${card.color}-600`}>{card.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/sessions"
            className="bg-blue-600 text-white rounded-2xl p-6 hover:bg-blue-700 transition-colors">
            <div className="text-lg font-bold mb-1">Kelola Sesi</div>
            <p className="text-blue-200 text-sm">Buat, edit, dan kelola sesi ujian</p>
          </Link>
          <Link href="/admin/approvals"
            className="bg-white text-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-lg font-bold mb-1">Approval Siswa</div>
            <p className="text-gray-500 text-sm">Review dan setujui pendaftaran siswa</p>
          </Link>
        </div>
      </main>
    </>
  );
}
