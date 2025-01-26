const { connectDB, sql } = require('../../../backend/db');
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ message: "Username dan password baru wajib diisi" });
    }

    try {
      // Hash password baru dengan SHA-256
      const hashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");

      // Koneksi ke database
      const pool = await connectDB();

      // Query untuk update password
      const query = `
        UPDATE gun_users 
        SET password = @password, must_change_password = 0 
        WHERE username = @username
      `;

      const result = await pool
        .request()
        .input("password", sql.VarChar, hashedPassword)
        .input("username", sql.VarChar, username)
        .query(query);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Username tidak ditemukan" });
      }

      res.status(200).json({ message: "Password berhasil diubah" });

    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ message: "Kesalahan server", error: err.message });
    }
  } else {
    res.status(405).json({ message: "Metode tidak diizinkan" });
  }
}
