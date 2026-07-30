export const BUG_REPORT_CATEGORIES = ['bug', 'crash', 'idea', 'other'] as const;

export type BugReportCategory = (typeof BUG_REPORT_CATEGORIES)[number];

const BUG_REPORT_CATEGORY_SET = new Set<string>(BUG_REPORT_CATEGORIES);

/** Keep the public Worker endpoint aligned with the finite set rendered by the UI. */
export function isBugReportCategory(value: unknown): value is BugReportCategory {
  return typeof value === 'string' && BUG_REPORT_CATEGORY_SET.has(value);
}

/** One payload remains compatible with Discord and Slack. Discord's explicit
 * mention policy prevents user-controlled reports from pinging users or roles. */
export function bugReportWebhookPayload(text: string): {
  content: string;
  text: string;
  allowed_mentions: { parse: [] };
} {
  return {
    content: text.slice(0, 1900),
    text: text.slice(0, 3500),
    allowed_mentions: { parse: [] },
  };
}
