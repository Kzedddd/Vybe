"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "@/utils/format";

export default function FeedPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, user_id(*)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    if (!newPostContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: profile?.id,
          content: newPostContent,
        })
        .select("*, user_id(*)")
        .single();

      if (error) throw error;

      setPosts([data, ...posts]);
      setNewPostContent("");
      toast.success("Post created!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (postId: string, liked: boolean) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    try {
      if (liked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", profile?.id);
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: profile?.id,
        });
      }

      // Update posts
      fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Create Post Form */}
        {user && (
          <div className="card p-6 mb-8">
            <div className="flex gap-4 mb-4">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}`}
                alt={profile?.username}
                className="w-10 h-10 rounded-full"
              />
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreatePost}
                disabled={posting || !newPostContent.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-600">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="card p-6">
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={
                      post.user_id?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${post.user_id?.username}`
                    }
                    alt={post.user_id?.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{post.user_id?.username}</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(post.created_at)}</p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full rounded-lg mb-4 max-h-400"
                  />
                )}

                {/* Engagement Stats */}
                <div className="flex gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                  <span>{post.likes_count} likes</span>
                  <span>{post.comments_count} comments</span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-around">
                  <button
                    onClick={() => handleLikePost(post.id, post.liked)}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition flex-1 justify-center py-2"
                  >
                    <Heart size={18} className={post.liked ? "fill-red-600 text-red-600" : ""} />
                    Like
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition flex-1 justify-center py-2">
                    <MessageCircle size={18} />
                    Comment
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition flex-1 justify-center py-2">
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
