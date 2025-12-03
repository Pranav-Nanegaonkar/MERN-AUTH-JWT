const mysql = require("mysql2/promise");
require("dotenv").config();
// Validate essential environment variables at startup
["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"].forEach(
  (k) => {
    if (!process.env[k]) {
      console.error(`Missing environment variable: ${k}`);
    }
  }
);

//  * MySQL Connection Pool (High-performance)

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

// const pool = mysql.createPool({
//   host: process.env.MYSQL_HOST,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DATABASE,
//   port: process.env.MYSQL_PORT || 3306,
//   timezone: "+05:30", // Explicit IST
//   waitForConnections: true,
//   connectionLimit: 20,
//   queueLimit: 0,
//   multipleStatements: false, // Security best practice
//   charset: "utf8mb4",
// });

//  * Generic Query Helper

exports.executeQuery = async function (sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error("DB Query Error:", err);
    throw err;
  }
};

//  * Transaction Helper

exports.executeTransaction = async function (callbackFn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const result = await callbackFn(connection);

    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    console.error("Transaction Error:", err);
    throw err;
  } finally {
    connection.release();
  }
};
