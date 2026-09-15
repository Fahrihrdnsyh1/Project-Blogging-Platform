const bcrypt = require("bcrypt");
const db = require("./config/database");

const seedUsers = [
  {
    name: "Seed Admin",
    email: "admin.seed@example.com",
    password: "Admin123!",
    role: "admin",
  },
  {
    name: "Seed Author",
    email: "author.seed@example.com",
    password: "Author123!",
    role: "author",
  },
  {
    name: "Seed Reader",
    email: "reader.seed@example.com",
    password: "Reader123!",
    role: "reader",
  },
];

const seedCategories = [
  { name: "Technology", slug: "technology" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Tutorial", slug: "tutorial" },
];

const seedTags = [
  { name: "Next.js", slug: "nextjs" },
  { name: "Docker", slug: "docker" },
  { name: "JavaScript", slug: "javascript" },
];

const seedPosts = [
  {
    email: "author.seed@example.com",
    categorySlug: "technology",
    title: "Getting Started with Next.js",
    slug: "getting-started-with-nextjs",
    content:
      "<p>This is a seeded published article about building a blog with Next.js.</p>",
    featuredImage: null,
    tagSlugs: ["nextjs", "javascript"],
  },
  {
    email: "author.seed@example.com",
    categorySlug: "tutorial",
    title: "Running a Blog with Docker Compose",
    slug: "running-a-blog-with-docker-compose",
    content:
      "<p>This is a seeded published article about running the blog stack with Docker Compose.</p>",
    featuredImage: null,
    tagSlugs: ["docker", "javascript"],
  },
  {
    email: "admin.seed@example.com",
    categorySlug: "lifestyle",
    title: "Writing Better Blog Articles",
    slug: "writing-better-blog-articles",
    content:
      "<p>This is a seeded published article with practical writing tips for bloggers.</p>",
    featuredImage: null,
    tagSlugs: ["javascript"],
  },
];

async function getReadyConnection(attempts = 10) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.query("SELECT 1");
      return connection;
    } catch (error) {
      lastError = error;
      if (connection) connection.release();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw lastError;
}

async function seed() {
  let connection;

  try {
    connection = await getReadyConnection();
    await connection.beginTransaction();

    const userIds = new Map();
    for (const user of seedUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await connection.execute(
        `
          INSERT INTO users (name, email, password_hash, role)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            password_hash = VALUES(password_hash),
            role = VALUES(role)
        `,
        [user.name, user.email, passwordHash, user.role],
      );

      const [rows] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [user.email],
      );
      userIds.set(user.email, rows[0].id);
    }

    const categoryIds = new Map();
    for (const category of seedCategories) {
      await connection.execute(
        `
          INSERT INTO categories (name, slug)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name)
        `,
        [category.name, category.slug],
      );

      const [rows] = await connection.execute(
        "SELECT id FROM categories WHERE slug = ?",
        [category.slug],
      );
      categoryIds.set(category.slug, rows[0].id);
    }

    const tagIds = new Map();
    for (const tag of seedTags) {
      await connection.execute(
        `
          INSERT INTO tags (name, slug)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name)
        `,
        [tag.name, tag.slug],
      );

      const [rows] = await connection.execute(
        "SELECT id FROM tags WHERE slug = ?",
        [tag.slug],
      );
      tagIds.set(tag.slug, rows[0].id);
    }

    for (const post of seedPosts) {
      await connection.execute(
        `
          INSERT INTO posts
            (user_id, category_id, title, slug, content, featured_image, status)
          VALUES (?, ?, ?, ?, ?, ?, 'published')
          ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            category_id = VALUES(category_id),
            title = VALUES(title),
            content = VALUES(content),
            featured_image = VALUES(featured_image),
            status = 'published'
        `,
        [
          userIds.get(post.email),
          categoryIds.get(post.categorySlug),
          post.title,
          post.slug,
          post.content,
          post.featuredImage,
        ],
      );

      const [postRows] = await connection.execute(
        "SELECT id FROM posts WHERE slug = ?",
        [post.slug],
      );
      const postId = postRows[0].id;

      await connection.execute("DELETE FROM post_tags WHERE post_id = ?", [
        postId,
      ]);
      for (const tagSlug of post.tagSlugs) {
        await connection.execute(
          "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
          [postId, tagIds.get(tagSlug)],
        );
      }
    }

    await connection.commit();
    console.log("Seed completed successfully.");
    console.log(`Users: ${seedUsers.length}`);
    console.log(`Categories: ${seedCategories.length}`);
    console.log(`Tags: ${seedTags.length}`);
    console.log(`Published posts: ${seedPosts.length}`);
  } catch (error) {
    await connection.rollback();
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await db.end();
  }
}

seed();
