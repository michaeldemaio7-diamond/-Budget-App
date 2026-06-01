"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Settings } from "@/types";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { calculatePaychecksForMonth } from "@/lib/paychecks";

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<1 | 2 | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const gmailConnected = searchParams.get("gmailConnected");
  const gmailError = searchParams.get("gmailError");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); });
  }, []);

  const update = (field: keyof Settings, value: string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertEmail: settings.alertEmail,
          taxRate: parseFloat(String(settings.taxRate)),
          wifeSalaryGross: parseFloat(String(settings.wifeSalaryGross)),
          job1SalaryGross: parseFloat(String(settings.job1SalaryGross)),
          job2SalaryGross: parseFloat(String(settings.job2SalaryGross)),
          wifeFirstPayDate: settings.wifeFirstPayDate,
          job1FirstPayDate: settings.job1FirstPayDate,
          gmailAccount1: settings.gmailAccount1,
          gmailAccount2: settings.gmailAccount2,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGmail = async (account: 1 | 2) => {
    const res = await fetch(`/api/gmail/auth?account=${account}`);
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    window.location.href = data.authUrl;
  };

  const handleSyncGmail = async (account: 1 | 2) => {
    setSyncing(account);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });
      const data = await res.json();
      setSyncMsg(data.message || data.error || "Sync attempted");
    } finally {
      setSyncing(null);
    }
  };

  const handleCheckAlerts = async () => {
    const res = await fetch("/api/alerts/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    alert(`Alerts checked: ${data.alertsTriggered ?? 0} triggered out of ${data.alertsChecked ?? 0} rows`);
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;
  if (!settings) return null;

  const taxRateNum = parseFloat(String(settings.taxRate));
  const wifeGross = parseFloat(String(settings.wifeSalaryGross));
  const job1Gross = parseFloat(String(settings.job1SalaryGross));
  const job2Gross = parseFloat(String(settings.job2SalaryGross));

  const account1Connected = Boolean(settings.gmailToken1);
  const account2Connected = Boolean(settings.gmailToken2);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>

      {/* OAuth result banners */}
      {gmailConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          ✓ Gmail account {gmailConnected} connected successfully.
        </div>
      )}
      {gmailError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          Gmail connection error: {gmailError}
        </div>
      )}

      {/* Income Configuration */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Income Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure salary amounts and tax rates used for paycheck calculations</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective Tax Rate</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={taxRateNum}
                onChange={(e) => update("taxRate", parseFloat(e.target.value))}
                className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-24"
              />
              <span className="text-sm text-slate-500">({(taxRateNum * 100).toFixed(0)}% — applied to all salary net estimates)</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <IncomeRow
              label="Wife Annual Salary"
              subLabel="Biweekly · 26 paychecks/year"
              gross={wifeGross}
              onGrossChange={(v) => update("wifeSalaryGross", v)}
              firstPayDate={settings.wifeFirstPayDate}
              onDateChange={(v) => update("wifeFirstPayDate", v)}
              taxRate={taxRateNum}
              paychecksPerYear={26}
            />
            <IncomeRow
              label="Job 1 Annual Salary"
              subLabel="Biweekly · 26 paychecks/year"
              gross={job1Gross}
              onGrossChange={(v) => update("job1SalaryGross", v)}
              firstPayDate={settings.job1FirstPayDate}
              onDateChange={(v) => update("job1FirstPayDate", v)}
              taxRate={taxRateNum}
              paychecksPerYear={26}
            />
            <IncomeRow
              label="Job 2 Annual Salary"
              subLabel="Bi-monthly · 24 paychecks/year (15th & last day)"
              gross={job2Gross}
              onGrossChange={(v) => update("job2SalaryGross", v)}
              taxRate={taxRateNum}
              paychecksPerYear={24}
            />
          </div>
        </div>
      </section>

      {/* Paycheck Schedule Preview */}
      <PaycheckSchedule
        wifeFirstPayDate={settings.wifeFirstPayDate}
        job1FirstPayDate={settings.job1FirstPayDate}
        wifeNet={parseFloat(String(settings.wifeNetPaycheck ?? 3800))}
        job1Net={parseFloat(String(settings.job1NetPaycheck ?? 3400))}
        job2Net={parseFloat(String(settings.job2NetPaycheck ?? 2200))}
      />

      {/* Notification Settings */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Budget Alerts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Get email alerts when budget categories approach their limit</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alert Email Address</label>
            <input
              type="email"
              value={settings.alertEmail || ""}
              onChange={(e) => update("alertEmail", e.target.value)}
              placeholder="you@example.com"
              className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full max-w-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Requires SMTP_USER and SMTP_PASS in .env (use a Gmail App Password)</p>
          </div>
          <div>
            <button
              onClick={handleCheckAlerts}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              Check &amp; Send Alerts Now
            </button>
          </div>
        </div>
      </section>

      {/* Gmail Integration */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Gmail Integration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Auto-import Chase credit card transactions from Gmail</p>
        </div>
        <div className="p-5 space-y-5">
          {(!process.env.NEXT_PUBLIC_GMAIL_CONFIGURED) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
              <p><strong>One-time Google Cloud setup:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.cloud.google.com</a> → APIs &amp; Services → Credentials</li>
                <li>Create an OAuth 2.0 Client ID (Web application)</li>
                <li>Add <code className="bg-blue-100 px-1 rounded">{"{NEXT_PUBLIC_APP_URL}"}/api/gmail/callback</code> as an Authorized Redirect URI</li>
                <li>Add <code className="bg-blue-100 px-1 rounded">GOOGLE_CLIENT_ID</code>, <code className="bg-blue-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code>, and <code className="bg-blue-100 px-1 rounded">GOOGLE_REDIRECT_URI</code> to your .env file</li>
                <li>Enable the Gmail API in APIs &amp; Services → Library</li>
              </ol>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GmailAccountCard
              label="Your Gmail"
              account={1}
              email={settings.gmailAccount1 || ""}
              connected={account1Connected}
              onEmailChange={(v) => update("gmailAccount1", v)}
              onConnect={() => handleConnectGmail(1)}
              onSync={() => handleSyncGmail(1)}
              syncing={syncing === 1}
            />
            <GmailAccountCard
              label="Wife's Gmail"
              account={2}
              email={settings.gmailAccount2 || ""}
              connected={account2Connected}
              onEmailChange={(v) => update("gmailAccount2", v)}
              onConnect={() => handleConnectGmail(2)}
              onSync={() => handleSyncGmail(2)}
              syncing={syncing === 2}
            />
          </div>

          {syncMsg && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700">
              {syncMsg}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">Chase email formats recognized:</p>
            <p><code className="bg-slate-100 px-1 rounded">"Your $127.43 transaction at Whole Foods Market"</code></p>
            <p><code className="bg-slate-100 px-1 rounded">"A new transaction of $42.50 was charged to your Chase card ending in 1234"</code></p>
            <p className="mt-2">Transactions are deduplicated by Gmail message ID. Unassigned transactions can be categorized from the Transactions page.</p>
          </div>
        </div>
      </section>

      {/* Budget Template info */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Monthly Budget Setup</h2>
        </div>
        <div className="p-5 text-sm text-slate-600 space-y-2">
          <p>When you navigate to a new month on the Dashboard, the app automatically creates it by copying budget amounts from the most recent month. All recurring line items carry forward so you only need to adjust what changes.</p>
          <p className="text-slate-500">To manually navigate to a month, use the arrow controls on the Dashboard.</p>
        </div>
      </section>
    </div>
  );
}

function IncomeRow({
  label, subLabel, gross, onGrossChange, firstPayDate, onDateChange, taxRate, paychecksPerYear,
}: {
  label: string;
  subLabel: string;
  gross: number;
  onGrossChange: (v: number) => void;
  firstPayDate?: string;
  onDateChange?: (v: string) => void;
  taxRate: number;
  paychecksPerYear: number;
}) {
  const netPerCheck = (gross / paychecksPerYear) * (1 - taxRate);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end py-2">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <CurrencyInput value={gross} onChange={onGrossChange} className="w-full" />
        <p className="text-xs text-slate-400 mt-1">{subLabel}</p>
      </div>
      {firstPayDate !== undefined && onDateChange ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">First Pay Date</label>
          <input
            type="date"
            value={firstPayDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full"
          />
        </div>
      ) : <div />}
      <div className="text-sm text-slate-500 pb-1">≈ {fmt(netPerCheck)}/check net</div>
    </div>
  );
}

function GmailAccountCard({
  label, email, connected, onEmailChange, onConnect, onSync, syncing,
}: {
  label: string;
  account: 1 | 2;
  email: string;
  connected: boolean;
  onEmailChange: (v: string) => void;
  onConnect: () => void;
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${connected ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="account@gmail.com"
        className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full"
      />
      <div className="flex gap-2">
        <button
          onClick={onConnect}
          className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700"
        >
          {connected ? "Re-connect" : "Connect Gmail"}
        </button>
        {connected && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-200 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        )}
      </div>
    </div>
  );
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function PaycheckSchedule({
  wifeFirstPayDate, job1FirstPayDate, wifeNet, job1Net, job2Net,
}: {
  wifeFirstPayDate: string;
  job1FirstPayDate: string;
  wifeNet: number;
  job1Net: number;
  job2Net: number;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  // Build full year schedule
  const monthRows = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const checks = calculatePaychecksForMonth(year, month, {
      wifeNetPaycheck: wifeNet,
      job1NetPaycheck: job1Net,
      job2NetPaycheck: job2Net,
      wifeFirstPayDate,
      job1FirstPayDate,
    });

    const wife = checks.filter((c) => c.source === "WIFE_SALARY");
    const job1 = checks.filter((c) => c.source === "JOB1_SALARY");
    const job2 = checks.filter((c) => c.source === "JOB2_SALARY");
    const total = checks.reduce((s, c) => s + c.amount, 0);
    const isThreePaycheck = wife.length === 3 || job1.length === 3;
    const isCurrent = month === now.getMonth() + 1;

    return { month, wife, job1, job2, total, isThreePaycheck, isCurrent };
  });

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Paycheck Schedule — {year}</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Biweekly from {wifeFirstPayDate} · 3-paycheck months highlighted in blue
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-left">Wife Salary</th>
              <th className="px-4 py-3 text-left">Job 1</th>
              <th className="px-4 py-3 text-left">Job 2</th>
              <th className="px-4 py-3 text-right">Total Expected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthRows.map(({ month, wife, job1, job2, total, isThreePaycheck, isCurrent }) => (
              <tr
                key={month}
                className={
                  isCurrent ? "bg-amber-50" :
                  isThreePaycheck ? "bg-blue-50" : "hover:bg-slate-50"
                }
              >
                <td className="px-4 py-2.5 font-medium text-slate-700">
                  {MONTH_NAMES[month - 1]}
                  {isThreePaycheck && (
                    <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">3 checks</span>
                  )}
                  {isCurrent && (
                    <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">current</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {wife.map((c) => (
                    <div key={c.date.toISOString()} className="text-xs">
                      {c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <span className="text-slate-400 ml-1">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {job1.map((c) => (
                    <div key={c.date.toISOString()} className="text-xs">
                      {c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <span className="text-slate-400 ml-1">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {job2.map((c) => (
                    <div key={c.date.toISOString()} className="text-xs">
                      {c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <span className="text-slate-400 ml-1">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                  {fmt(total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading...</div>}>
      <SettingsPageInner />
    </Suspense>
  );
}
