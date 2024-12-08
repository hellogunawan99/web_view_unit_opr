const mysql = require("mysql2");
require('dotenv').config();

const db = mysql.createConnection({
  host: "localhost",
  user: "gunawan",
  password: "CANcer99", // Ganti dengan password database Anda
  database: "report",
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi ke database gagal:", err);
    return;
  }
  console.log("Koneksi ke database berhasil.");
});

module.exports = db;
