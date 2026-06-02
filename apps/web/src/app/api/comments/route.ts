import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

  try {
    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get("post_id");

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id query parameter is required" },
        { status: 400 }
      );
    }

    const { data: comments, error } = await supabase
      .from("post_comments")
      .select("*, user_id(*)")
      .eq("post_id", post_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { post_id, content } = await request.json();

    if (!post_id || !content) {
      return NextResponse.json(
        { error: "post_id and content are required" },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 1000 characters" },
        { status: 400 }
      );
    }

    const user_id = data.session.user.id;

    const { data: newComment, error: insertError } = await supabase
      .from("post_comments")
      .insert({
        post_id,
        user_id,
        content,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
