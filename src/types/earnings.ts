/**
 * One earnings entry. Money is stored as integer cents in the
 * row's currency to avoid float arithmetic. Display code divides
 * by 100 and formats with the per-row currency.
 */
export type Currency = "NGN" | "KES" | "ZAR" | "GBP" | "USD";

export const SUPPORTED_CURRENCIES: Currency[] = [
  "USD",
  "GBP",
  "NGN",
  "KES",
  "ZAR",
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  NGN: "₦",
  KES: "KSh",
  ZAR: "R",
};

export interface Earning {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id?: string | null;
  amount_cents: number;
  currency: Currency;
  source: string;
  occurred_on: string;
  note: string | null;
  created_at: string;
}

/**
 * Format a cents value in its currency. Examples:
 *   formatAmount(120_000, "USD") -> "$1,200.00"
 *   formatAmount(10_000_000, "NGN") -> "₦100,000.00"
 *
 * Uses Intl.NumberFormat for thousands separators; symbols are
 * sourced from CURRENCY_SYMBOLS so we get consistent presentation
 * across browsers.
 */
export function formatAmount(amountCents: number, currency: Currency): string {
  const major = amountCents / 100;
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = major.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
