import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import CircularProgress from "@mui/material/CircularProgress";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useSelector } from "react-redux";

// Corrected Material-UI Icon Imports
import Lock from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.reducer.currentUser);

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      toast.error("Please fill in both password fields.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      toast.error("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    const emailFromStorage = localStorage.getItem("resetEmail");
    const emailToReset = emailFromStorage || user?.email;

    if (!emailToReset) {
      setError(
        "Email not found. Please start the password reset process again."
      );
      toast.error(
        "Email not found. Please start the password reset process again."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/user/reset-password`,
        {
          email: emailToReset,
          newPassword,
        }
      );

      if (res.status === 200) {
        console.log("Password reset successfully:", res.data);
        setSuccess("Password reset successfully! Redirecting to login...");
        toast.success("Password reset successfully!");
        localStorage.removeItem("resetEmail");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          if (user) {
            navigate(-1);
          } else {
            navigate("/login");
          }
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      setError(
        error?.response?.data?.message ||
          "Failed to reset password. Please try again later."
      );
      toast.error(
        error?.response?.data?.message ||
          "Failed to reset password. Please try again later."
      );
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
            Reset Password
          </motion.h2>
          <motion.p
            className="text-gray-500 text-center mb-8 text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Enter your new password to reset your account.
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
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="new-password"
                  name="new-password"
                  autoComplete="new-password"
                  required
                  className={`w-full px-4 py-3 border text-black border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white pl-10 pr-10 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <VisibilityOff className="h-5 w-5" />
                  ) : (
                    <Visibility className="h-5 w-5" />
                  )}
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showCPassword ? "text" : "password"}
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  className={`w-full px-4 py-3 border text-black border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white pl-10 pr-10 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowCPassword(!showCPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showCPassword ? (
                    <VisibilityOff className="h-5 w-5" />
                  ) : (
                    <Visibility className="h-5 w-5" />
                  )}
                </button>
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
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} className="mr-2 text-white" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </motion.button>
          </motion.div>
          <motion.div
            className="mt-6 text-center text-sm text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
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
            Secure Your Account
          </motion.h3>
          <motion.p
            className="relative text-lg sm:text-xl leading-relaxed opacity-90 drop-shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Set a new password to continue creating engaging quizzes.
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
