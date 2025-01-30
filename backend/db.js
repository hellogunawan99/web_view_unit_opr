const sql = require("mssql");
require('dotenv').config();

const config = {
  user: "user",
  password: "pass",
  server: "localhost",
  database: "db",
  port: 1433,
  options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      trustConnection: true
  },
  pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
  }
};


async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("Database connection successful");
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

module.exports = { connectDB, sql };