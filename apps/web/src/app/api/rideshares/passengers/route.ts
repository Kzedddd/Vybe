import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle set cookie errors
          }
        },
      },
    }
  );

  const { data, error: authError } = await supabase.auth.getSession();
  if (authError || !data.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rideshare_id } = await request.json();

    if (!rideshare_id) {
      return NextResponse.json(
        { error: "rideshare_id is required" },
        { status: 400 }
      );
    }

    const user_id = data.session.user.id;

    // Check if already a passenger
    const { data: existingPassenger } = await supabase
      .from("rideshare_passengers")
      .select("id")
      .eq("user_id", user_id)
      .eq("rideshare_id", rideshare_id)
      .single();

    if (existingPassenger) {
      // Remove passenger
      const { error: deleteError } = await supabase
        .from("rideshare_passengers")
        .delete()
        .eq("user_id", user_id)
        .eq("rideshare_id", rideshare_id);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        action: "removed",
        rideshare_id,
      });
    } else {
      // Check available seats
      const { data: rideshare, error: rideshareError } = await supabase
        .from("rideshares")
        .select("available_seats")
        .eq("id", rideshare_id)
        .single();

      if (rideshareError) throw rideshareError;

      if (rideshare.available_seats <= 0) {
        return NextResponse.json(
          { error: "No seats available for this rideshare" },
          { status: 400 }
        );
      }

      // Add passenger
      const { data: newPassenger, error: insertError } = await supabase
        .from("rideshare_passengers")
        .insert({
          rideshare_id,
          user_id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update available seats
      await supabase
        .from("rideshares")
        .update({
          available_seats: rideshare.available_seats - 1,
        })
        .eq("id", rideshare_id);

      return NextResponse.json({
        action: "joined",
        passenger: newPassenger,
      });
    }
  } catch (error: any) {
    console.error("Error handling rideshare join:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
