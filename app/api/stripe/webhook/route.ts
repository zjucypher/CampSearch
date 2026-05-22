import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type Stripe from "stripe";

const serviceClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 });
  }

  const db = serviceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan as "pro" | "ranger" | undefined;
    if (userId && plan) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from("profiles") as any).update({ plan }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.user_id;
    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from("profiles") as any).update({ plan: "free" }).eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
