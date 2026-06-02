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
    const { group_id } = await request.json();

    if (!group_id) {
      return NextResponse.json({ error: "group_id is required" }, { status: 400 });
    }

    const user_id = data.session.user.id;

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("user_id", user_id)
      .eq("group_id", group_id)
      .single();

    if (existingMember) {
      // Leave group
      const { error: deleteError } = await supabase
        .from("group_members")
        .delete()
        .eq("user_id", user_id)
        .eq("group_id", group_id);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        action: "left",
        group_id,
      });
    } else {
      // Join group
      const { data: newMember, error: insertError } = await supabase
        .from("group_members")
        .insert({
          group_id,
          user_id,
          role: "member",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ action: "joined", member: newMember });
    }
  } catch (error: any) {
    console.error("Error handling group membership:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
