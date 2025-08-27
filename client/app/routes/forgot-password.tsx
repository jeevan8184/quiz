import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import CircularProgress from "@mui/material/CircularProgress";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";

// Corrected Material-UI Icon Imports
import Email from "@mui/icons-material/Email";
import Lock from "@mui/icons-material/Lock";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    if (!email) {
      setError("Please enter your email address.");
      toast.error("Please enter your email address.");
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      localStorage.setItem("resetOtp", otp);
      localStorage.setItem("resetEmail", email);

      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/email`,
        {
          email,
          subject: "🔐 Your OTP for Password Reset",
          message: `Use the following OTP to reset your password: ${otp}\n\nIt will expire in 10 minutes.`,
        }
      );

      if (res.status === 200) {
        console.log("Email sent successfully:", res.data);
        toast.success("A password reset OTP has been sent to your email.");
        setSuccess("A password reset OTP has been sent to your email.");
        setEmail("");
        setTimeout(() => navigate("/verify-otp"), 1000);
      }
    } catch (error) {
      console.error(
        "Error sending reset OTP:",
        error?.response?.data || error?.message
      );
      setError("Failed to send reset OTP. Please try again later.");
      toast.error("Failed to send reset OTP. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 sm:p-6 flex items-center justify-center relative">
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <CircularProgress size={60} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row transform transition-all duration-300 hover:shadow-3xl">
        <div className="w-full md:w-1/2 p-8 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 text-center tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Forgot Password
          </motion.h2>
          <motion.p
            className="text-gray-500 text-center mb-8 text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Enter your email to receive a password reset OTP.
          </motion.p>
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                role="alert"
              >
                <strong className="font-semibold">Error: </strong>
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                role="alert"
              >
                <strong className="font-semibold">Success: </strong>
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  className={`w-full px-4 py-3 border text-black border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white pl-10 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Email className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </motion.div>
            <motion.button
              onClick={handleResetPassword}
              disabled={loading}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex items-center justify-center ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} className="mr-2 text-white" />
                  Sending...
                </>
              ) : (
                "Send Reset OTP"
              )}
            </motion.button>
          </motion.div>
          <motion.div
            className="mt-6 text-center text-sm text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Back to{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition duration-200"
            >
              Log in
            </Link>
          </motion.div>
        </div>
        <div className="hidden md:block md:w-1/2 p-10 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col justify-center items-center text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <motion.h3
            className="relative text-3xl sm:text-4xl font-extrabold mb-4 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Recover Your Account
          </motion.h3>
          <motion.p
            className="relative text-lg sm:text-xl leading-relaxed opacity-90 drop-shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Get back to creating engaging quizzes in no time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Lock className="mt-6 h-16 w-16 text-white" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
