import {
  formatAmount,
  type Currency,
  type Earning,
} from "@/types/earnings";

/**
 * Simple monthly chart, one row per (currency, month) cell. No
 * external chart lib — just CSS-bar widths sized relative to the
 * largest month for that currency. Honest visualisation: no FX
 * conversion, no implied total in a single number.
 */
export function EarningsChart({ earnings }: { earnings: Earning[] }) {
  if (earnings.length === 0) return null;

  // Bucket by currency → YYYY-MM → cents.
  const byCurrency = new Map<Currency, Map<string, number>>();
  for (const e of earnings) {
    const ym = e.occurred_on.slice(0, 7);
    const inner =
      byCurrency.get(e.currency) ??
      (() => {
        const fresh = new Map<string, number>();
        byCurrency.set(e.currency, fresh);
        return fresh;
      })();
    inner.set(ym, (inner.get(ym) ?? 0) + e.amount_cents);
  }

  const blocks = Array.from(byCurrency.entries()).map(([currency, months]) => {
    const sorted = Array.from(months.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const max = Math.max(...sorted.map(([, c]) => c));
    return { currency, sorted, max };
  });

  return (
    <section
      data-earnings-chart="true"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-black dark:text-white">
        By month
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Currencies are not converted. Each row is its own scale.
      </p>

      <div className="mt-4 space-y-5">
        {blocks.map(({ currency, sorted, max }) => (
          <div
            key={currency}
            data-earnings-chart-currency={currency}
            className="space-y-1"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              {currency}
            </p>
            <ul className="space-y-1">
              {sorted.map(([ym, cents]) => {
                const pct = max === 0 ? 0 : (cents / max) * 100;
                return (
                  <li
                    key={ym}
                    className="flex items-center gap-3"
                    data-earnings-chart-month={ym}
                  >
                    <span className="w-20 shrink-0 text-xs text-zinc-600 dark:text-zinc-400">
                      {ym}
                    </span>
                    <div
                      className="relative h-5 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded bg-emerald-500 dark:bg-emerald-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs font-medium text-black dark:text-white">
                      {formatAmount(cents, currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
