import { NextRequest, NextResponse } from "next/server";

// TODO: Integrar con Twilio
// import twilio from 'twilio';
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

interface SMSPayload {
  phone: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: SMSPayload = await request.json();

    if (!payload.phone || !payload.message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
        { status: 400 }
      );
    }

    // Validar formato de teléfono
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(payload.phone.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // TODO: Enviar SMS con Twilio
    // const message = await client.messages.create({
    //   body: payload.message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: payload.phone,
    // });

    console.log("SMS sent:", {
      to: payload.phone,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending SMS";
    console.error("SMS send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
