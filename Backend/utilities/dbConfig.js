// dbConfig.js (mysql2/promise)
const mysql = require("mysql2/promise");
require("dotenv").config();
const assert = require("assert");

[
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "MYSQL_PORT",
].forEach((k) => {
  assert(process.env[k], `Missing env var ${k}`);
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
  timezone: "+05:30",
  charset: "utf8mb4_general_ci",
  // optional timeouts:
  connectTimeout: 10000,
});

pool
  .getConnection()
  .then((conn) => {
    console.log("MySQL connection pool established successfully");
    conn.release();
  })
  .catch((err) => {
    console.error("MySQL connection failed:", err.message);
  });
module.exports = pool;
