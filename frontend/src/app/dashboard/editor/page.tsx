"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

type Category = { id: number; name: string; slug: string };
type Tag = { id: number; name: string; slug: string };
type PostDraft = {
  title: string;
  category_id: string;
  content: string;
  featured_image: string;
  tags: string[];
  status: "draft" | "published";
};

const emptyDraft: PostDraft = {
  title: "",
  category_id: "",
  content: "",
  featured_image: "",
  tags: [],
  status: "draft",
};

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [categoryRes, tagRes] = await Promise.all([
          api.get("/categories"),
          api.get("/tags"),
        ]);

        setCategories(categoryRes.data?.data || []);
        setTags(tagRes.data?.data || []);

        if (editId) {
          const postRes = await api.get(`/posts/${editId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const post = postRes.data?.data;
          if (post) {
            setDraft({
              title: post.title || "",
              category_id: post.category_id ? String(post.category_id) : "",
              content: post.content || "",
              featured_image: post.featured_image || "",
              tags: (post.tags || []).map((tag: any) => String(tag.id)),
              status: post.status || "draft",
            });
          }
        }
      } catch (loadError: any) {
        console.error(loadError);
      } finally {
        setIsReady(true);
      }
    };

    loadData();
  }, [editId, router]);

  const selectedTagOptions = useMemo(
    () => tags.filter((tag) => draft.tags.includes(String(tag.id))),
    [draft.tags, tags],
  );

  const handleFieldChange = (
    field: keyof PostDraft,
    value: string | string[],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleUploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setIsUploading(true);
      setMessage("");
      const response = await api.post("/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = response.data?.data?.url;
      if (imageUrl) {
        setDraft((current) => ({ ...current, featured_image: imageUrl }));
        setMessage("Gambar berhasil diupload.");
      }
    } catch (uploadError: any) {
      setError([
        uploadError?.response?.data?.message ||
          "Upload gagal. Pastikan file valid.",
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError([]);
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = {
      title: draft.title,
      content: draft.content,
      category_id: draft.category_id ? Number(draft.category_id) : null,
      tags: draft.tags.map((tagId) => Number(tagId)),
      featured_image: draft.featured_image || null,
      status: draft.status,
    };

    try {
      if (editId) {
        await api.put(`/posts/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Artikel berhasil diperbarui.");
      } else {
        await api.post("/posts", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Artikel berhasil dibuat.");
      }

      setTimeout(() => router.push("/dashboard"), 600);
    } catch (submitError: any) {
      const apiErrors = submitError?.response?.data?.errors || [];
      const messageText =
        submitError?.response?.data?.message || "Gagal menyimpan artikel.";
      setError(
        Array.isArray(apiErrors)
          ? apiErrors.map((item: any) => `${item.field}: ${item.message}`)
          : [messageText],
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return <div className="p-8 text-slate-600">Memuat form editor...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {editId ? "Edit Artikel" : "Buat Artikel Baru"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Gunakan editor ini untuk menulis artikel baru atau memperbarui
              postingan Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Kembali ke Dashboard
          </button>
        </div>

        {(message || error.length > 0) && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {message ? (
              <p className="text-sm font-medium text-green-700">{message}</p>
            ) : null}
            {error.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-600">
                {error.map((msg, index) => (
                  <li key={`${msg}-${index}`}>{msg}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Judul Artikel
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Masukkan judul artikel"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Kategori
              </label>
              <select
                value={draft.category_id}
                onChange={(e) =>
                  handleFieldChange("category_id", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={draft.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tags
              </label>
              <select
                multiple
                value={draft.tags}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  );
                  handleFieldChange("tags", selected);
                }}
                className="h-36 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {tags.map((tag) => (
                  <option key={tag.id} value={String(tag.id)}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {selectedTagOptions.length > 0
                  ? `Dipilih: ${selectedTagOptions.map((tag) => tag.name).join(", ")}`
                  : "Belum ada tag yang dipilih."}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Featured Image
              </label>
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUploadImage}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                />

                {isUploading ? (
                  <p className="text-sm text-slate-500">Mengupload gambar...</p>
                ) : null}

                {draft.featured_image ? (
                  <img
                    src={draft.featured_image}
                    alt="Featured preview"
                    className="h-52 w-full rounded-lg object-cover"
                  />
                ) : null}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Konten Artikel
              </label>
              <div className="rounded-xl border border-slate-300 bg-white p-2">
                <textarea
                  value={draft.content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  rows={16}
                  className="min-h-[220px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Tulis konten artikel dalam HTML atau teks biasa..."
                />
                <p className="mt-2 text-xs text-slate-500">
                  Anda dapat menulis HTML sederhana seperti
                  &lt;p&gt;...&lt;/p&gt; agar layout tetap rapi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading
                ? "Menyimpan..."
                : editId
                  ? "Update Artikel"
                  : "Simpan Artikel"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-slate-600">Memuat editor...</div>}
    >
      <EditorPageContent />
    </Suspense>
  );
}
