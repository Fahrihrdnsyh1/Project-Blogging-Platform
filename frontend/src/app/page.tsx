import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type PostTag = {
  id: number;
  name: string;
  slug: string;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  featured_image?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  created_at?: string;
  tags?: PostTag[];
};

type PostsApiResponse = {
  success: boolean;
  data: Post[];
  pagination: {
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

const API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

async function getPublishedPosts(page: number) {
  const res = await fetch(`${API_URL}/posts?page=${page}&limit=6`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  return (await res.json()) as PostsApiResponse;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const currentPage = Number(params.page) || 1;
  const response = await getPublishedPosts(currentPage);
  const posts = response.data ?? [];
  const pagination = response.pagination ?? {
    currentPage,
    limit: 6,
    totalItems: 0,
    totalPages: 1,
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Badge tone="coral">Blog platform</Badge>
          <h1 className="mt-5 font-display text-5xl font-black tracking-tight text-ink">
            Artikel terbaru
          </h1>
        </header>

        {posts.length === 0 ? (
          <div className="border-3 border-dashed border-ink bg-mint p-8 font-body text-ink shadow-brutal">
            Belum ada artikel yang dipublikasikan.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <Card
                as="article"
                key={post.id}
                className="overflow-hidden p-0 transition-transform duration-150 hover:-translate-y-1"
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="h-52 w-full border-b-3 border-ink object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center border-b-3 border-ink bg-sky font-display text-sm font-bold text-ink">
                    No Image
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.category_name ? (
                      <Badge tone="butter">{post.category_name}</Badge>
                    ) : null}
                    {post.tags && post.tags.length > 0
                      ? post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} tone="mint">
                            #{tag.name}
                          </Badge>
                        ))
                      : null}
                  </div>

                  <div>
                    <h2 className="font-display text-2xl font-black leading-tight text-ink hover:underline">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="mt-3 font-display text-xs font-bold uppercase tracking-wide text-ink/60">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "Baru dipublikasikan"}
                    </p>
                  </div>

                  <p className="line-clamp-3 font-body text-sm leading-7 text-ink/75">
                    {post.content.replace(/<[^>]+>/g, " ").slice(0, 160)}...
                  </p>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex border-b-2 border-ink pb-0.5 font-display text-sm font-bold text-ink hover:bg-butter"
                  >
                    Baca selengkapnya -&gt;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <nav className="mt-12 flex items-center justify-between gap-4 border-t-4 border-ink pt-6 font-display text-sm font-bold text-ink">
          <Link
            href={currentPage > 1 ? `/?page=${currentPage - 1}` : "#"}
            aria-disabled={currentPage <= 1}
            className={
              currentPage <= 1
                ? "pointer-events-none opacity-40"
                : "border-b-2 border-ink hover:bg-butter"
            }
          >
            ← Prev
          </Link>

          <span>
            Halaman {pagination.currentPage} / {pagination.totalPages}
          </span>

          <Link
            href={
              currentPage < pagination.totalPages
                ? `/?page=${currentPage + 1}`
                : "#"
            }
            aria-disabled={currentPage >= pagination.totalPages}
            className={
              currentPage >= pagination.totalPages
                ? "pointer-events-none opacity-40"
                : "border-b-2 border-ink hover:bg-butter"
            }
          >
            Next →
          </Link>
        </nav>
      </div>
    </main>
  );
}
