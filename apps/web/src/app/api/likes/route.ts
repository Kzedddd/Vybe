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
    const { post_id } = await request.json();

    if (!post_id) {
      return NextResponse.json({ error: "post_id is required" }, { status: 400 });
    }

    const user_id = data.session.user.id;

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", user_id)
      .eq("post_id", post_id)
      .single();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("post_likes")
        .delete()
        .eq("user_id", user_id)
        .eq("post_id", post_id);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        action: "unliked",
        post_id,
      });
    } else {
      // Like
      const { data: newLike, error: insertError } = await supabase
        .from("post_likes")
        .insert({
          user_id,
          post_id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ action: "liked", like: newLike });
    }
  } catch (error: any) {
    console.error("Error handling like:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
