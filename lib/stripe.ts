import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

// Keep named export for backwards compat — alias to lazy getter
export const stripe = { get: getStripe };

export const PLANS = {
  pro: {
    name: "Pro",
    price: "$8 /mo",
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: ["10 active alerts", "60s polling", "Email + SMS"],
    maxAlerts: 10,
    minInterval: 60,
  },
  ranger: {
    name: "Ranger",
    price: "$24 /mo",
    priceId: process.env.STRIPE_RANGER_PRICE_ID!,
    features: ["Unlimited alerts", "30s polling", "Priority + SMS"],
    maxAlerts: Infinity,
    minInterval: 30,
  },
} as const;

export type PlanKey = "free" | "pro" | "ranger";

export const PLAN_LIMITS: Record<PlanKey, { maxAlerts: number; minInterval: number }> = {
  free: { maxAlerts: 2, minInterval: 300 },
  pro: { maxAlerts: 10, minInterval: 60 },
  ranger: { maxAlerts: Infinity, minInterval: 30 },
};
