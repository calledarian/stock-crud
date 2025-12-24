"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role: string;
  email: string;
  sub: number;
}

const monthMap: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02",
  mar: "03", march: "03", apr: "04", april: "04",
  may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11",
  dec: "12", december: "12",
};

const MONTH_LABELS = [
  { label: "Jan", value: "jan" }, { label: "Feb", value: "feb" },
  { label: "Mar", value: "mar" }, { label: "Apr", value: "apr" },
  { label: "May", value: "may" }, { label: "Jun", value: "jun" },
  { label: "Jul", value: "jul" }, { label: "Aug", value: "aug" },
  { label: "Sep", value: "sep" }, { label: "Oct", value: "oct" },
  { label: "Nov", value: "nov" }, { label: "Dec", value: "dec" },
];

type Earnings = {
  id: number;
  stockName: string;
  earningsDate: string;
  closePrice: number;
};

const ALLOWED_YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];
const ITEMS_PER_PAGE = 50;

export default function Home() {
  const router = useRouter();
  const API_URL = "http://localhost:3001/earnings";
  const EXPORT_EXCEL = "http://localhost:3001/earnings/export/excel";

  const [isAdmin, setIsAdmin] = useState(false);
  const [records, setRecords] = useState<Earnings[]>([]);
  const [editing, setEditing] = useState<Earnings | null>(null);
  const [deleting, setDeleting] = useState<Earnings | null>(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const stockInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ stockName: "", earningsDate: "", closePrice: "" });
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("2025");

  const [editStock, setEditStock] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
    } else {
      setIsLoading(false);
      fetchRecords();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.role === 'admin') setIsAdmin(true);
      } catch (e) { console.error("Invalid token"); }
    }
  }, []);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("access_token");
    const headers = { ...options.headers, "Authorization": `Bearer ${token}` };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/");
      throw new Error("Unauthorized");
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    router.push("/");
  };

  const buildDate = () => {
    const m = monthMap[month.toLowerCase().trim()];
    const dayNumber = Number(day);
    if (!m || !day || !year || dayNumber < 1 || dayNumber > 31) return "";
    return `${year}-${m}-${day.padStart(2, "0")}`;
  };

  const addDotToPrice = () => {
    setForm((prev) => prev.closePrice.includes(".") ? prev : { ...prev, closePrice: prev.closePrice + "." });
    setTimeout(() => priceInputRef.current?.focus(), 0);
  };

  useEffect(() => {
    const date = buildDate();
    if (date) {
      setForm((prev) => ({ ...prev, earningsDate: date }));
      setError("");
    }
  }, [month, day, year]);

  const fetchRecords = async () => {
    try {
      const res = await authFetch(API_URL);
      const data = await res.json();
      setRecords(data);
    } catch (e) { console.error(e); }
  };

  const submit = async () => {
    setError("");
    if (!form.stockName || !form.closePrice || !month || !day) {
      setError("Incomplete data."); return;
    }
    const earningsDate = buildDate();
    try {
      await authFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockName: form.stockName, earningsDate, closePrice: Number(form.closePrice) }),
      });
      setForm({ stockName: form.stockName, earningsDate: "", closePrice: "" });
      setMonth(""); setDay(""); fetchRecords();
      setTimeout(() => stockInputRef.current?.focus(), 100);
    } catch (e) { setError("Save failed."); }
  };

  const exportToExcel = async () => {
    try {
      const res = await authFetch(EXPORT_EXCEL);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "earnings.xlsx"; a.click();
    } catch (err) { console.error("Export failed"); }
  };

  const remove = async () => {
    if (!deleting) return;
    await authFetch(`${API_URL}/${deleting.id}`, { method: "DELETE" });
    setDeleting(null); fetchRecords();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await authFetch(`${API_URL}/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockName: editStock, earningsDate: editDate, closePrice: Number(editPrice) }),
    });
    setEditing(null); fetchRecords();
  };

  const findByStockName = async (val: string) => {
    if (!val) { fetchRecords(); return; }
    const res = await authFetch(`${API_URL}/stock/${val.toUpperCase()}`);
    setRecords(await res.json());
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [form, month, day, year]);

  const indexOfLastRecord = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRecord = indexOfLastRecord - ITEMS_PER_PAGE;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);

  const YearButton = ({ value }: { value: string }) => (
    <button
      onClick={() => setYear(value)}
      className={`flex-grow border px-3 py-2 rounded text-xs transition-colors duration-75 ${year === value
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
        }`}
    >
      {value}
    </button>
  );

  if (isLoading) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b pb-4 border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Tracker</h1>
            <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Mainframe Entry • Ctrl+Enter to save</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={() => router.push('/management')} className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded font-bold shadow-sm transition-colors duration-75">
                Manage
              </button>
            )}
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-400 font-bold border border-red-900/50 px-3 py-1 rounded transition-colors duration-75">
              Logout
            </button>
          </div>
        </header>

        {/* Entry Form */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-tighter">Record</h2>
          <div className="space-y-6">
            <div className="flex gap-3">
              <input
                ref={stockInputRef}
                className="w-40 bg-slate-950 border-b-2 border-slate-700 focus:border-blue-500 outline-none py-2 px-2 text-xl font-bold text-blue-400"
                placeholder="TICKER"
                value={form.stockName}
                onChange={(e) => setForm({ ...form, stockName: e.target.value.toUpperCase() })}
              />
              <div className="flex gap-2 items-center flex-1">
                <span className="text-2xl text-slate-600">$</span>
                <input
                  ref={priceInputRef}
                  className="flex-1 bg-slate-950 border-b-2 border-slate-700 focus:border-blue-500 outline-none py-2 px-2 text-lg font-mono"
                  placeholder="0.00"
                  value={form.closePrice}
                  onChange={(e) => setForm({ ...form, closePrice: e.target.value.replace(/[^0-9.]/g, '') })}
                />
                <button onClick={addDotToPrice} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded font-bold hover:bg-slate-700">.</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase">Day</label>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map((d) => (
                    <button key={d} onClick={() => setDay(d)} className={`h-8 text-[10px] rounded border transition-colors duration-75 ${day === d ? "bg-blue-600 text-white border-blue-600 font-bold" : "bg-slate-950 border-slate-800 hover:bg-slate-700"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase">Month</label>
                <div className="grid grid-cols-4 gap-1">
                  {MONTH_LABELS.map((m) => (
                    <button key={m.value} onClick={() => setMonth(m.value)} className={`py-2 text-[10px] rounded border transition-colors duration-75 ${month === m.value ? "bg-slate-200 text-slate-900 font-bold" : "bg-slate-950 border-slate-800 hover:bg-slate-700"}`}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase">Year</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALLOWED_YEARS.map((y) => <YearButton key={y} value={y} />)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <div className="text-xs uppercase">
                {form.earningsDate && !error && <span className="text-blue-500 font-bold tracking-widest">Active: {form.earningsDate}</span>}
                {error && <span className="text-red-500">! {error}</span>}
              </div>
              <button onClick={submit} disabled={!form.stockName || !form.closePrice || !form.earningsDate} className="bg-slate-200 text-slate-900 px-8 py-2 rounded font-black hover:bg-white disabled:opacity-20 transition-colors duration-75">Save Record</button>
            </div>
          </div>
        </section>

        {/* Filter & Export */}
        <div className="flex gap-2">
          <input className="flex-grow bg-slate-900 border border-slate-800 rounded px-4 py-2 outline-none focus:border-blue-500 text-sm" placeholder="Search ticker..." onChange={(e) => findByStockName(e.target.value.toUpperCase())} />
          <button onClick={fetchRecords} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-xs hover:bg-slate-700 transition-colors duration-75">Reset</button>
          <button onClick={exportToExcel} className="px-6 py-2 bg-emerald-700 text-white rounded font-bold text-xs hover:bg-emerald-600 transition-colors duration-75">Export</button>
        </div>

        {/* Table */}
        <div className="border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-500 border-b border-slate-800 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-4 font-bold">Equity</th>
                <th className="p-4 font-bold">Release</th>
                <th className="p-4 font-bold text-right">Close</th>
                <th className="p-4 font-bold text-center w-32">CMD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-slate-950/50">
              {currentRecords.map((r) => (
                <tr key={r.id} className="hover:bg-blue-900/10 transition-colors duration-75">
                  <td className="p-4 font-black text-blue-400">{r.stockName}</td>
                  <td className="p-4 text-slate-500">{r.earningsDate}</td>
                  <td className="p-4 text-right font-mono">${r.closePrice.toFixed(2)}</td>
                  <td className="p-4 flex justify-center gap-4">
                    <button onClick={() => { setEditing(r); setEditStock(r.stockName); setEditDate(r.earningsDate); setEditPrice(r.closePrice.toString()); }} className="text-blue-500 hover:text-blue-300">Edit</button>
                    <button onClick={() => setDeleting(r)} className="text-red-500 hover:text-red-300">Del</button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-slate-600 italic">No mainframe records found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {records.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-slate-900 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Records: {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, records.length)} / {records.length}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded text-[10px] border border-slate-700 hover:bg-slate-800 disabled:opacity-30">Previous</button>
                <span className="px-2 py-1 text-[10px]">Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded text-[10px] border border-slate-700 hover:bg-slate-800 disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {editing && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 p-6 rounded-lg w-full max-w-sm border border-slate-700 shadow-2xl">
              <h3 className="text-sm font-bold uppercase text-blue-500 mb-4">Edit Entry</h3>
              <div className="space-y-3">
                <input className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-blue-400 font-bold" value={editStock} onChange={(e) => setEditStock(e.target.value.toUpperCase())} />
                <input className="w-full bg-slate-950 border border-slate-700 p-2 rounded" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                <input className="w-full bg-slate-950 border border-slate-700 p-2 rounded font-mono" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-slate-500 uppercase">Abort</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase">Commit</button>
              </div>
            </div>
          </div>
        )}

        {deleting && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 p-8 rounded-lg w-full max-w-md border-t-4 border-red-600 shadow-2xl">
              <h3 className="text-lg font-bold text-red-600 uppercase">Confirm Purge</h3>
              <p className="text-slate-400 text-sm mt-2">Permanently delete record for <strong>{deleting.stockName}</strong>?</p>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 text-xs text-slate-500 uppercase">Cancel</button>
                <button onClick={remove} className="px-6 py-2 bg-red-600 text-white rounded text-xs font-bold uppercase">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
