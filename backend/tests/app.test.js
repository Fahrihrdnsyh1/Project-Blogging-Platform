const bcrypt = require("bcrypt");
const request = require("supertest");
const app = require("../app");
const db = require("../config/database");

let testCounter = 0;

function uniqueEmail(prefix) {
  testCounter += 1;
  return `${prefix}-${Date.now()}-${testCounter}@example.com`;
}

async function registerUser(overrides = {}) {
  const user = {
    name: "Integration Tester",
    email: uniqueEmail("user"),
    password: "Testing123!",
    ...overrides,
  };

  const response = await request(app).post("/api/auth/register").send(user);
  return { user, response };
}

beforeEach(async () => {
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.query("DELETE FROM comments");
  await db.query("DELETE FROM post_tags");
  await db.query("DELETE FROM posts");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM categories");
  await db.query("DELETE FROM tags");
  await db.query("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await db.end();
});

describe("Authentication endpoints", () => {
  test("registers a new user", async () => {
    const { response } = await registerUser({
      name: "New Author",
      email: uniqueEmail("register"),
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          name: "New Author",
          role: "author",
        },
      },
    });
  });

  test("rejects a duplicate registration email", async () => {
    const email = uniqueEmail("duplicate");
    await registerUser({ email });
    const duplicate = await registerUser({ email });

    expect(duplicate.response.status).toBe(409);
    expect(duplicate.response.body).toMatchObject({
      success: false,
      message: "Email already exists",
    });
  });

  test("logs in with valid credentials", async () => {
    const { user } = await registerUser();
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(user.email);
  });

  test("rejects an incorrect password", async () => {
    const { user } = await registerUser();
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "WrongPassword123!" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid credentials",
    });
  });
});

describe("Post endpoints", () => {
  test("returns an array from GET /api/posts", async () => {
    const passwordHash = await bcrypt.hash("Testing123!", 10);
    const [userResult] = await db.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ["Post Author", uniqueEmail("post-author"), passwordHash, "author"],
    );
    await db.execute(
      "INSERT INTO posts (user_id, title, slug, content, status) VALUES (?, ?, ?, ?, ?)",
      [
        userResult.insertId,
        "Published Integration Post",
        `published-integration-post-${Date.now()}`,
        "<p>Published test content</p>",
        "published",
      ],
    );

    const response = await request(app).get("/api/posts");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(expect.any(Array));
  });

  test("rejects POST /api/posts without a token", async () => {
    const response = await request(app).post("/api/posts").send({
      title: "Unauthorized post",
      content: "This should not be created",
      status: "draft",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Unauthorized",
    });
  });
});
