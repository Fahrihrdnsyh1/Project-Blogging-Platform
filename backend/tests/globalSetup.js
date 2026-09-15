const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

function getMysqlConfig(includeDatabase = true) {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "changeme",
    multipleStatements: true,
  };

  if (includeDatabase) {
    config.database = process.env.DB_NAME || "blog_platform_test";
  }

  return config;
}

async function connectWithRetry(config, attempts = 15) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await mysql.createConnection(config);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
}

module.exports = async () => {
  const databaseName = (process.env.DB_NAME || "blog_platform_test").replace(
    /[^a-zA-Z0-9_]/g,
    "",
  );
  const schema = fs.readFileSync(
    path.resolve(__dirname, "../../init.sql"),
    "utf8",
  );
  const serverConnection = await connectWithRetry(getMysqlConfig(false));

  try {
    await serverConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``,
    );
  } finally {
    await serverConnection.end();
  }

  const connection = await connectWithRetry({
    ...getMysqlConfig(true),
    database: databaseName,
  });

  try {
    await connection.query(`
      DROP TABLE IF EXISTS comments;
      DROP TABLE IF EXISTS post_tags;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS users;
    `);
    await connection.query(schema);
  } finally {
    await connection.end();
  }
};
