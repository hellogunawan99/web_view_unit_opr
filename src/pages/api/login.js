import db from "../../../backend/db"; // Pastikan ini sesuai struktur Anda
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username, password } = req.body;

    // Validasi data input
    if (!username || !password) {
      return res.status(400).json({ message: "Username dan password wajib diisi" });
    }

    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error("Database error:", err); // Log untuk debugging
        return res.status(500).json({ message: "Kesalahan server", error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Username tidak ditemukan" });
      }

      const user = results[0];
      const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Password salah" });
      }

      if (user.must_change_password) {
        return res.status(200).json({
          message: "Login berhasil. Harap ganti password.",
          mustChangePassword: true,
        });
      }

      return res.status(200).json({ message: "Login berhasil", mustChangePassword: false });
    });
  } else {
    // Tangani jika metode bukan POST
    return res.status(405).json({ message: "Metode tidak diizinkan" });
  }
}
