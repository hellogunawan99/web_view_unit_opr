const jwt = require("jsonwebtoken");
const { connectDB } = require("../../../backend/db");
const crypto = require("crypto");

// It's better to use environment variable for SECRET_KEY
const SECRET_KEY = process.env.JWT_SECRET || "apaajaboleh"; // Better to use environment variable

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

            // Generate JWT token with more secure payload
            const token = jwt.sign(
                { 
                    id: user.id,
                    username: user.username,
                    // Add timestamp for additional security
                    iat: Math.floor(Date.now() / 1000),
                }, 
                SECRET_KEY, 
                { 
                    expiresIn: "1h",
                    algorithm: "HS256" // Explicitly specify the algorithm
                }
            );

            // Set cookie with additional security options
            res.setHeader(
                "Set-Cookie", 
                `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict${
                    process.env.NODE_ENV === 'production' ? '; Secure' : ''
                }`
            );

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
