import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { supabase } from "@vybe/shared";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Update order status to completed
        await supabase
          .from("orders")
          .update({ status: "completed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        // Update order status to failed
        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", failedIntent.id);
        break;

      case "charge.refunded":
        const refundedCharge = event.data.object;
        // Update order status to refunded
        await supabase
          .from("orders")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", refundedCharge.payment_intent);
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500 }
    );
  }
}
