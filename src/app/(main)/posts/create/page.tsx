"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, ShieldAlert, Paperclip, Eye, UserX } from "lucide-react";
import DragDropUploader from "@/components/DragDropUploader";

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("study-tip, cabin-safety");
  const [visibility, setVisibility] = useState("public");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError("Title and content are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", tagInput);
      formData.append("visibility", visibility);
      formData.append("is_anonymous", isAnonymous ? "true" : "false");
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish post");

      router.push("/posts");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-1">
        <h1 className="text-2xl font-extrabold text-white">Create Community Post</h1>
        <p className="text-xs text-slate-400">Share aviation study tips, notes, questions, images or document attachments.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Post Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Memory triggers for Boeing 787 Emergency Door Procedures"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Content & Notes</label>
          <textarea
            required
            rows={6}
            placeholder="Write your study advice, operational notes, or exam experiences here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* File & Image Attachment with Drag & Drop */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
            Attach Image or Study Document (Optional)
          </label>
          <DragDropUploader
            selectedFile={file}
            onFileSelect={(f) => setFile(f)}
            onClearFile={() => setFile(null)}
            label="Drag and drop image or document attachment here"
            sublabel="PNG, JPEG, PDF, DOCX up to 25 MB"
            maxSizeMb={25}
          />
        </div>

        {/* Visibility & Privacy Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              Audience Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="public">Public (All Members)</option>
              <option value="members">Signed-in Members Only</option>
              <option value="group">Group Study Feed</option>
              <option value="private">Private (Only Me)</option>
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-900"
              />
              <UserX className="w-4 h-4 text-amber-400" />
              <span>Post Anonymously (Hide My Name)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. b787, emergency, inflight-service"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Community Post"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
