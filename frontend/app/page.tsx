"use client";

import { useEffect, useState, useRef } from "react";

/* ======================= Month helper ======================= */
const monthMap: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02",
  mar: "03", march: "03", apr: "04", april: "04",
  may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11",
  dec: "12", december: "12",
};

const MONTH_LABELS = [
  { label: "Jan", value: "jan" },
  { label: "Feb", value: "feb" },
  { label: "Mar", value: "mar" },
  { label: "Apr", value: "apr" },
  { label: "May", value: "may" },
  { label: "Jun", value: "jun" },
  { label: "Jul", value: "jul" },
  { label: "Aug", value: "aug" },
  { label: "Sep", value: "sep" },
  { label: "Oct", value: "oct" },
  { label: "Nov", value: "nov" },
  { label: "Dec", value: "dec" },
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
  const API_URL = "http://localhost:3001/earnings";

  const [records, setRecords] = useState<Earnings[]>([]);
  const [editing, setEditing] = useState<Earnings | null>(null);
  const [deleting, setDeleting] = useState<Earnings | null>(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const stockInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  /* ======================= Add form state ======================= */
  const [form, setForm] = useState({
    stockName: "",
    earningsDate: "",
    closePrice: "",
  });
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("2025"); // Default to current year

  /* ======================= Edit form state ======================= */
  const [editStock, setEditStock] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");

  /* ======================= Build date from inputs ======================= */
  const buildDate = () => {
    const m = monthMap[month.toLowerCase().trim()];
    const dayNumber = Number(day);

    if (!m || !day || !year || dayNumber < 1 || dayNumber > 31) return "";
    if (!ALLOWED_YEARS.includes(year)) return "";

    return `${year}-${m}-${day.padStart(2, "0")}`;
  };

  const addDotToPrice = () => {
    setForm((prev) =>
      prev.closePrice.includes(".")
        ? prev
        : { ...prev, closePrice: prev.closePrice + "." }
    );
    setTimeout(() => priceInputRef.current?.focus(), 0);
  };

  /* Sync computed date into form */
  useEffect(() => {
    const date = buildDate();
    if (date) {
      setForm((prev) => ({ ...prev, earningsDate: date }));
      setError("");
    } else if (month || day || year) {
      setForm((prev) => ({ ...prev, earningsDate: "" }));
    }
  }, [month, day, year]);

  /* ======================= Fetch records ======================= */
  const fetchRecords = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      console.error("Failed to fetch records:", e);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  /* ======================= Create ======================= */
  const submit = async () => {
    setError("");

    if (!form.stockName || !form.closePrice) {
      setError("Please fill Stock and Close Price.");
      return;
    }
    if (!month || !day || !year) {
      setError("Please select Month, Day, and Year.");
      return;
    }

    const dayNumber = Number(day);
    if (dayNumber < 1 || dayNumber > 31) {
      setError("Day must be between 1 and 31.");
      return;
    }
    if (!ALLOWED_YEARS.includes(year)) {
      setError(`Year must be one of: ${ALLOWED_YEARS.join(", ")}.`);
      return;
    }
    if (!monthMap[month.toLowerCase().trim()]) {
      setError("Invalid month name (use Dec or December, etc.).");
      return;
    }

    const earningsDate = buildDate();
    if (!earningsDate) {
      setError("Invalid date combination or year selection.");
      return;
    }

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockName: form.stockName,
          earningsDate: earningsDate,
          closePrice: Number(form.closePrice),
        }),
      });

      // Keep stock name for quick entry of same stock
      setForm({ stockName: form.stockName, earningsDate: "", closePrice: "" });
      setMonth("");
      setDay("");
      // Keep year selected
      setError("");
      fetchRecords();
      
      // Focus back to stock input for next entry
      setTimeout(() => stockInputRef.current?.focus(), 100);
    } catch (e) {
      console.error("Failed to submit record:", e);
      setError("Failed to save record to API.");
    }
  };

  /* ======================= Delete ======================= */
  const remove = async () => {
    if (!deleting) return;
    try {
      await fetch(`${API_URL}/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      fetchRecords();
    } catch (e) {
      console.error("Failed to delete record:", e);
    }
  };

  /* ======================= Edit ======================= */
  const edit = (id: number) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    setEditing(record);
    setEditStock(record.stockName);
    setEditDate(record.earningsDate);
    setEditPrice(record.closePrice.toString());
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await fetch(`${API_URL}/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockName: editStock,
          earningsDate: editDate,
          closePrice: Number(editPrice),
        }),
      });
      setEditing(null);
      fetchRecords();
    } catch (e) {
      console.error("Failed to save edit:", e);
    }
  };

  const findByStockName = async (stockName: string) => {
    try {
      if (!stockName) {
        fetchRecords();
        return;
      }
      const res = await fetch(`${API_URL}/stock/${stockName}`);
      const data = await res.json();
      setRecords(data);
      setCurrentPage(1);
    } catch (e) {
      console.error("Failed to fetch records by stock name:", e);
    }
  };

  /* ======================= Keyboard shortcuts ======================= */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [form, month, day, year]);

  /* ======================= Pagination Logic ======================= */
  const indexOfLastRecord = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRecord = indexOfLastRecord - ITEMS_PER_PAGE;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  /* ======================= UI ======================= */
  const YearButton = ({ value }: { value: string }) => (
    <button
      onClick={() => setYear(value)}
      className={`flex-grow border px-3 py-2 rounded text-xs sm:text-sm transition-colors ${
        year === value
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
      }`}
    >
      {value}
    </button>
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 p-6 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b pb-4 dark:border-zinc-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Earnings Tracker
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Lazy data entry • Ctrl+Enter to save
            </p>
          </div>
        </header>

        {/* Quick Entry Form */}
        <section className="bg-white dark:bg-zinc-800/50 p-6 rounded-lg shadow-sm border dark:border-zinc-700/50">
          <h2 className="text-lg font-semibold mb-4 text-zinc-700 dark:text-zinc-300">
            Quick Entry
          </h2>

          <div className="space-y-4">
            {/* Stock and Price - Single Line */}
            <div className="flex gap-3">
              <input
                ref={stockInputRef}
                className="w-40 bg-transparent border-b-2 border-zinc-300 dark:border-zinc-600 focus:border-blue-500 outline-none py-2 px-2 transition-colors placeholder:text-zinc-400 text-lg font-bold"
                placeholder="TICKER"
                value={form.stockName}
                onChange={(e) =>
                  setForm({ ...form, stockName: e.target.value.toUpperCase() })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    priceInputRef.current?.focus();
                  }
                }}
              />
              <div className="flex gap-2 items-center flex-1">
                <span className="text-2xl text-zinc-400">$</span>
                <input
                  ref={priceInputRef}
                  type="text"
                  className="flex-1 bg-transparent border-b-2 border-zinc-300 dark:border-zinc-600 focus:border-blue-500 outline-none py-2 px-2 text-lg font-mono"
                  placeholder="123.45"
                  value={form.closePrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setForm({ ...form, closePrice: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '.') {
                      e.preventDefault();
                      addDotToPrice();
                    }
                  }}
                />
                <button
                  onClick={addDotToPrice}
                  className="px-3 py-2 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xl font-bold"
                  title="Add decimal point"
                >
                  .
                </button>
              </div>
            </div>

            {/* Date Selection - Compact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">

              {/* Day Selection */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Day</label>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = (i + 1).toString();
                    return (
                      <button
                        key={d}
                        onClick={() => setDay(d)}
                        className={`h-9 text-xs rounded border transition-colors ${
                          day === d
                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                            : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Selection */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Month</label>
                <div className="grid grid-cols-4 gap-1">
                  {MONTH_LABELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMonth(m.value)}
                      className={`px-2 py-2 text-xs rounded border transition-colors ${
                        month === m.value
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                          : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Year Selection */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Year</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALLOWED_YEARS.map((y) => (
                    <YearButton key={y} value={y} />
                  ))}
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center pt-4 border-t dark:border-zinc-700">
              <div className="text-sm space-y-1">
                {form.earningsDate && !error && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Ready: <strong className="text-zinc-900 dark:text-zinc-100 text-base">{form.earningsDate}</strong>
                    </span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">✗</span>
                    <span className="text-red-600 dark:text-red-400">{error}</span>
                  </div>
                )}
              </div>
              <button
                onClick={submit}
                disabled={!form.stockName || !form.closePrice || !form.earningsDate}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save <span className="text-xs opacity-70">(Ctrl+Enter)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="flex gap-2">
          <input
            className="flex-grow bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded px-4 py-2 outline-none focus:ring-2 ring-blue-500/20 transition-all placeholder:text-zinc-400"
            placeholder="🔍 Filter by Stock Name..."
            onChange={(e) => findByStockName(e.target.value.toUpperCase())}
          />
          <button
            onClick={fetchRecords}
            className="px-4 py-2 border dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="border dark:border-zinc-700 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800 border-b dark:border-zinc-700">
              <tr>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold text-right">Close</th>
                <th className="p-4 font-semibold text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-700 bg-white dark:bg-zinc-900">
              {currentRecords.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="p-4 font-bold text-base">{r.stockName}</td>
                  <td className="p-4 text-zinc-500">{r.earningsDate}</td>
                  <td className="p-4 text-right font-mono text-base">
                    ${r.closePrice.toFixed(2)}
                  </td>
                  <td className="p-4 flex justify-center gap-4">
                    <button
                      onClick={() => edit(r.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleting(r)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {records.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 border-t dark:border-zinc-700">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {indexOfFirstRecord + 1} to{" "}
                {Math.min(indexOfLastRecord, records.length)} of {records.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm border dark:border-zinc-600 ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white dark:hover:bg-zinc-700"
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm border dark:border-zinc-600 ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white dark:hover:bg-zinc-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-sm space-y-4 shadow-xl">
              <h3 className="text-lg font-bold">Edit Record</h3>
              <input
                className="w-full bg-transparent border p-2 rounded"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value.toUpperCase())}
                placeholder="Stock Name"
              />
              <input
                className="w-full bg-transparent border p-2 rounded"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                placeholder="Earnings Date"
              />
              <input
                className="w-full bg-transparent border p-2 rounded"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Close Price"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-red-600">
                Confirm Deletion
              </h3>
              <p>
                Are you sure you want to delete the earnings record for:
                <br />
                <strong className="text-lg">{deleting.stockName}</strong> on{" "}
                <strong>{deleting.earningsDate}</strong>?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setDeleting(null)}
                  className="px-4 py-2 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={remove}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
