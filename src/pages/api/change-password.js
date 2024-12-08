import db from "../../../backend/db";
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username, newPassword } = req.body;

    const hashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");
    const query = `
      UPDATE users 
      SET password = ?, must_change_password = FALSE 
      WHERE username = ?
    `;

    db.query(query, [hashedPassword, username], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Username tidak ditemukan" });
      }

      res.status(200).json({ message: "Password berhasil diubah" });
    });
  } else {
    res.status(405).json({ message: "Metode tidak diizinkan" });
  }
}
