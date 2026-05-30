/** Plan limits — safe to import from client components (no Stripe dependency). */

export type PlanKey = "free" | "pro" | "ranger";

export const PLAN_LIMITS: Record<PlanKey, { maxAlerts: number; minInterval: number }> = {
  // DEBUG: free temporarily set to 5 alerts / 30s cadence (restore to 2 / 300)
  free:   { maxAlerts: 5,        minInterval: 30  },
  pro:    { maxAlerts: 10,       minInterval: 60  },
  ranger: { maxAlerts: Infinity, minInterval: 30  },
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  free:   "Free",
  pro:    "Pro",
  ranger: "Ranger",
};

/** Returns the plan key required to unlock a given polling interval. */
export function requiredPlanForInterval(interval: number): PlanKey | null {
  if (interval >= 300) return null;        // free can do 5m
  if (interval >= 60)  return "pro";       // pro needed for 60s
  return "ranger";                          // ranger needed for 30s
}
