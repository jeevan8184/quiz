import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "~/redux/actions";

// Corrected Material-UI Icon Imports
import Email from "@mui/icons-material/Email";
import Lock from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(getUser(userId));
      navigate("/dashboard");
    }
  }, [dispatch, navigate]);

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      toast.error("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/user/login`,
        {
          email,
          password,
        }
      );

      console.log("login response:", res);

      if (res.status === 200) {
        setSuccess("Signup successful! Redirecting to login...");
        toast.success("Signup successful!");
        setEmail("");
        setPassword("");
        localStorage.setItem("userId", res?.data?.user?._id);
        dispatch(getUser(res?.data?.user?._id));

        const redirectPath =
          localStorage.getItem("redirectPath") || "/dashboard";
        navigate(redirectPath);
        localStorage.removeItem("redirectPath");
      }
    } catch (error) {
      console.log(error);
      setError(
        error?.response?.data?.message ||
          "Failed to login up. Please try again later."
      );
      toast.error(
        error?.response?.data?.message ||
          "Failed to login up. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setError("");
    setSuccess("");
    setLoading(true);
    console.log("Decoded JWT:", jwtDecode(credentialResponse.credential));

    try {
      const googleCreds = jwtDecode(credentialResponse.credential);
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/user/googleauth`,
        {
          name: googleCreds?.name,
          email: googleCreds?.email,
          password: googleCreds?.sub,
          picture: googleCreds?.picture,
        }
      );

      console.log("googleauth response:", res);

      if (res.status === 200 || res.status === 201) {
        setSuccess("Signup successful! Redirecting to login...");
        toast.success("Signup successful!");
        setEmail("");
        setPassword("");
        localStorage.setItem("userId", res?.data?.user?._id);
        dispatch(getUser(res?.data?.user?._id));

        const redirectPath =
          localStorage.getItem("redirectPath") || "/dashboard";
        navigate(redirectPath);
        localStorage.removeItem("redirectPath");
      }
    } catch (error) {
      console.log(error);
      setError(
        error?.response?.data?.message ||
          "Failed to login up. Please try again later."
      );
      toast.error(
        error?.response?.data?.message ||
          "Failed to login up. Please try again later."
      );
    } finally {
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
            Log In
          </motion.h2>
          <motion.p
            className="text-gray-500 text-center mb-8 text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Sign in to create and share your quizzes.
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className={`w-full px-4 py-3 border text-black border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white pl-10 pr-10 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              className="flex items-center justify-between text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded transition duration-200"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 text-gray-600">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className={`font-medium text-blue-600 hover:text-blue-500 transition duration-200 ${
                  loading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                Forgot password?
              </Link>
            </motion.div>
            <motion.button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex items-center justify-center ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} className="mr-2 text-white" />
                  Signing in...
                </>
              ) : (
                "Log In"
              )}
            </motion.button>
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setError("Google login failed.");
                  toast.error("Google login failed.");
                }}
                width="100%"
                theme="filled_blue"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
                auto_select={true}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-6 text-center text-sm text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className={`font-medium text-blue-600 hover:text-blue-500 transition duration-200 ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              Sign up
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
            Start Your Quiz Journey
          </motion.h3>
          <motion.p
            className="relative text-lg sm:text-xl leading-relaxed opacity-90 drop-shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Engage your audience with interactive quizzes.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
