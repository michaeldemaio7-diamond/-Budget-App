"use client";

import { useState, useEffect } from "react";
import { Settings } from "@/types";
import CurrencyInput from "@/components/ui/CurrencyInput";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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
          alertPhone: settings.alertPhone,
          taxRate: typeof settings.taxRate === "string" ? parseFloat(settings.taxRate) : settings.taxRate,
          wifeSalaryGross: typeof settings.wifeSalaryGross === "string" ? parseFloat(settings.wifeSalaryGross) : settings.wifeSalaryGross,
          job1SalaryGross: typeof settings.job1SalaryGross === "string" ? parseFloat(settings.job1SalaryGross) : settings.job1SalaryGross,
          job2SalaryGross: typeof settings.job2SalaryGross === "string" ? parseFloat(settings.job2SalaryGross) : settings.job2SalaryGross,
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

  const handleSyncGmail = async (account: 1 | 2) => {
    const res = await fetch("/api/gmail/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account }),
    });
    const data = await res.json();
    alert(data.message || data.error || "Sync attempted");
  };

  const handleCheckAlerts = async () => {
    const res = await fetch("/api/alerts/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    alert(`Alerts checked: ${data.alertsTriggered} triggered out of ${data.alertsChecked} rows`);
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;
  if (!settings) return null;

  const taxRateNum = typeof settings.taxRate === "string" ? parseFloat(settings.taxRate) : settings.taxRate;
  const wifeGross = typeof settings.wifeSalaryGross === "string" ? parseFloat(settings.wifeSalaryGross) : settings.wifeSalaryGross;
  const job1Gross = typeof settings.job1SalaryGross === "string" ? parseFloat(settings.job1SalaryGross) : settings.job1SalaryGross;
  const job2Gross = typeof settings.job2SalaryGross === "string" ? parseFloat(settings.job2SalaryGross) : settings.job2SalaryGross;

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

      {/* Income Configuration */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Income Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure salary amounts and tax rates used for paycheck calculations</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (effective)</label>
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
                <span className="text-sm text-slate-500">({(taxRateNum * 100).toFixed(0)}%)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Applied to all salary calculations</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wife Annual Salary</label>
                <CurrencyInput value={wifeGross} onChange={(v) => update("wifeSalaryGross", v)} className="w-full" />
                <p className="text-xs text-slate-400 mt-1">Biweekly, 26 paychecks/year</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Pay Date</label>
                <input
                  type="date"
                  value={settings.wifeFirstPayDate}
                  onChange={(e) => update("wifeFirstPayDate", e.target.value)}
                  className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full"
                />
              </div>
              <div className="text-sm text-slate-500 pb-1">
                ≈ {formatNetPaycheck(wifeGross, 26, taxRateNum)}/check net
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job 1 Annual Salary</label>
                <CurrencyInput value={job1Gross} onChange={(v) => update("job1SalaryGross", v)} className="w-full" />
                <p className="text-xs text-slate-400 mt-1">Biweekly, 26 paychecks/year</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Pay Date</label>
                <input
                  type="date"
                  value={settings.job1FirstPayDate}
                  onChange={(e) => update("job1FirstPayDate", e.target.value)}
                  className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full"
                />
              </div>
              <div className="text-sm text-slate-500 pb-1">
                ≈ {formatNetPaycheck(job1Gross, 26, taxRateNum)}/check net
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job 2 Annual Salary</label>
                <CurrencyInput value={job2Gross} onChange={(v) => update("job2SalaryGross", v)} className="w-full" />
                <p className="text-xs text-slate-400 mt-1">Bi-monthly, 24 paychecks/year (15th & last)</p>
              </div>
              <div className="sm:col-span-2 text-sm text-slate-500 pb-1">
                ≈ {formatNetPaycheck(job2Gross, 24, taxRateNum)}/check net
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Notification Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Get alerts when budget categories are near their limit</p>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alert Phone Number (SMS)</label>
            <input
              type="tel"
              value={settings.alertPhone || ""}
              onChange={(e) => update("alertPhone", e.target.value)}
              placeholder="+15555555555"
              className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full max-w-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Requires Twilio configuration (see .env.example)</p>
          </div>
          <div>
            <button
              onClick={handleCheckAlerts}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              Check & Send Alerts Now
            </button>
          </div>
        </div>
      </section>

      {/* Gmail Integration */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Gmail Integration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Connect Gmail to auto-import Chase credit card transactions</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Setup Required:</strong> Gmail integration requires Google OAuth credentials.
            See <code className="bg-amber-100 px-1 rounded">lib/gmail.ts</code> and <code className="bg-amber-100 px-1 rounded">.env.example</code> for setup instructions.
            You need: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in your .env file.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gmail Account 1</label>
              <input
                type="email"
                value={settings.gmailAccount1 || ""}
                onChange={(e) => update("gmailAccount1", e.target.value)}
                placeholder="account1@gmail.com"
                className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full"
              />
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${settings.gmailAccount1 ? "bg-green-400" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-500">{settings.gmailAccount1 ? "Configured (OAuth pending)" : "Not connected"}</span>
                <button
                  onClick={() => handleSyncGmail(1)}
                  className="text-xs text-blue-600 hover:text-blue-700 ml-auto"
                  disabled={!settings.gmailAccount1}
                >
                  Sync Now
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gmail Account 2</label>
              <input
                type="email"
                value={settings.gmailAccount2 || ""}
                onChange={(e) => update("gmailAccount2", e.target.value)}
                placeholder="account2@gmail.com"
                className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full"
              />
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${settings.gmailAccount2 ? "bg-green-400" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-500">{settings.gmailAccount2 ? "Configured (OAuth pending)" : "Not connected"}</span>
                <button
                  onClick={() => handleSyncGmail(2)}
                  className="text-xs text-blue-600 hover:text-blue-700 ml-auto"
                  disabled={!settings.gmailAccount2}
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">How Chase email parsing works</h3>
            <p className="text-xs text-slate-500 mb-2">
              The app parses Chase transaction notification emails with subjects like:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li><code className="bg-slate-100 px-1 rounded">"Your $127.43 transaction at Whole Foods Market"</code></li>
              <li><code className="bg-slate-100 px-1 rounded">"A new transaction of $42.50 was charged to your Chase card"</code></li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">
              Synced transactions are stored with their Gmail message ID to prevent duplicates.
              Unassigned transactions can be categorized from the Transactions page.
            </p>
          </div>
        </div>
      </section>

      {/* Budget Template */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Budget Template</h2>
          <p className="text-xs text-slate-500 mt-0.5">Create a new month by copying budget amounts from a previous month</p>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-3">
            When you navigate to a new month on the Dashboard, the app automatically creates it
            by copying budget amounts from the previous month. This ensures your recurring expenses
            are already set up each month.
          </p>
          <p className="text-sm text-slate-500">
            To manually create a month, navigate to it using the month selector on the Dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}

function formatNetPaycheck(gross: number, paychecksPerYear: number, taxRate: number): string {
  const net = (gross / paychecksPerYear) * (1 - taxRate);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(net);
}
