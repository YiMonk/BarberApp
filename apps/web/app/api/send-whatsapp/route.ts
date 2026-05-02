import { NextRequest, NextResponse } from "next/server";

// Este es un placeholder. En producción, integrarías con:
// - Twilio
// - WhatsApp Cloud API
// - MessageBird
// - etc.

interface WhatsAppPayload {
  phone: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: WhatsAppPayload = await request.json();

    // Validar teléfono
    if (!payload.phone || !payload.message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
        { status: 400 }
      );
    }

    // En desarrollo, simplemente loguear
    console.log("WhatsApp message:", {
      to: payload.phone,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrar con proveedor real de WhatsApp
    // Ejemplo con Twilio:
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const message = await client.messages.create({
    //   body: payload.message,
    //   from: process.env.TWILIO_WHATSAPP_NUMBER,
    //   to: `whatsapp:${payload.phone}`,
    // });

    return NextResponse.json({
      success: true,
      message: "WhatsApp message queued for sending",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending WhatsApp";
    console.error("WhatsApp send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
