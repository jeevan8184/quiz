import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { themes } from "~/components/constants";
import io from "socket.io-client";

import CopyIcon from "@mui/icons-material/ContentCopy";
import PlayIcon from "@mui/icons-material/PlayArrow";
import BackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import TrophyIcon from "@mui/icons-material/EmojiEvents";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckIcon from "@mui/icons-material/Check";

const socket = io(`${import.meta.env.VITE_SERVER_URL}`, { autoConnect: false });

const JoinQuizPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quizCode, setQuizCode] = useState("");
  const [currentTheme, setCurrentTheme] = useState(themes.dark);
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantQuestions, setParticipantQuestions] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const user = useSelector((state: any) => state.reducer.currentUser);
  const userLoading = useSelector((state: any) => state.reducer.userLoading);
  const [username, setUsername] = useState(user?.name || "");
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code") || "";

  useEffect(() => {
    if (code) {
      const input = document.getElementById("quiz-code-input");
      setQuizCode(code);
      if (input) input.focus();
    }
  }, [code]);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (user?._id) {
      setUsername(user.name || "");
      localStorage.removeItem("redirectPath");

      socket.auth = { userId: user._id, sessionId: null };
      socket.connect();

      socket.on("connect", () => console.log("Connected to WebSocket server"));
      socket.on("participantJoined", ({ participant }) => {
        toast.success(`${participant.name} joined the session!`);
      });
      socket.on("error", ({ message }) => toast.error(message));

      return () => {
        socket.off("participantJoined");
        socket.off("error");
        socket.disconnect();
      };
    } else {
      console.log("No user found after loading, redirecting to login");
      const redirectPath = location.pathname + location.search;
      localStorage.setItem("redirectPath", redirectPath);
      navigate("/login", {
        state: { from: redirectPath },
      });
    }
  }, [user, userLoading, navigate, location]);

  const handleVerifyQuiz = async () => {
    if (!quizCode || !username || !socket.id) {
      toast.error("Please enter both quiz code and your name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/verify`,
        {
          code: quizCode.toUpperCase(),
          userId: user._id,
          socketId: socket.id,
          name: username,
        }
      );
      if (
        response.data.alreadyJoined &&
        response.data.quizSession.status === "in-progress"
      ) {
        socket.auth.sessionId = response.data.quizSession._id;
        socket.emit("joinSession", response.data.quizSession._id);
        toast.success(
          `Joining quiz: ${response.data.quizSession.quizId.title}`
        );
        navigate(`/activity/waiting?code=${response.data.quizSession.code}`, {
          state: {
            username,
            theme: currentTheme,
            sessionId: response.data.quizSession._id,
          },
        });
      } else if (
        response.data.alreadyJoined &&
        response.data.quizSession.status === "lobby"
      ) {
        socket.auth.sessionId = response.data.quizSession._id;
        socket.emit("joinSession", response.data.quizSession._id);
        toast.success(
          `Joining quiz: ${response.data.quizSession.quizId.title}`
        );
        navigate(`/activity/waiting?code=${response.data.quizSession.code}`, {
          state: {
            username,
            theme: currentTheme,
            sessionId: response.data.quizSession._id,
          },
        });
      } else {
        setParticipantQuestions(response.data.quizSession);
        setShowDetails(true);
      }
    } catch (err) {
      console.log(err);
      toast.error(
        err.response?.data?.error || "Invalid quiz code or quiz not found"
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmJoin = async () => {
    if (!participantQuestions?._id) {
      toast.error("Session details not available");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/join`,
        {
          sessionId: participantQuestions._id,
          userId: user._id,
          socketId: socket.id,
          name: username,
        }
      );
      if (response.data.quizSession.status === "in-progress") {
        socket.auth.sessionId = response.data.quizSession._id;
        socket.emit("joinSession", response.data.quizSession._id);
        toast.success(
          `Joining quiz: ${response.data.quizSession.quizId.title}`
        );
        navigate(
          `/activity/quiz-participant/${response.data.quizSession._id}`,
          {
            state: {
              username,
              theme: currentTheme,
            },
          }
        );
      } else if (response.data.quizSession.status === "lobby") {
        socket.auth.sessionId = response.data.quizSession._id;
        socket.emit("joinSession", response.data.quizSession._id);
        toast.success(
          `Joining quiz: ${response.data.quizSession.quizId.title}`
        );
        navigate(`/activity/waiting?code=${response.data.quizSession.code}`, {
          state: {
            username,
            theme: currentTheme,
            sessionId: response.data.quizSession._id,
          },
        });
      } else {
        toast.error("Quiz session is not available");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join quiz");
    }
  };

  const handleCopyCode = () => {
    if (!quizCode) return;
    navigator.clipboard.writeText(quizCode);
    toast.success("Quiz code copied to clipboard!");
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-8 flex flex-col ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Header */}
      <motion.header
        className="flex justify-between items-center mb-8"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
        >
          <BackIcon className="text-2xl" />
          <span className="text-lg font-medium">Back</span>
        </motion.button>

        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <TrophyIcon className={`text-3xl ${currentTheme.accent}`} />
          <h1 className="text-2xl font-bold">QuizMaster</h1>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setThemeSelectorOpen(true)}
        >
          <PaletteIcon className={`text-2xl ${currentTheme.accent}`} />
        </motion.button>
      </motion.header>

      {/* Main Content */}
      <motion.main
        className="flex flex-col items-center flex-grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className={`${currentTheme.card} backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <motion.h2
            className={`text-2xl md:text-3xl font-bold mb-6 text-center ${currentTheme.accent}`}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Join a Quiz
          </motion.h2>

          {/* Quiz Code Input */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium mb-2">Quiz Code</label>
            <div className="relative">
              <input
                type="text"
                id="quiz-code-input"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 ${currentTheme.accent}/50`}
                maxLength={6}
              />
              {quizCode && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyCode}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <CopyIcon className="text-gray-400 hover:text-white" />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Username Input */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your display name"
                className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 ${currentTheme.accent}/50`}
              />
              <PersonIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </motion.div>

          {/* Join Button */}
          <motion.button
            onClick={handleVerifyQuiz}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`${currentTheme.button} w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="block w-5 h-5 border-2 border-t-transparent border-white rounded-full"
              />
            ) : (
              <>
                <PlayIcon />
                Join Quiz
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.main>

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {themeSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setThemeSelectorOpen(false)}
          >
            <motion.div
              className={`${currentTheme.card} backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-md`}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <h2 className="text-xl font-bold mb-6 text-center">
                Select Theme
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center ${
                      theme.bg
                    } ${
                      currentTheme.name === theme.name
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    onClick={() => {
                      setCurrentTheme(theme);
                      setThemeSelectorOpen(false);
                    }}
                  >
                    <span className="font-medium">{theme.name}</span>
                    {currentTheme.name === theme.name && (
                      <CheckIcon className="mt-2" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Details Modal */}
      <AnimatePresence>
        {showDetails && participantQuestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className={`${currentTheme.card} backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-md`}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrophyIcon className={currentTheme.accent} />
                Quiz Details
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="font-medium">
                    {participantQuestions.quizId.title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Subject</p>
                  <p className="font-medium">
                    {participantQuestions.quizId.subject || "General Knowledge"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Questions</p>
                  <p className="font-medium">
                    {participantQuestions.quizId.questions?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created By</p>
                  <p className="font-medium">
                    {participantQuestions.hostId?.name || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmJoin}
                  className={`flex-1 ${currentTheme.button} py-2 rounded-lg`}
                >
                  Join Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinQuizPage;
