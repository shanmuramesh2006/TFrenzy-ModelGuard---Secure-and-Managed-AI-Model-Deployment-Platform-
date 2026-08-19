import pg from "pg";

const { Pool } = pg;

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "tfrenzy_modelguard",
      }
);

pool.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});
