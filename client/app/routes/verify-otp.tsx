import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import CircularProgress from "@mui/material/CircularProgress";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";

// Corrected Material-UI Icon Imports
import Lock from "@mui/icons-material/Lock";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleOtpChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    const otpString = otp.join("");
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      setError("Please enter a valid 6-digit OTP.");
      toast.error("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }
    const storedOtp = localStorage.getItem("resetOtp");
    if (otpString === storedOtp) {
      console.log("OTP Verified:", otpString);
      setSuccess("OTP verified successfully! Redirecting to reset password...");
      toast.success("OTP verified successfully!");
      localStorage.removeItem("resetOtp");
      //   localStorage.removeItem('resetEmail');
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => navigate("/reset-password"), 1000);
    } else {
      setError("Invalid OTP. Please try again.");
      toast.error("Invalid OTP. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoadingResend(true);
    const email = localStorage.getItem("resetEmail");
    if (!email) {
      setError("No email found. Please request a new OTP.");
      toast.error("No email found. Please request a new OTP.");
      setLoadingResend(false);
      return;
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      localStorage.setItem("resetOtp", newOtp);
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/email`,
        {
          email,
          subject: "🔐 Your New OTP for Password Reset",
          message: `Use the following OTP to reset your password: ${newOtp}\n\nIt will expire in 10 minutes.`,
        }
      );
      if (res.status === 200) {
        console.log("Resent OTP:", newOtp, "to email:", email);
        setSuccess("A new OTP has been sent to your email.");
        toast.success("A new OTP has been sent to your email.");
      }
    } catch (error) {
      console.error(
        "Error resending OTP:",
        error?.response?.data || error?.message
      );
      setError("Failed to resend OTP. Please try again later.");
      toast.error("Failed to resend OTP. Please try again later.");
      setLoadingResend(false);
    } finally {
      setLoadingResend(false);
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 sm:p-6 flex items-center justify-center relative">
      <AnimatePresence>
        {loadingResend && (
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
            Verify OTP
          </motion.h2>
          <motion.p
            className="text-gray-500 text-center mb-8 text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Enter the 6-digit OTP sent to your email.
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
              className="flex justify-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`w-12 h-12 text-black text-center text-lg font-semibold border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white ${
                    loading || loadingResend
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  aria-label={`OTP digit ${index + 1}`}
                  disabled={loading || loadingResend}
                />
              ))}
            </motion.div>
            <motion.button
              onClick={handleVerifyOtp}
              disabled={loading || loadingResend}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex items-center justify-center ${
                loading || loadingResend ? "opacity-50 cursor-not-allowed" : ""
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
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </motion.button>
            <motion.div
              className="text-center text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <button
                onClick={handleResendOtp}
                disabled={loading || loadingResend}
                className={`font-medium text-blue-600 hover:text-blue-500 transition duration-200 ${
                  loading || loadingResend
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Resend OTP
              </button>
            </motion.div>
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
            Verify your OTP to reset your password and continue creating
            quizzes.
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
