import { NextRequest, NextResponse } from "next/server";

// TODO: Integrar con Stripe
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, amount } = await request.json();

    if (!appointmentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Crear payment intent con Stripe
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // convertir a centavos
    //   currency: 'clp',
    //   metadata: { appointmentId },
    // });

    // Placeholder response
    return NextResponse.json({
      success: true,
      clientSecret: "placeholder_client_secret",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error creating payment intent";
    console.error("Payment error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
