"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  email: string;
  role: "admin" | "worker";
}

export default function ManagementPage() {
  const router = useRouter();
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/users`;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const [formData, setFormData] = useState({ email: "", password: "", role: "worker" as "admin" | "worker" });
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "worker">("worker");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.role !== "admin") {
        router.push("/dashboard");
        return;
      }
    } catch (e) {
      router.push("/");
    }
    fetchUsers();
  }, []);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("access_token");
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/");
    }
    return res;
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch(API_URL);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const res = await authFetch(API_URL, {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({ email: "", password: "", role: "worker" });
      fetchUsers();
      return;
    }
    const errorData = await res.json();
    if (res.status === 409) {
      setCreateError(errorData.message);
    } else {
      setCreateError("Something went wrong. Please try again.");
    }
  };


  const startEdit = (user: User) => {
    setEditing(user);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const saveEdit = async () => {
    if (!editing) return;

    const payload: any = { email: editEmail, role: editRole };
    if (editPassword.trim() !== "") {
      payload.password = editPassword;
    }

    const res = await authFetch(`${API_URL}/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditing(null);
      setEditPassword("");
      fetchUsers();
    }
  };


  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await authFetch(`${API_URL}/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      fetchUsers();
    }
  };

  if (loading) return <div className="p-10 font-mono text-slate-400">Loading Database...</div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-6 font-mono transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        {createError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-2 rounded text-sm font-bold">
            {createError}
          </div>
        )}
        <header className="flex justify-between items-end border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              User Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Admin Control Panel</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              {showForm ? "Cancel" : "+ Add User"}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-4 py-2 rounded font-bold transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </header>
        {showForm && (
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-sm font-bold mb-4 text-blue-500 uppercase">Register New Member</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase">Email Address</label>
                  <input
                    className="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none py-1 px-1 transition-colors"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase">Password</label>
                  <input
                    type="password"
                    className="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none py-1 px-1 transition-colors"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase">System Rank</label>
                  <select
                    className="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none py-1 px-1 appearance-none cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="worker" className="dark:bg-slate-900 text-black dark:text-white">Worker</option>
                    <option value="admin" className="dark:bg-slate-900 text-black dark:text-white">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-slate-900 dark:bg-blue-500 text-white dark:text-white px-8 py-2 rounded font-bold hover:bg-blue-600 transition-colors">
                  Authorize User
                </button>
              </div>
            </form>
          </section>
        )}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Credential</th>
                <th className="p-4 font-semibold">Rank</th>
                <th className="p-4 font-semibold text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${user.role === 'admin'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-4">
                    <button onClick={() => startEdit(user)} className="text-blue-500 hover:text-blue-400 font-bold">Modify</button>
                    <button onClick={() => setDeleting(user)} className="text-red-500 hover:text-red-400 font-bold opacity-80 hover:opacity-100">Purge</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-sm space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-blue-500">Edit Permissions</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase">Update Email</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded outline-none focus:ring-1 ring-blue-500"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase">Update Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded outline-none focus:ring-1 ring-blue-500"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase">Update Rank</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded outline-none cursor-pointer"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-slate-500 hover:text-slate-400">Abort</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500">Commit Changes</button>
              </div>
            </div>
          </div>
        )}
        {deleting && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl w-full max-w-md space-y-4 shadow-2xl border-t-4 border-red-600 dark:border-red-500">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-500 uppercase tracking-tighter">Confirm Deletion</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Warning: You are about to remove user <strong className="text-slate-900 dark:text-white underline decoration-red-500/50">{deleting.email}</strong> from the mainframe. This action is logged and permanent.
              </p>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 shadow-lg shadow-red-900/20">Purge Record</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
