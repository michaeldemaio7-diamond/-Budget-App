import { useQuery } from "@tanstack/react-query";
import type {
  Account, Signal, Opportunity, UtilizationRow, SupportCase,
  SlackChannel, Timeline, Poc
} from "./types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export const useAccounts = () =>
  useQuery({ queryKey: ["accounts"], queryFn: () => get<Account[]>("/api/accounts") });

export const useSignals = () =>
  useQuery({ queryKey: ["signals"], queryFn: () => get<Signal[]>("/api/signals") });

export const useOpportunities = () =>
  useQuery({ queryKey: ["opportunities"], queryFn: () => get<Opportunity[]>("/api/opportunities") });

export const useUtilization = () =>
  useQuery({ queryKey: ["utilization"], queryFn: () => get<UtilizationRow[]>("/api/utilization") });

export const useCases = () =>
  useQuery({ queryKey: ["cases"], queryFn: () => get<SupportCase[]>("/api/cases") });

export const usePocs = () =>
  useQuery({ queryKey: ["pocs"], queryFn: () => get<Poc[]>("/api/pocs") });

export const useSlackChannel = (channelId: string | null) =>
  useQuery({
    queryKey: ["slack", channelId],
    queryFn: () => get<SlackChannel | null>(`/api/slack/${channelId}`),
    enabled: !!channelId
  });

export const useTimeline = (accountId: string | null) =>
  useQuery({
    queryKey: ["timeline", accountId],
    queryFn: () => get<Timeline>(`/api/timeline/${accountId}`),
    enabled: !!accountId
  });

export async function askAgent(question: string, accountId: string | null): Promise<string> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, accountId })
  });
  const data = await res.json();
  return data.answer as string;
}

export const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};
