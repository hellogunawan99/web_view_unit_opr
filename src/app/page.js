"use client";

import { useState, useEffect } from "react"; // Add useEffect import
import axios from "axios";
import TabelPengguna from "./components/TabelPengguna";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Add this line

  // Add this useEffect block
  useEffect(() => {
    const checkAuthentication = async () => {
        try {
            const response = await axios.get('/api/auth-check');
            if (response.data.authenticated) {
                setCurrentPage("dashboard");
            }
        } catch (error) {
            setCurrentPage("login");
        } finally {
            setIsLoading(false);
        }
    };

    checkAuthentication();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/login", { username, password });
      if (response.data.mustChangePassword) {
        setCurrentPage("changePassword");
      } else {
        setCurrentPage("dashboard");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/change-password", { username, newPassword });
      alert("Password berhasil diubah. Silakan lanjutkan.");
      setCurrentPage("dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan");
    }
  };

    // Add this loading check before the return statement
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {currentPage === "login" && (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Login</h1>
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 transition"
                  required
                />
              </div>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {currentPage === "changePassword" && (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Ganti Password</h1>
            <form onSubmit={handleChangePassword}>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Password Baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-200 transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                Ganti Password
              </button>
            </form>
          </div>
        </div>
      )}


      {currentPage === "dashboard" && (
        <div>
          {/* <h1>Dashboard</h1> */}
          <TabelPengguna /> {/* Render the table component */}
        </div>
      )}
    </div>
  );
}
