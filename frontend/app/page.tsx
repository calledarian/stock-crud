"use client";

import { useEffect, useState } from "react";

type Earnings = {
  id: number;
  stockName: string;
  earningsDate: string;
  closePrice: number;
};

export default function Home() {
  const [records, setRecords] = useState<Earnings[]>([]);
  const [form, setForm] = useState({
    stockName: "",
    earningsDate: "",
    closePrice: "",
  });

  const API_URL = "http://localhost:3000/earnings";

  const fetchRecords = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const submit = async () => {
    if (!form.stockName || !form.earningsDate || !form.closePrice) return;

    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stockName: form.stockName,
        earningsDate: form.earningsDate,
        closePrice: Number(form.closePrice),
      }),
    });

    setForm({ stockName: form.stockName, earningsDate: "", closePrice: "" });
    fetchRecords();
  };

  const remove = async (id: number) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchRecords();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-12">
      <main className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Stock Earnings & Reaction Tracker
        </h1>

        {/* Form */}
        <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-medium">Add Record</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              required
              className="rounded-md border px-3 py-2 dark:bg-black"
              placeholder="Stock (AAPL)"
              value={form.stockName}
              onChange={(e) =>
                setForm({ ...form, stockName: e.target.value.toUpperCase() })
              }
            />
            <input
              required
              type="date"
              className="rounded-md border px-3 py-2 dark:bg-black"
              value={form.earningsDate}
              onChange={(e) =>
                setForm({ ...form, earningsDate: e.target.value })
              }
            />
            <input
              required
              type="number"
              step="0.01"
              className="rounded-md border px-3 py-2 dark:bg-black"
              placeholder="Close Price"
              value={form.closePrice}
              onChange={(e) =>
                setForm({ ...form, closePrice: e.target.value })
              }
            />
          </div>

          <button
            onClick={submit}
            className="mt-4 rounded-md bg-black px-5 py-2 text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
          >
            Save
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border dark:border-zinc-800">
          <table className="w-full border-collapse bg-white dark:bg-zinc-900">
            <thead>
              <tr className="border-b dark:border-zinc-800">
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Earnings Date</th>
                <th className="px-4 py-3 text-left">Close</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b last:border-none dark:border-zinc-800"
                >
                  <td className="px-4 py-3 font-medium">{r.stockName}</td>
                  <td className="px-4 py-3">{r.earningsDate}</td>
                  <td className="px-4 py-3">{r.closePrice}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(r.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    No records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
