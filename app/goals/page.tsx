"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/formatters";

interface Goal {
  id: number;
  sortOrder: number;
  name: string;
  description: string | null;
  costNeeded: string | number;
  achieved: boolean;
  achievedAt: string | null;
  notes: string | null;
}

function toNum(v: string | number) {
  return typeof v === "string" ? parseFloat(v) : v;
}

function InlineText({
  value,
  placeholder,
  goalId,
  field,
  onSaved,
  className,
}: {
  value: string | null;
  placeholder?: string;
  goalId: number;
  field: string;
  onSaved: (id: number, field: string, val: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goalId, [field]: draft }),
    });
    setSaving(false);
    setEditing(false);
    onSaved(goalId, field, draft);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        onBlur={save}
        placeholder={placeholder}
        className={`border border-blue-400 rounded px-2 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 ${className ?? ""}`}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      className={`text-sm text-left w-full cursor-text group hover:text-blue-600 ${className ?? ""}`}
      title="Click to edit"
    >
      {value || <span className="italic text-slate-300 group-hover:text-slate-400">{placeholder ?? "—"}</span>}
      {saving && <span className="ml-1 text-xs text-slate-400">...</span>}
    </button>
  );
}

function InlineCost({
  value,
  goalId,
  onSaved,
}: {
  value: number;
  goalId: number;
  onSaved: (id: number, val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(2));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(draft);
    if (isNaN(num)) { setEditing(false); return; }
    setSaving(true);
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goalId, costNeeded: num }),
    });
    setSaving(false);
    setEditing(false);
    onSaved(goalId, num);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-slate-400 text-xs">$</span>
        <input
          autoFocus
          type="number"
          step="1"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onBlur={save}
          className="w-28 border border-blue-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {saving && <span className="text-xs text-slate-400">...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value.toFixed(2)); setEditing(true); }}
      className="text-sm cursor-text group hover:text-blue-600 text-slate-700"
      title="Click to edit"
    >
      {formatCurrency(value)}
      <span className="ml-1 opacity-0 group-hover:opacity-100 text-xs text-blue-400">✏</span>
    </button>
  );
}

function AddGoalRow({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, costNeeded: parseFloat(cost) || 0, notes: notes.trim() || null }),
    });
    setSaving(false);
    setName(""); setDescription(""); setCost(""); setNotes("");
    setOpen(false);
    onAdded();
  };

  if (!open) {
    return (
      <tr className="border-t border-dashed border-slate-200">
        <td colSpan={5} className="px-5 py-2">
          <button onClick={() => setOpen(true)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
            <span className="text-base leading-none">+</span> Add goal
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-dashed border-blue-200 bg-blue-50/40">
      <td className="px-4 py-2">
        <input autoFocus type="text" placeholder="Goal name" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </td>
      <td className="px-4 py-2">
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-xs">$</span>
          <input type="number" step="1" min="0" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </td>
      <td className="px-4 py-2 text-center text-slate-300 text-xs italic">auto</td>
      <td className="px-4 py-2">
        <div className="flex gap-2 items-center">
          <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button onClick={save} disabled={saving || !name.trim()}
            className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50">
            {saving ? "..." : "Add"}
          </button>
          <button onClick={() => setOpen(false)} className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs">Cancel</button>
        </div>
      </td>
    </tr>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      setGoals(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleTextSaved = (id: number, field: string, val: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: val } : g)));
  };

  const handleCostSaved = (id: number, val: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, costNeeded: val } : g)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 md:pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Financial Goals</h1>
        <p className="text-sm text-slate-500 mt-0.5">Goals are achieved in order as cumulative savings milestones are reached</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left w-36">Goal</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left w-40">Cost / Dollars Needed</th>
                  <th className="px-4 py-3 text-center w-32">Goal Achieved</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goals.map((goal) => (
                  <tr key={goal.id} className={goal.achieved ? "bg-green-50/50 hover:bg-green-50" : "hover:bg-slate-50/60"}>
                    <td className="px-5 py-3">
                      <InlineText value={goal.name} placeholder="Goal name" goalId={goal.id} field="name" onSaved={handleTextSaved}
                        className={goal.achieved ? "font-semibold text-green-700" : "font-medium text-slate-800"} />
                    </td>
                    <td className="px-4 py-3">
                      <InlineText value={goal.description} placeholder="Add description..." goalId={goal.id} field="description" onSaved={handleTextSaved}
                        className="text-slate-600" />
                    </td>
                    <td className="px-4 py-3">
                      <InlineCost value={toNum(goal.costNeeded)} goalId={goal.id} onSaved={handleCostSaved} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {goal.achieved ? (
                        <span title={goal.achievedAt ? `Achieved ${new Date(goal.achievedAt).toLocaleDateString()}` : "Achieved"}>
                          <svg className="w-6 h-6 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <svg className="w-6 h-6 text-slate-200 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      <InlineText value={goal.notes} placeholder="Add note..." goalId={goal.id} field="notes" onSaved={handleTextSaved}
                        className="text-slate-500" />
                    </td>
                  </tr>
                ))}
                <AddGoalRow onAdded={fetchGoals} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
