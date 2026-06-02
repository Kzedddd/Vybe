import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
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
    const { follower_id } = await request.json();

    if (!follower_id) {
      return NextResponse.json(
        { error: "follower_id is required" },
        { status: 400 }
      );
    }

    const user_id = data.session.user.id;

    // Prevent self-follow
    if (user_id === follower_id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", user_id)
      .eq("follower_id", follower_id)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", user_id)
        .eq("follower_id", follower_id);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        action: "unfollowed",
        follower_id,
      });
    } else {
      // Follow
      const { data: newFollow, error: insertError } = await supabase
        .from("follows")
        .insert({
          user_id,
          follower_id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ action: "followed", follow: newFollow });
    }
  } catch (error: any) {
    console.error("Error handling follow:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
