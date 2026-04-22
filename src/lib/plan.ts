export const FREE_DAILY_LIMIT = 3;

export type Plan = "free" | "pro";

export function canAudit(
  plan: Plan,
  usageCount: number
): { allowed: boolean; remaining: number } {
  if (plan === "pro") return { allowed: true, remaining: Infinity };
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usageCount);
  return { allowed: remaining > 0, remaining };
}
