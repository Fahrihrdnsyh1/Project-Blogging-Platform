"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";

type CommentNode = {
  id: number;
  content: string;
  created_at: string;
  user_name?: string;
  children?: CommentNode[];
};

type CommentSectionProps = {
  postId: number;
  initialComments: CommentNode[];
};

function countComments(comments: CommentNode[]): number {
  return comments.reduce(
    (total, comment) => total + 1 + countComments(comment.children || []),
    0,
  );
}

export default function CommentSection({
  postId,
  initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("token")));
  }, []);

  const submitComment = async (
    event: FormEvent,
    parentId: number | null = null,
  ) => {
    event.preventDefault();
    const value = parentId ? replyContent : content;
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Silakan login untuk menambahkan komentar.");
      return;
    }

    if (!value.trim()) return;

    try {
      setLoading(true);
      setError("");
      const response = await api.post(
        "/comments",
        { post_id: postId, content: value, parent_id: parentId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Komentar gagal dikirim.");
      }

      const created = response.data.data;
      const savedComment: CommentNode = {
        ...created,
        user_name: JSON.parse(localStorage.getItem("user") || "{}").name,
        children: [],
      };

      if (parentId) {
        const addReply = (items: CommentNode[]): CommentNode[] =>
          items.map((item) =>
            item.id === parentId
              ? { ...item, children: [...(item.children || []), savedComment] }
              : { ...item, children: addReply(item.children || []) },
          );
        setComments(addReply(comments));
        setReplyContent("");
        setReplyTo(null);
      } else {
        setComments([...comments, savedComment]);
        setContent("");
      }
      setMessage("Komentar berhasil ditambahkan.");
    } catch (submitError: any) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Komentar gagal dikirim.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderComments = (items: CommentNode[], depth = 0): React.ReactNode =>
    items.map((comment) => (
      <div
        key={comment.id}
        className="space-y-3"
        style={{ marginLeft: depth * 18 }}
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-slate-800">
              {comment.user_name || "User"}
            </span>
            <span className="text-slate-500">
              {new Date(comment.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-slate-700">
            {comment.content}
          </p>
          <button
            type="button"
            onClick={() =>
              setReplyTo(replyTo === comment.id ? null : comment.id)
            }
            className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Balas
          </button>
          {replyTo === comment.id ? (
            <form
              onSubmit={(event) => submitComment(event, comment.id)}
              className="mt-3 space-y-2"
            >
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="Tulis balasan..."
                className="min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Kirim balasan
              </button>
            </form>
          ) : null}
        </div>
        {comment.children?.length
          ? renderComments(comment.children, depth + 1)
          : null}
      </div>
    ));

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-bold text-slate-900">
        Komentar ({countComments(comments)})
      </h2>

      {message ? (
        <p className="mb-4 text-sm text-green-700">{message}</p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={submitComment} className="mb-6 space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Tulis komentar..."
          className="min-h-24 w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Kirim komentar
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-slate-500">Belum ada komentar untuk artikel ini.</p>
      ) : (
        <div className="space-y-4">{renderComments(comments)}</div>
      )}

      {!isAuthenticated ? (
        <p className="mt-4 text-sm text-slate-500">
          Belum login?{" "}
          <Link href="/login" className="font-medium text-blue-700">
            Login untuk berkomentar.
          </Link>
        </p>
      ) : null}
    </section>
  );
}
