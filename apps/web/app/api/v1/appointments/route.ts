import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security";

/**
 * GET /api/v1/appointments
 * Lista todas las citas del proveedor
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limiting: 100 requests per 15 minutes
    if (!checkRateLimit(clientIP, 100)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    // Validar API key
    const { data: apiToken, error: tokenError } = await supabase
      .from("api_tokens")
      .select("provider_account_id")
      .eq("token", apiKey)
      .eq("active", true)
      .single();

    if (tokenError || !apiToken) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Obtener query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Obtener citas
    let query = supabase
      .from("appointments")
      .select("*", { count: "exact" })
      .eq("provider_account_id", apiToken.provider_account_id);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order("scheduled_start", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error fetching appointments";
    console.error("API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/v1/appointments
 * Crear nueva cita
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const { data: apiToken, error: tokenError } = await supabase
      .from("api_tokens")
      .select("provider_account_id")
      .eq("token", apiKey)
      .eq("active", true)
      .single();

    if (tokenError || !apiToken) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const payload = await request.json();

    // Validar payload
    if (!payload.client_name || !payload.scheduled_start || !payload.scheduled_end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        provider_account_id: apiToken.provider_account_id,
        client_provider_link_id: payload.client_link_id,
        status: "draft",
        scheduled_start: payload.scheduled_start,
        scheduled_end: payload.scheduled_end,
        notes: payload.notes,
        is_walk_in: payload.is_walk_in || false,
        created_by_role: "provider",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error creating appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
