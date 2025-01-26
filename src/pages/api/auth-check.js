const jwt = require("jsonwebtoken");
const SECRET_KEY = "CANcer99"; // Use the same secret key as in login.js

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ 
            authenticated: false,
            message: "No token found" 
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        return res.status(200).json({
            authenticated: true,
            user: {
                id: decoded.id,
                username: decoded.username
            }
        });
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ 
            authenticated: false,
            message: "Invalid token" 
        });
    }
}
