"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Post = {
  id: number;
  title: string;
  slug: string;
  status: string;
  created_at?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null,
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchPosts = async () => {
      try {
        const response = await api.get("/posts/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          setPosts(response.data.data || []);
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        console.error("Failed to load dashboard posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [router]);

  const handleDelete = async (postId: number) => {
    if (
      !window.confirm("Hapus artikel ini? Tindakan ini tidak dapat dibatalkan.")
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setDeletingId(postId);
      await api.delete(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId),
      );
    } catch (error: any) {
      window.alert(error?.response?.data?.message || "Artikel gagal dihapus.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-paper p-6 sm:p-8">
        <Card as="div" className="mx-auto max-w-5xl">
          <p className="font-body text-ink/70">Memuat dashboard...</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper p-6 sm:p-8">
      <Card as="div" className="mx-auto max-w-5xl p-5 sm:p-8">
        <div className="mb-7 flex flex-col gap-4 border-b-3 border-ink pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
              Blog//Lab workspace
            </p>
            <h1 className="mt-2 font-display text-4xl font-black text-ink">
              Dashboard
            </h1>
            <p className="mt-2 font-body text-ink/70">
              Selamat datang{user?.name ? `, ${user.name}` : ""}.
            </p>
          </div>

          <Link
            href="/dashboard/editor"
            className="inline-flex min-h-11 items-center justify-center border-3 border-ink bg-butter px-5 py-2.5 font-display text-sm font-bold text-ink shadow-brutal transition-[transform,box-shadow,background-color] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-coral hover:shadow-brutal-sm"
          >
            + Tambah Artikel
          </Link>
        </div>

        <div className="overflow-x-auto border-3 border-ink">
          <table className="min-w-full text-left font-body text-sm text-ink">
            <thead className="border-b-3 border-ink bg-mint text-ink">
              <tr>
                <th className="px-4 py-3 font-display font-bold">Judul</th>
                <th className="px-4 py-3 font-display font-bold">Status</th>
                <th className="px-4 py-3 font-display font-bold">Dibuat</th>
                <th className="px-4 py-3 font-display font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink/60">
                    Belum ada artikel yang Anda buat.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b-2 border-ink last:border-b-0"
                  >
                    <td className="px-4 py-4 font-display font-bold text-ink">
                      {post.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block border-2 border-ink bg-butter px-2 py-1 text-xs font-bold text-ink">
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            router.push(`/dashboard/editor?edit=${post.id}`)
                          }
                          className="min-h-9 px-3 py-1.5 text-xs"
                        >
                          Edit
                        </Button>
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-display text-xs font-bold underline decoration-2 underline-offset-4 hover:bg-mint"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="min-h-9 px-3 py-1.5 text-xs"
                        >
                          {deletingId === post.id ? "Menghapus..." : "Hapus"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
