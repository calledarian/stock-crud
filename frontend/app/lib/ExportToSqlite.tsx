'use client';

export default function ExportButtonSqlite() {
  const exportSqlite = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/earnings/export/sqlite`);

    if (!res.ok) {
      alert('Export failed');
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'earnings.db';
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportSqlite}
      className="px-4 py-2 bg-green-600 text-white rounded"
    >
      Export SQLite
    </button>
  );
}
