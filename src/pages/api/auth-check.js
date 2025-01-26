const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key"; // Sama seperti di login.js

export default function handler(req, res) {
    const token = req.cookies?.token; // Ambil token dari cookie
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Harap login kembali" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY); // Verifikasi token
        return res.status(200).json({ message: "Authenticated", user: decoded }); // Balikkan data user
    } catch (error) {
        console.error("Token invalid:", error);
        return res.status(403).json({ message: "Token tidak valid atau kadaluarsa" });
    }
}
