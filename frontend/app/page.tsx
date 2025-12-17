"use client";

import { useEffect, useState } from "react";
import ExportButton from "./utils/ExportExcel";

/* =======================
   Month helper
======================= */
const monthMap: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

type Earnings = {
  id: number;
  stockName: string;
  earningsDate: string;
  closePrice: number;
};

// Define the new set of allowed years
const ALLOWED_YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];

export default function Home() {
  const API_URL = "http://localhost:3001/earnings";

  const [records, setRecords] = useState<Earnings[]>([]);
  const [editing, setEditing] = useState<Earnings | null>(null);
  const [deleting, setDeleting] = useState<Earnings | null>(null);
  const [error, setError] = useState("");

  /* =======================
     Add form state
  ======================= */
  const [form, setForm] = useState({
    stockName: "",
    earningsDate: "",
    closePrice: "",
  });

  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  /* =======================
     Edit form state
  ======================= */
  const [editStock, setEditStock] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");

  /* =======================
     Build date from inputs
  ======================= */
  const buildDate = () => {
    const m = monthMap[month.toLowerCase().trim()];
    const dayNumber = Number(day);
    
    // Check for 1-31 day range
    if (!m || !day || !year || dayNumber < 1 || dayNumber > 31) return "";
    
    // Check against the new ALLOWED_YEARS list
    if (!ALLOWED_YEARS.includes(year)) return "";

    return `${year}-${m}-${day.padStart(2, "0")}`;
  };

  /* Sync computed date into form */
  useEffect(() => {
    const date = buildDate();
    if (date) {
      setForm((prev) => ({ ...prev, earningsDate: date }));
      setError(""); // Clear error if date is valid
    } else if (month || day || year) {
        // Only set the date back to empty if inputs are present but the date is invalid
        setForm((prev) => ({ ...prev, earningsDate: "" }));
    }
  }, [month, day, year]);

  /* =======================
     Fetch records
  ======================= */
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

  /* =======================
     Create
  ======================= */
  const submit = async () => {
    setError(""); // Reset error

    // 1. Basic required field validation
    if (!form.stockName || !form.closePrice) {
        setError("Please fill Stock and Close Price.");
        return;
    }

    // 2. Date field presence validation
    if (!month || !day || !year) {
        setError("Please select Month, Day, and Year.");
        return;
    }

    // 3. Specific date content validation
    const dayNumber = Number(day);
    if (dayNumber < 1 || dayNumber > 31) {
        setError("Day must be between 1 and 31.");
        return;
    }
    
    if (!ALLOWED_YEARS.includes(year)) {
        setError(`Year must be one of: ${ALLOWED_YEARS.join(', ')}.`);
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

    // If validation passes
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

      // Clear the form and date inputs
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

  /* =======================
     Delete
  ======================= */
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

  /* =======================
     Edit
  ======================= */
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

  /* =======================
     UI
  ======================= */
  
  // Custom Year Button Component
  const YearButton = ({ value }: { value: string }) => (
    <button
      type="button"
      onClick={() => setYear(value)}
      className={`flex-grow border px-3 py-2 rounded text-xs sm:text-sm transition-colors
        ${year === value 
          ? 'bg-blue-600 text-white border-blue-600' 
          : 'bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
        }`}
    >
      {value}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-12">
      <main className="mx-auto max-w-4xl space-y-10">
        <h1 className="text-3xl font-semibold">Stock Earnings Tracker</h1>

        {/* Add Record */}
        <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900 shadow-md">
          <h2 className="mb-4 text-xl font-medium">Add Record</h2>

          {/* Form Layout: 3 Inputs (Stock, Month, Day) and 2 combined sections (Year Buttons, Price) */}
          <div className="grid gap-4 md:grid-cols-5 items-start">
            
            <input
              placeholder="Stock (AAPL)"
              className="border px-3 py-2 rounded dark:bg-zinc-800 col-span-1 md:col-span-1"
              value={form.stockName}
              onChange={(e) =>
                setForm({ ...form, stockName: e.target.value.toUpperCase() })
              }
            />

            <input
              type="number"
              placeholder="Day (1-31)"
              min={1}
              max={31}
              className="border px-3 py-2 rounded dark:bg-zinc-800 col-span-1 md:col-span-1"
              value={day}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (Number(val) >= 1 && Number(val) <= 31)) {
                  setDay(val);
                }
              }}
            />

            <input
              placeholder="Month (Dec)"
              className="border px-3 py-2 rounded dark:bg-zinc-800 col-span-1 md:col-span-1"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />


            <div className="flex flex-wrap gap-2 col-span-full md:col-span-1 items-center">
              {ALLOWED_YEARS.map(y => <YearButton key={y} value={y} />)}
            </div>

            <input
              type="number"
              step="0.01"
              placeholder="Close Price"
              className="border px-3 py-2 rounded dark:bg-zinc-800 col-span-full md:col-span-1"
              value={form.closePrice}
              onChange={(e) =>
                setForm({ ...form, closePrice: e.target.value })
              }
            />
          </div>
          
          {/* Status and Error Messages */}
          <div className="mt-4 min-h-6">
            {(form.earningsDate && !error) && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Date Ready: **{form.earningsDate}**
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium">
                Error: {error}
              </p>
            )}
          </div>

          <button
            onClick={submit}
            className="mt-4 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 px-5 py-2 text-white "
            disabled={!!error || !form.stockName || !form.closePrice || !form.earningsDate}
          >
            Save Record
          </button>
          <ExportButton />
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden shadow-lg">
          <table className="w-full bg-white dark:bg-zinc-900">
            <thead>
              <tr className="border-b bg-zinc-100 dark:bg-zinc-800">
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Close</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-zinc-100 dark:hover:bg-zinc-700 text-white">
                  <td className="px-4 py-3">{r.stockName}</td>
                  <td className="px-4 py-3">{r.earningsDate}</td>
                  <td className="px-4 py-3">${r.closePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right space-x-3">
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
                  <td colSpan={4} className="p-6 text-center text-zinc-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal (unchanged) */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-full max-w-md shadow-2xl">
              <h2 className="mb-4 text-lg font-semibold">Edit Record</h2>

              <input
                className="w-full border px-3 py-2 rounded mb-3 dark:bg-zinc-800"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value.toUpperCase())}
                placeholder="Stock Name"
              />

              <input
                type="date"
                className="w-full border px-3 py-2 rounded mb-3 dark:bg-zinc-800"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                placeholder="Earnings Date"
              />

              <input
                type="number"
                step="0.01"
                className="w-full border px-3 py-2 rounded dark:bg-zinc-800"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Close Price"
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal (unchanged) */}
        {deleting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold text-red-600">
                Confirm Deletion
              </h2>

              <p className="mt-3 text-sm">
                Are you sure you want to delete the earnings record for:
                <br />
                **{deleting.stockName}** on **{deleting.earningsDate}**?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleting(null)}
                  className="px-4 py-2 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={remove}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
