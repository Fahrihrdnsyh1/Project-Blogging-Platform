"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";

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
        style={{ marginLeft: Math.min(depth * 12, 48) }}
      >
        <div className="border-2 border-ink bg-sky p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-display font-bold text-ink">
              {comment.user_name || "User"}
            </span>
            <span className="font-body text-xs text-ink/60">
              {new Date(comment.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="whitespace-pre-wrap font-body text-ink/80">
            {comment.content}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setReplyTo(replyTo === comment.id ? null : comment.id)
            }
            className="mt-3 min-h-9 px-3 py-1.5 text-xs"
          >
            Balas
          </Button>
          {replyTo === comment.id ? (
            <form
              onSubmit={(event) => submitComment(event, comment.id)}
              className="mt-3 space-y-2"
            >
              <Textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="Tulis balasan..."
                className="min-h-20 text-sm"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="min-h-9 px-3 py-1.5 text-xs"
              >
                Kirim balasan
              </Button>
            </form>
          ) : null}
        </div>
        {comment.children?.length
          ? renderComments(comment.children, depth + 1)
          : null}
      </div>
    ));

  return (
    <Card as="section" className="mt-10 p-5 sm:p-6">
      <h2 className="mb-5 font-display text-2xl font-black text-ink">
        Komentar ({countComments(comments)})
      </h2>

      {message ? (
        <p className="mb-4 border-2 border-ink bg-mint p-3 font-body text-sm text-ink">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 border-2 border-ink bg-coral p-3 font-body text-sm text-ink">
          {error}
        </p>
      ) : null}

      <form onSubmit={submitComment} className="mb-6 space-y-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Tulis komentar..."
          className="min-h-24"
          required
        />
        <Button type="submit" disabled={loading}>
          Kirim komentar
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="font-body text-ink/60">
          Belum ada komentar untuk artikel ini.
        </p>
      ) : (
        <div className="space-y-4">{renderComments(comments)}</div>
      )}

      {!isAuthenticated ? (
        <p className="mt-4 font-body text-sm text-ink/60">
          Belum login?{" "}
          <Link
            href="/login"
            className="font-display font-bold text-ink underline decoration-2 underline-offset-4 hover:bg-butter"
          >
            Login untuk berkomentar.
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
