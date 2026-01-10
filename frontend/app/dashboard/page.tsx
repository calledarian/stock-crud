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
  closePrior45d: number | null;
  datePrior45d: string | null;
  closePrior30d: number | null;
  datePrior30d: string | null;
  closePrior14d: number | null;
  datePrior14d: string | null;
  closePrior1d: number | null;
  datePrior1d: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const ALLOWED_YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];
const ITEMS_PER_PAGE = 50;

export default function Home() {
  const router = useRouter();
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/earnings`;
  const EXPORT_EXCEL = `${process.env.NEXT_PUBLIC_API_URL}/earnings/export/excel`;
  const EXPORT_SQLITE = `${process.env.NEXT_PUBLIC_API_URL}/earnings/export/sqlite`;

  const [isAdmin, setIsAdmin] = useState(false);
  const [records, setRecords] = useState<Earnings[]>([]);
  const [stockCount, setStockCount] = useState(0);
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
  const [editDate45, setEditDate45] = useState("");
  const [editPrice45, setEditPrice45] = useState("");
  const [editDate30, setEditDate30] = useState("");
  const [editPrice30, setEditPrice30] = useState("");
  const [editDate14, setEditDate14] = useState("");
  const [editPrice14, setEditPrice14] = useState("");
  const [editDate1, setEditDate1] = useState("");
  const [editPrice1, setEditPrice1] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
    } else {
      setIsLoading(false);
      fetchRecords();
      stockCountFetch();
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

  const stockCountFetch = async () => {
    try {
      const res = await authFetch(`${API_URL}/stock-count`);
      const data = await res.json();
      setStockCount(data);
    } catch (e) { console.error(e); return 0; }
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
      setMonth(""); setDay(""); fetchRecords(); stockCountFetch();
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

  const exportToSqlite = async () => {
    try {
      const res = await authFetch(EXPORT_SQLITE);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "earnings.db"; a.click();
    } catch (err) { console.error("Export failed"); }
  };

  const remove = async () => {
    if (!deleting) return;
    await authFetch(`${API_URL}/${deleting.id}`, { method: "DELETE" });
    setDeleting(null); fetchRecords(); stockCountFetch();
  };

  const saveEdit = async () => {
    if (!editing) return;

    await authFetch(`${API_URL}/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stockName: editStock,
        earningsDate: editDate,
        closePrice: Number(editPrice),
        closePrior45d: editPrice45 ? Number(editPrice45) : null,
        datePrior45d: editDate45 || null,
        closePrior30d: editPrice30 ? Number(editPrice30) : null,
        datePrior30d: editDate30 || null,
        closePrior14d: editPrice14 ? Number(editPrice14) : null,
        datePrior14d: editDate14 || null,
        closePrior1d: editPrice1 ? Number(editPrice1) : null,
        datePrior1d: editDate1 || null,
      }),
    });

    setEditing(null);
    fetchRecords();
    stockCountFetch();
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

  if (isLoading) return null;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6 antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <h1 className="text-3xl font-black text-white tracking-tighter">EARNINGS DASHBOARD</h1>
          <div className="flex gap-4">
            {isAdmin && (
              <button onClick={() => router.push('/management')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
                SYSTEM ADMIN
              </button>
            )}
            <button onClick={logout} className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-sm font-bold rounded-lg transition-all">
              LOGOUT
            </button>
          </div>
        </header>

        {/* ENTRY FORM */}
        {isAdmin && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Ticker Symbol</label>
                <input
                  ref={stockInputRef}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-5 py-4 text-2xl font-black text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                  placeholder="SYMBOL"
                  value={form.stockName}
                  onChange={(e) => setForm({ ...form, stockName: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Close Price</label>
                <div className="flex gap-2">
                  <input
                    ref={priceInputRef}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-5 py-4 text-2xl font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="0.00"
                    value={form.closePrice}
                    onChange={(e) => setForm({ ...form, closePrice: e.target.value.replace(/[^0-9.]/g, '') })}
                  />
                  <button onClick={addDotToPrice} className="px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-2xl font-bold transition-all">.</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Day</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map((d) => (
                    <button key={d} onClick={() => setDay(d)} className={`h-10 text-sm font-bold rounded-md border ${day === d ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-950 border-slate-800 hover:bg-slate-700"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Month</label>
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_LABELS.map((m) => (
                    <button key={m.value} onClick={() => setMonth(m.value)} className={`py-3 text-xs font-black rounded-md border uppercase transition-all ${month === m.value ? "bg-white text-slate-950 border-white" : "bg-slate-950 border-slate-800 hover:bg-slate-700"}`}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Year</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALLOWED_YEARS.map((y) => (
                    <button key={y} onClick={() => setYear(y)} className={`py-3 text-sm font-black rounded-md border transition-all ${year === y ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-950 border-slate-800 hover:bg-slate-700"}`}>{y}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
              <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-widest uppercase ${form.earningsDate ? "text-emerald-400" : "text-amber-500"}`}>
                  {form.earningsDate ? `Ready: ${form.earningsDate}` : (error || "Pending Selection")}
                </span>
              </div>
              <button
                onClick={submit}
                disabled={!form.stockName || !form.closePrice || !form.earningsDate}
                className="bg-white text-slate-950 px-12 py-4 rounded-xl text-lg font-black hover:bg-indigo-400 hover:text-white disabled:opacity-10 transition-all uppercase shadow-2xl"
              >
                COMMIT RECORD
              </button>
            </div>
          </section>
        )}

        {/* SEARCH & EXPORT */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-lg outline-none focus:border-indigo-500 transition-all"
              placeholder="QUICK SEARCH BY TICKER..."
              onChange={(e) => findByStockName(e.target.value.toUpperCase())}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchRecords} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm uppercase">Reset</button>
            <button onClick={exportToExcel} className="px-6 py-4 bg-emerald-700/20 text-emerald-400 border border-emerald-800 hover:bg-emerald-700 hover:text-white rounded-xl font-bold text-sm uppercase transition-all">Export Excel</button>
            <button onClick={exportToSqlite} className="px-6 py-4 bg-blue-700/20 text-blue-400 border border-blue-800 hover:bg-blue-700 hover:text-white rounded-xl font-bold text-sm uppercase transition-all">Export SQLite</button>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-6 py-5">Ticker ({stockCount})</th>
                  <th className="px-2 py-5 text-center">45d</th>
                  <th className="px-2 py-5 text-center">30d</th>
                  <th className="px-2 py-5 text-center">14d</th>
                  <th className="px-2 py-5 text-center">1d</th>
                  <th className="px-6 py-5 text-right bg-indigo-950/40 text-indigo-200">Final Earnings</th>
                  {isAdmin && <th className="px-6 py-5 text-center">Cmd</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {currentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="px-6 py-5">
                      <span className="text-2xl font-black text-white group-hover:text-indigo-400 transition-all">{r.stockName}</span>
                    </td>

                    {[
                      { p: r.closePrior45d, d: r.datePrior45d },
                      { p: r.closePrior30d, d: r.datePrior30d },
                      { p: r.closePrior14d, d: r.datePrior14d },
                      { p: r.closePrior1d, d: r.datePrior1d }
                    ].map((item, i) => (
                      <td key={i} className="px-2 py-5 text-center border-r border-slate-800/30">
                        <div className="flex flex-col">
                          <span className={`text-2xl font-bold ${!item.p ? 'text-slate-600' : 'text-slate-200'}`}>
                            {item.p ? `$${Number(item.p).toFixed(2)}` : '—'}
                          </span>
                          <span className="text-lg font-bold text-slate-500 uppercase">{item.d || 'no data'}</span>
                        </div>
                      </td>
                    ))}

                    <td className="px-6 py-5 text-right bg-indigo-950/20">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-emerald-400">${r.closePrice.toFixed(2)}</span>
                        <span className="text-lg font-black text-indigo-400">{r.earningsDate}</span>
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditing(r); setEditStock(r.stockName); setEditDate(r.earningsDate); setEditPrice(r.closePrice.toString()); }} className="text-indigo-400 font-black text-xs hover:text-white uppercase tracking-tighter">Edit</button>
                          <button onClick={() => setDeleting(r)} className="text-red-500 font-black text-xs hover:text-white uppercase tracking-tighter">Purge</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER / PAGINATION */}
          <div className="p-6 bg-slate-950/50 flex justify-between items-center border-t border-slate-800">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Records: {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, records.length)} / {records.length}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-6 py-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-xs font-black disabled:opacity-10 transition-all"
              >
                PREVIOUS
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-6 py-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-xs font-black disabled:opacity-10 transition-all"
              >
                NEXT
              </button>
            </div>
          </div>
        </div>

        {/* MODALS Restored */}
        {editing && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
              <h3 className="text-xl font-black uppercase text-indigo-400 mb-6">Modify Record</h3>
              <div className="space-y-4">
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-xl font-black text-white outline-none focus:border-indigo-500"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value.toUpperCase())}
                />
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-lg font-bold text-white outline-none"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-xl font-bold text-white outline-none"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />

                {/* NEW FIELDS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">45d Date</label>
                    <input type="date" value={editDate45} onChange={(e) => setEditDate45(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">45d Price</label>
                    <input type="number" value={editPrice45} onChange={(e) => setEditPrice45(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">30d Date</label>
                    <input type="date" value={editDate30} onChange={(e) => setEditDate30(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">30d Price</label>
                    <input type="number" value={editPrice30} onChange={(e) => setEditPrice30(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">14d Date</label>
                    <input type="date" value={editDate14} onChange={(e) => setEditDate14(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">14d Price</label>
                    <input type="number" value={editPrice14} onChange={(e) => setEditPrice14(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">1d Date</label>
                    <input type="date" value={editDate1} onChange={(e) => setEditDate1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">1d Price</label>
                    <input type="number" value={editPrice1} onChange={(e) => setEditPrice1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => setEditing(null)} className="px-6 py-3 text-sm text-slate-500 font-black uppercase hover:text-white transition-all">Cancel</button>
                <button onClick={saveEdit} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase shadow-lg shadow-indigo-500/30 transition-all">Commit</button>
              </div>
            </div>
          </div>
        )}

        {deleting && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-red-900 shadow-2xl text-center">
              <h3 className="text-2xl font-black uppercase text-red-500 mb-2">Confirm Purge</h3>
              <p className="text-slate-400 mb-8">This will permanently remove <strong>{deleting.stockName}</strong> from the database.</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setDeleting(null)} className="px-8 py-3 text-sm text-slate-500 font-black uppercase">Abort</button>
                <button onClick={remove} className="px-10 py-3 bg-red-600 text-white rounded-xl text-sm font-black uppercase transition-all shadow-lg shadow-red-500/20">Delete Forever</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
