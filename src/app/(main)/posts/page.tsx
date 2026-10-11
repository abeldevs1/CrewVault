"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Eye, Heart, Tag, User as UserIcon, Calendar } from "lucide-react";
import { Post } from "@/types";
import { RoleBadge } from "@/components/layout/RoleBadge";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) {
          setPosts(data.posts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            Cabin Crew Community Discussions & Tips
          </div>
          <h1 className="text-2xl font-extrabold text-white">Community Posts & Announcements</h1>
          <p className="text-xs text-slate-400">Share study tips, exam advice, training notes, and operational announcements.</p>
        </div>

        <Link
          href="/posts/create"
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-1.5 shrink-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Loading community feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center text-xs text-slate-400 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Posts Yet</h3>
          <p>Be the first to publish a study tip or announcement!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                    {post.author_name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{post.author_name}</span>
                      {post.author_role && <RoleBadge role={post.author_role} size="sm" />}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {post.tags?.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] border border-slate-800">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <h2 className="text-base font-bold text-white">{post.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {/* Attachments Section */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400">Attached Files & Documents:</div>
                  <div className="flex flex-wrap gap-2">
                    {post.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-sky-400"
                      >
                        <span>📎 {att.file_name}</span>
                        {att.material_id && (
                          <Link
                            href={`/materials/${att.material_id}`}
                            className="text-[10px] text-indigo-400 underline hover:text-indigo-300"
                          >
                            Open in Vault
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
