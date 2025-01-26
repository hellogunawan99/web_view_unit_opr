const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key"; // Replace with your actual secret key

// Middleware to verify JWT
export function verifyToken(req, res, next) {
    const token = req.cookies?.token; // Read token from cookies
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const verified = jwt.verify(token, SECRET_KEY); // Verify token
        req.user = verified; // Attach user data to the request for later use
        next(); // Grant access to the next function/route
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}
