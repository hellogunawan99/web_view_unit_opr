const jwt = require("jsonwebtoken"); // Gunakan JWT
const { connectDB } = require("../../../backend/db");
const crypto = require("crypto");

const SECRET_KEY = "your_secret_key"; // Gunakan key rahasia Anda

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { username, password } = req.body;

        try {
            const pool = await connectDB();
            const query = "SELECT * FROM gun_users WHERE username = @username";
            const result = await pool.request()
                .input("username", username.trim())
                .query(query);

            if (result.recordset.length === 0) {
                return res.status(404).json({ message: "Username tidak ditemukan" });
            }

            const user = result.recordset[0];
            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

            if (user.password !== hashedPassword) {
                return res.status(401).json({ message: "Password salah" });
            }

            // Generate JWT token yang berlaku selama 1 jam
            const payload = { id: user.id, username: user.username };
            const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

            // Simpan token dalam HttpOnly cookie
            res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Max-Age=3600; Path=/`);

            return res.status(200).json({
                message: "Login berhasil",
                mustChangePassword: user.must_change_password === 1,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Terjadi kesalahan server" });
        }
    } else {
        return res.status(405).json({ message: "Metode tidak diizinkan" });
    }
}
