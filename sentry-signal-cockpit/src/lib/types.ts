export type SignalCategory =
  | "Upsell"
  | "EngagementGap"
  | "AccountIssue"
  | "Community"
  | "Funding"
  | "AEOIntent";

export type SignalSource =
  | "Product-BigQuery"
  | "Slack"
  | "Discord"
  | "SupportCase"
  | "Marketing"
  | "ZoomInfo"
  | "AEOSurvey";

export interface Account {
  id: string;
  name: string;
  slug: string;
  arr: number;
  planTier: string;
  csmOwner: string;
  aeOwner: string;
  slackChannelId: string | null;
  discordHandle: string | null;
  industry: string;
  employeeBand: string;
  joinedAt: string;
}

export interface Signal {
  id: string;
  accountId: string;
  category: SignalCategory;
  source: SignalSource;
  headline: string;
  detail: string;
  suggestedAction: string;
  priority: number;
  selfReportedOnly: boolean;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  status: "On track" | "Needs push" | "At risk";
  nextStep: string;
}

export interface UtilizationRow {
  accountId: string;
  module: "Errors" | "Transactions" | "Spans" | "SessionReplay" | "Crons";
  quotaUsagePct: number;
  trend30: number;
  trend60: number;
  trend90: number;
  seatsActivePct: number;
}

export interface SupportCase {
  id: string;
  accountId: string;
  subject: string;
  priority: "P1" | "P2" | "P3" | "P4";
  daysPastSla: number;
  escalationOwner: string;
  status: string;
}

export interface SlackChannel {
  channelId: string;
  accountId: string;
  messages: { author: string; timestamp: string; text: string }[];
}

export interface TimelineEvent {
  type: string;
  tag: string;
  timestamp: string;
  description: string;
  actor: string;
}

export interface Timeline {
  accountId: string;
  events: TimelineEvent[];
}

export interface Poc {
  id: string;
  accountId: string;
  opportunityId: string;
  stage: string;
  meddpicNotes: string;
  notionDocUrl: string;
}

export type DrawerTarget =
  | { kind: "signal"; signal: Signal }
  | { kind: "opportunity"; opportunity: Opportunity }
  | { kind: "case"; supportCase: SupportCase }
  | { kind: "account"; accountId: string };
