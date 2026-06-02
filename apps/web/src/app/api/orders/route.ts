import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, ticketTypeId, quantity } = body;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_id", session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get ticket type
    const { data: ticketType, error: ticketError } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("id", ticketTypeId)
      .single();

    if (ticketError || !ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    // Calculate total price
    const totalPrice = ticketType.price * quantity;

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: "usd",
      metadata: {
        eventId,
        ticketTypeId,
        quantity,
        userId: profile.id,
      },
    });

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: profile.id,
        event_id: eventId,
        total_price: totalPrice,
        ticket_count: quantity,
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
        payment_method: "stripe",
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    return NextResponse.json({
      order,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
