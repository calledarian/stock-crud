"use client";

import { useEffect, useState } from "react";
import ExportButton from "./utils/ExportExcel";

/* ======================= Month helper ======================= */
const monthMap: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02",
  mar: "03", march: "03", apr: "04", april: "04",
  may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11",
  dec: "12", december: "12",
};

type Earnings = {
  id: number;
  stockName: string;
  earningsDate: string;
  closePrice: number;
};

// Define the new set of allowed years
const ALLOWED_YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];
const ITEMS_PER_PAGE = 50; // Pagination limit

export default function Home() {
  const API_URL = "http://localhost:3001/earnings";

  const [records, setRecords] = useState<Earnings[]>([]);
  const [editing, setEditing] = useState<Earnings | null>(null);
  const [deleting, setDeleting] = useState<Earnings | null>(null);
  const [error, setError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  /* ======================= Add form state ======================= */
  const [form, setForm] = useState({
    stockName: "",
    earningsDate: "",
    closePrice: "",
  });
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

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

      setForm({ stockName: form.stockName, earningsDate: "", closePrice: "" });
      setMonth("");
      setDay("");
      setYear("");
      setError("");
      fetchRecords();
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
      setCurrentPage(1); // Reset to page 1 on search
    } catch (e) {
      console.error("Failed to fetch records by stock name:", e);
    }
  };

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
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b pb-4 dark:border-zinc-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Earnings Tracker
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manage and track financial records
            </p>
          </div>
          <ExportButton />
        </header>

        {/* Add Record */}
        <section className="bg-white dark:bg-zinc-800/50 p-6 rounded-lg shadow-sm border dark:border-zinc-700/50">
          <h2 className="text-lg font-semibold mb-4 text-zinc-700 dark:text-zinc-300">
            Add Record
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Text Inputs */}
            <div className="space-y-4">
              <input
                className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:border-blue-500 outline-none py-2 px-1 transition-colors placeholder:text-zinc-400"
                placeholder="STOCK SYMBOL (e.g. AAPL)"
                value={form.stockName}
                onChange={(e) =>
                  setForm({ ...form, stockName: e.target.value.toUpperCase() })
                }
              />

              <div className="flex gap-4">
                <input
                  className="w-1/2 bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:border-blue-500 outline-none py-2 px-1 transition-colors placeholder:text-zinc-400"
                  placeholder="Day (1-31)"
                  value={day}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (Number(val) >= 1 && Number(val) <= 31)) {
                      setDay(val);
                    }
                  }}
                />
                <input
                  className="w-1/2 bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:border-blue-500 outline-none py-2 px-1 transition-colors placeholder:text-zinc-400"
                  placeholder="Month (e.g. Jan)"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column: Year & Price */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {ALLOWED_YEARS.map((y) => (
                  <YearButton key={y} value={y} />
                ))}
              </div>

              <input
                type="number"
                className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:border-blue-500 outline-none py-2 px-1 transition-colors placeholder:text-zinc-400"
                placeholder="Close Price ($)"
                value={form.closePrice}
                onChange={(e) =>
                  setForm({ ...form, closePrice: e.target.value })
                }
              />
            </div>
          </div>

          {/* Status and Error Messages */}
          <div className="mt-6 flex justify-between items-center text-sm min-h-[24px]">
            <div>
              {form.earningsDate && !error && (
                <span className="text-green-600 dark:text-green-400">
                  Date Ready: <strong>{form.earningsDate}</strong>
                </span>
              )}
              {error && (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  Error: {error}
                </span>
              )}
            </div>
            <button
              onClick={submit}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded font-medium hover:opacity-90 transition-opacity"
            >
              Save Record
            </button>
          </div>
        </section>

        {/* Controls */}
        <div className="flex gap-2">
          <input
            className="flex-grow bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded px-4 py-2 outline-none focus:ring-2 ring-blue-500/20 transition-all placeholder:text-zinc-400"
            placeholder="Filter by Stock Name..."
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
                  <td className="p-4 font-medium">{r.stockName}</td>
                  <td className="p-4 text-zinc-500">{r.earningsDate}</td>
                  <td className="p-4 text-right font-mono">
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

          {/* Pagination Controls */}
          {records.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 border-t dark:border-zinc-700">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {indexOfFirstRecord + 1} to{" "}
                {Math.min(indexOfLastRecord, records.length)} of {records.length}{" "}
                results
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