import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@barberos-saas.com";

interface EmailPayload {
  to: string;
  subject: string;
  type: string;
  data: Record<string, any>;
}

async function sendWithResend(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }

  return response.json();
}

function generateAppointmentReminderEmail(
  clientName: string,
  providerName: string,
  appointmentTime: string,
  hoursUntil: number
): string {
  const appointmentDate = new Date(appointmentTime);
  const formattedTime = appointmentDate.toLocaleString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Recordatorio de Cita</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Recordatorio: Tu Cita</h1>
          <p>Hola ${clientName},</p>
          <p>Te recordamos que tienes una cita programada con <strong>${providerName}</strong>.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Fecha y hora:</strong><br/>${formattedTime}</p>
            <p><strong>Tiempo restante:</strong> ${hoursUntil} hora(s)</p>
          </div>

          <p>Si necesitas cancelar o reprogramar, hazlo con anticipación para que otros clientes puedan usar ese horario.</p>

          <p style="color: #666;">Saludos,<br/>El equipo de Barberos SaaS</p>
        </div>
      </body>
    </html>
  `;
}

function generateAppointmentConfirmationEmail(
  clientName: string,
  providerName: string,
  appointmentTime: string
): string {
  const appointmentDate = new Date(appointmentTime);
  const formattedTime = appointmentDate.toLocaleString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Cita Confirmada</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">✓ Cita Confirmada</h1>
          <p>Hola ${clientName},</p>
          <p>Tu cita con <strong>${providerName}</strong> ha sido confirmada.</p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <p><strong>Fecha y hora:</strong><br/>${formattedTime}</p>
          </div>

          <p>Te enviaremos recordatorios antes de tu cita. Si necesitas cancelar, hazlo desde la app o contacta directamente.</p>

          <p style="color: #666;">Saludos,<br/>El equipo de Barberos SaaS</p>
        </div>
      </body>
    </html>
  `;
}

function generateAppointmentCancellationEmail(
  clientName: string,
  providerName: string,
  reason?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Cita Cancelada</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Cita Cancelada</h1>
          <p>Hola ${clientName},</p>
          <p>Tu cita con <strong>${providerName}</strong> ha sido cancelada.</p>

          ${
            reason
              ? `<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Motivo:</strong><br/>${reason}</p>
                </div>`
              : ""
          }

          <p>Si deseas agendar otra cita, puedes hacerlo desde nuestra plataforma o contactando directamente.</p>

          <p style="color: #666;">Saludos,<br/>El equipo de Barberos SaaS</p>
        </div>
      </body>
    </html>
  `;
}

function generateReviewRequestEmail(clientName: string, providerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Cuéntanos tu Experiencia</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">¿Qué te pareció tu cita?</h1>
          <p>Hola ${clientName},</p>
          <p>Nos gustaría conocer tu experiencia con <strong>${providerName}</strong>.</p>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Tu reseña nos ayuda a mejorar nuestro servicio y a otros clientes a tomar mejores decisiones.</p>
            <p style="margin-top: 15px;">
              <a href="https://barberos-saas.com/reviews" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Dejar Reseña
              </a>
            </p>
          </div>

          <p>¡Gracias por tu confianza!</p>

          <p style="color: #666;">Saludos,<br/>El equipo de Barberos SaaS</p>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json();

    let html: string;

    switch (payload.type) {
      case "appointment_reminder":
        html = generateAppointmentReminderEmail(
          payload.data.clientName,
          payload.data.providerName,
          payload.data.appointmentTime,
          payload.data.hoursUntil
        );
        break;
      case "appointment_confirmed":
        html = generateAppointmentConfirmationEmail(
          payload.data.clientName,
          payload.data.providerName,
          payload.data.appointmentTime
        );
        break;
      case "appointment_cancelled":
        html = generateAppointmentCancellationEmail(
          payload.data.clientName,
          payload.data.providerName,
          payload.data.reason
        );
        break;
      case "review_request":
        html = generateReviewRequestEmail(payload.data.clientName, payload.data.providerName);
        break;
      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    await sendWithResend(payload.to, payload.subject, html);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending email";
    console.error("Email send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
