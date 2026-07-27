/** Pure wall-clock predicate shared by the lifecycle handler and regression tests. */
export function backgroundLockExpired(
  hiddenAt: number | null,
  now: number,
  graceMs: number,
): boolean {
  return (
    hiddenAt !== null &&
    Number.isFinite(hiddenAt) &&
    Number.isFinite(now) &&
    Number.isFinite(graceMs) &&
    graceMs >= 0 &&
    now >= hiddenAt &&
    now - hiddenAt >= graceMs
  );
}
