import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import axios from "axios";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { themes } from "~/components/constants";

import TrophyIcon from "@mui/icons-material/EmojiEvents";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";

const QuizHostPage = ({
  id,
  socket,
  initialQuizSession,
  initialParticipants,
  initialTheme,
}) => {
  const user = useSelector((state) => state.reducer.currentUser);
  const [quizSession, setQuizSession] = useState(initialQuizSession || null);
  const [participants, setParticipants] = useState(initialParticipants || []);
  const [loading, setLoading] = useState(!initialQuizSession);
  const [error, setError] = useState("");
  const [currentTheme, setCurrentTheme] = useState(initialTheme || themes.dark);
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchQuizSessionAsync = async () => {
      if (!user?._id || initialQuizSession) {
        if (initialQuizSession && isMounted) {
          setQuizQuestions(initialQuizSession.quizId.questions || []);
          setIsPaused(initialQuizSession.status === "paused");
          setCountdown(10);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/${id}`,
          {
            params: { userId: user._id },
          }
        );
        if (response.data.quizSession && isMounted) {
          setQuizSession(response.data.quizSession);
          setParticipants(
            response.data.quizSession.participants.filter(
              (p) => !p.disconnected
            ) || []
          );
          setQuizQuestions(response.data.quizSession.quizId.questions || []);
          setIsPaused(response.data.quizSession.status === "paused");
          setCountdown(10);
          setError("");
        }
      } catch (err) {
        const message =
          err.response?.data?.error || "Failed to fetch quiz session";
        if (isMounted) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id && user?._id) {
      fetchQuizSessionAsync();

      if (socket.connected) {
        socket.emit("joinSession", id);
      }

      const onConnect = () => {
        console.log(`Connected to WebSocket server: ${socket.id}`);
        socket.emit("joinSession", id);
      };

      const onParticipantJoined = ({ sessionId, participant }) => {
        if (sessionId === id && isMounted) {
          setParticipants((prev) => {
            if (
              !prev.some(
                (p) => p.userId.toString() === participant.userId.toString()
              )
            ) {
              toast.success(`${participant.name} joined the session!`);
              return [...prev, { ...participant, disconnected: false }];
            }
            return prev;
          });
        }
      };

      const onParticipantLeft = ({ sessionId, userId }) => {
        if (sessionId === id && isMounted) {
          setParticipants((prev) => {
            const participant = prev.find(
              (p) => p.userId.toString() === userId.toString()
            );
            if (participant) {
              toast.success(`${participant.name} left the session`);
            }
            return prev.filter(
              (p) => p.userId.toString() !== userId.toString()
            );
          });
        }
      };

      const onQuizStarted = ({ sessionId }) => {
        if (sessionId === id && isMounted) {
          setIsPaused(false);
          setCountdown(10);
          toast.success("Quiz started!");
        }
      };

      const onCountdownStarted = ({ countdown }) => {
        if (isMounted) {
          setCountdown(countdown);
          toast.success(`Quiz starting in ${countdown} seconds!`);
        }
      };

      const onCountdownUpdated = ({ countdown }) => {
        if (isMounted) setCountdown(countdown);
      };

      const onQuizPaused = ({ sessionId }) => {
        if (sessionId === id && isMounted) {
          setIsPaused(true);
          setCountdown(null);
          toast.success("Quiz paused");
        }
      };

      const onQuizResumed = ({ sessionId }) => {
        if (sessionId === id && isMounted) {
          setIsPaused(false);
          setCountdown(10);
          toast.success("Quiz resumed");
        }
      };

      const onNextQuestion = ({ question, countdown }) => {
        if (isMounted) {
          setCurrentQuestionIndex(question.index);
          setCountdown(countdown);
          toast.success(`Question ${question.index + 1} started!`);
        }
      };

      const onSessionEnded = ({ sessionId, reason }) => {
        if (sessionId === id && isMounted) {
          toast.success(`Quiz ended: ${reason}`);
          navigate(-1);
        }
      };

      const onError = ({ message }) => {
        if (isMounted) {
          toast.error(message);
          if (message.includes("not found") || message.includes("Invalid")) {
            navigate(-1);
          }
        }
      };

      socket.on("connect", onConnect);
      socket.on("participantJoined", onParticipantJoined);
      socket.on("participantLeft", onParticipantLeft);
      socket.on("quizStarted", onQuizStarted);
      socket.on("countdownStarted", onCountdownStarted);
      socket.on("countdownUpdated", onCountdownUpdated);
      socket.on("quizPaused", onQuizPaused);
      socket.on("quizResumed", onQuizResumed);
      socket.on("nextQuestion", onNextQuestion);
      socket.on("sessionEnded", onSessionEnded);
      socket.on("error", onError);
    }

    return () => {
      isMounted = false;
      socket.off("connect");
      socket.off("participantJoined");
      socket.off("participantLeft");
      socket.off("quizStarted");
      socket.off("countdownStarted");
      socket.off("countdownUpdated");
      socket.off("quizPaused");
      socket.off("quizResumed");
      socket.off("nextQuestion");
      socket.off("sessionEnded");
      socket.off("error");
    };
  }, [id, user, navigate, initialQuizSession, socket]);

  useEffect(() => {
    let timer;
    if (
      countdown !== null &&
      countdown > 0 &&
      !isPaused &&
      quizQuestions.length > 0
    ) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            socket.emit("nextQuestion", {
              sessionId: id,
              adminId: user._id,
              questionIndex: currentQuestionIndex + 1,
            });
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [
    countdown,
    isPaused,
    currentQuestionIndex,
    quizQuestions.length,
    id,
    user,
  ]);

  const handlePauseResume = () => {
    if (isPaused) {
      socket.emit("resumeQuiz", { sessionId: id, adminId: user._id });
    } else {
      socket.emit("pauseQuiz", { sessionId: id, adminId: user._id });
    }
  };

  const handleEndQuiz = () => {
    socket.emit("endQuiz", { sessionId: id, adminId: user._id });
    setEndDialogOpen(false);
    toast.success("Quiz session ended!");
    navigate(-1);
  };

  const handleRestartQuestion = () => {
    socket.emit("restartQuestion", { sessionId: id, adminId: user._id });
    setCountdown(10);
    toast.success("Question restarted!");
  };

  const handleSkipQuestion = () => {
    socket.emit("skipQuestion", { sessionId: id, adminId: user._id });
    setCurrentQuestionIndex((prev) =>
      Math.min(prev + 1, (quizSession?.quizId?.questions?.length || 1) - 1)
    );
    setCountdown(10);
    toast.success("Question skipped!");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = (content) => {
    if (!content || !Array.isArray(content)) return null;
    return content.map((item, idx) => {
      switch (item.type) {
        case "text":
          return (
            <p key={idx} className="text-sm sm:text-base text-gray-300">
              {item.value}
            </p>
          );
        case "image":
          return (
            <img
              key={idx}
              src={item.url}
              alt="Question content"
              className="max-w-full h-auto rounded-lg my-2"
            />
          );
        case "audio":
          return (
            <audio key={idx} controls className="my-2">
              <source src={item.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          );
        case "video":
          return (
            <video
              key={idx}
              controls
              className="max-w-full h-auto rounded-lg my-2"
            >
              <source src={item.url} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          );
        default:
          return null;
      }
    });
  };

  const renderOptions = (question) => {
    if (!question) return null;
    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {question.options?.map((option, idx) => (
              <motion.div
                key={idx}
                className="answer-option bg-white/10 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-200 border border-white/5"
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-start">
                  <div className="bg-white/20 text-white h-6 w-6 rounded flex items-center justify-center font-medium mr-2 sm:mr-3 mt-0.5 text-sm">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <p className="text-sm sm:text-base">{option}</p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case "true-false":
        return (
          <div className="flex flex-col gap-2">
            {["True", "False"].map((option, idx) => (
              <motion.div
                key={idx}
                className="answer-option bg-white/10 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-200 border border-white/5"
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-start">
                  <div className="bg-white/20 text-white h-6 w-6 rounded flex items-center justify-center font-medium mr-2 sm:mr-3 mt-0.5 text-sm">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <p className="text-sm sm:text-base">{option}</p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case "short-answer":
      case "fill-in-the-blank":
        return (
          <div className="bg-white/10 p-3 sm:p-4 rounded-lg border border-white/5">
            <p className="text-sm sm:text-base text-gray-300">
              Enter your answer in the provided text box.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCorrectAnswer = (question) => {
    if (!question) return "N/A";
    switch (question.type) {
      case "multiple-choice":
        const correctIdx = question.correctAnswer;
        return question.options && question.options[correctIdx]
          ? `${String.fromCharCode(65 + question.correctAnswer)}. ${
              question.options[question.correctAnswer]
            }`
          : "N/A";
      case "true-false":
        return question.correctAnswer ? "True" : "False";
      case "short-answer":
      case "fill-in-the-blank":
        return question.correctAnswer || "N/A";
      default:
        return "N/A";
    }
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${currentTheme.bg}`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${currentTheme.bg}`}
      >
        <div
          className={`text-red-400 text-lg p-4 ${currentTheme.card} backdrop-blur-md rounded-xl shadow-lg`}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!quizSession) return null;

  return (
    <div
      className={`min-h-screen flex flex-col ${currentTheme.bg} ${
        currentTheme.name === "light" || currentTheme.name === "sky"
          ? "text-gray-900"
          : currentTheme.text
      } overflow-hidden pb-24`}
    >
      <motion.header
        className="flex justify-between items-center p-4 sm:p-6 shadow-md"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrophyIcon
              className={`text-3xl sm:text-4xl ${currentTheme.accent}`}
            />
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-pink-500">
            AI QuizMaster
          </h1>
        </div>
        <div className="flex gap-2 sm:gap-3 items-center">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <PaletteIcon
              className={`cursor-pointer ${currentTheme.accent} hover:text-pink-400 transition-colors duration-200 w-5 h-5 md:w-6 md:h-6`}
              onClick={() => setThemeSelectorOpen(true)}
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <FullscreenIcon
              className={`cursor-pointer ${currentTheme.accent} hover:text-blue-400 transition-colors duration-200 w-5 h-5 md:w-6 md:h-6`}
              onClick={toggleFullscreen}
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <CloseIcon
              className={`cursor-pointer ${currentTheme.accent} hover:text-red-400 transition-colors duration-200 w-5 h-5 md:w-6 md:h-6`}
              onClick={() => setEndDialogOpen(true)}
            />
          </motion.div>
        </div>
      </motion.header>

      <AnimatePresence>
        {themeSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setThemeSelectorOpen(false)}
          >
            <motion.div
              className={`${currentTheme.card} backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border border-white/10`}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">
                Select Theme
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center ${
                      theme.bg
                    } ${
                      currentTheme.name === theme.name
                        ? "ring-2 ring-teal-400"
                        : ""
                    } transition-all duration-200`}
                    onClick={() => {
                      setCurrentTheme(theme);
                      setThemeSelectorOpen(false);
                    }}
                  >
                    <span className="font-medium text-sm sm:text-base">
                      {theme.name}
                    </span>
                    {currentTheme.name === theme.name && (
                      <CheckIcon className="mt-2 w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setThemeSelectorOpen(false)}
                className="mt-4 sm:mt-6 w-full bg-red-600 hover:bg-red-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-semibold text-sm sm:text-base transition-all duration-200"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={endDialogOpen}
        onClose={() => setEndDialogOpen(false)}
        PaperProps={{
          className: `backdrop-blur-lg rounded-xl ${currentTheme.card} ${
            currentTheme.name === "light" || currentTheme.name === "sky"
              ? "text-gray-900"
              : currentTheme.text
          }`,
          style: {
            backgroundColor: currentTheme.cssCard,
            border: "1px solid rgba(255,255,255,0.1)",
            color:
              currentTheme.name === "light" || currentTheme.name === "sky"
                ? "#1f2937"
                : currentTheme.cssText,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <CloseIcon className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
          End Quiz Session?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            className={`text-sm sm:text-base ${
              currentTheme.name === "light" || currentTheme.name === "sky"
                ? "text-gray-900"
                : currentTheme.text
            }`}
            style={{
              color:
                currentTheme.name === "light" || currentTheme.name === "sky"
                  ? "#1f2937"
                  : currentTheme.cssText,
            }}
          >
            Are you sure you want to end this quiz session? All participants
            will be disconnected and scores will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-3 sm:p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEndDialogOpen(false)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg ${currentTheme.button} text-white font-medium text-sm sm:text-base shadow-md transition-all duration-200`}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndQuiz}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm sm:text-base shadow-md transition-all duration-200"
            autoFocus
          >
            End Quiz
          </motion.button>
        </DialogActions>
      </Dialog>

      <main className="flex-grow p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <motion.div
          className="mb-8 fade-in"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          key={currentQuestionIndex}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
            {quizSession?.quizId?.title || "AI Quiz"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            <span className="badge bg-teal-500/30 text-teal-300 text-xs font-medium px-3 py-1 rounded-full">
              {quizSession?.quizId?.subject || "AI & Machine Learning"}
            </span>
            <span className="badge bg-yellow-500/30 text-yellow-300 text-xs font-medium px-3 py-1 rounded-full">
              {quizSession?.quizId?.difficulty || "Advanced"}
            </span>
            <span className="badge bg-purple-500/30 text-purple-300 text-xs font-medium px-3 py-1 rounded-full">
              {quizQuestions.length || 0} Questions
            </span>
          </div>
          <div
            className={`${currentTheme.card} backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-white/10`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6">
              <div>
                <div className="flex items-center mb-3">
                  <span className="bg-teal-500/30 text-teal-300 text-xs font-medium px-3 py-1 rounded-full mr-2">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <span className="badge bg-blue-500/30 text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                    {quizQuestions[currentQuestionIndex]?.type ||
                      "multiple-choice"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight">
                  {quizQuestions[currentQuestionIndex]?.question ||
                    "Question text not available"}
                </h3>
              </div>
              {countdown !== null && (
                <motion.div
                  className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 150,
                  }}
                >
                  <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="44"
                      stroke="#2dd4bf"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray="276"
                      strokeDashoffset={276 - (276 * countdown) / 10}
                      animate={{
                        strokeDashoffset: 276 - (276 * countdown) / 10,
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                      key={countdown}
                    />
                  </svg>
                  <motion.div
                    className="text-center"
                    animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <p className="text-xs font-bold text-teal-300">
                      {countdown}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </div>
            <div className="mb-4">
              {renderContent(quizQuestions[currentQuestionIndex]?.content)}
            </div>
            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
              {quizQuestions[currentQuestionIndex]?.type === "short-answer" ||
              quizQuestions[currentQuestionIndex]?.type === "fill-in-the-blank"
                ? "Enter the most accurate answer."
                : "Select the most accurate answer."}
            </p>
            {renderOptions(quizQuestions[currentQuestionIndex])}
            <div className="mt-4">
              <p className="text-sm sm:text-base font-medium text-teal-300">
                Correct Answer:{" "}
                {renderCorrectAnswer(quizQuestions[currentQuestionIndex])}
              </p>
            </div>
            {quizQuestions[currentQuestionIndex]?.explanation && (
              <div className="mt-4">
                <p className="text-sm sm:text-base font-medium text-gray-300">
                  Explanation: {quizQuestions[currentQuestionIndex].explanation}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-2 sm:gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.button
            className={`${currentTheme.button} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200`}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestartQuestion}
          >
            <ReplayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Restart
          </motion.button>
          <motion.button
            className={`${currentTheme.button} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200`}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkipQuestion}
          >
            <SkipNextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Skip
          </motion.button>
          <motion.button
            className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEndDialogOpen(true)}
          >
            <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            End
          </motion.button>
        </motion.div>

        <div className="flex border-b border-white/30 mb-6">
          {["leaderboard", "questions"].map((tab) => (
            <motion.button
              key={tab}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                activeTab === tab
                  ? `text-teal-300 border-b-2 ${currentTheme.accent}`
                  : "text-gray-400 hover:text-white transition-colors duration-200"
              }`}
              onClick={() => handleTabChange(tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Leaderboard
                </h3>
                <div className="text-sm text-gray-400">
                  {participants.length} Participants
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex flex-col gap-3">
                  {participants
                    .sort((a, b) => b.score - a.score)
                    .map((participant, index) => (
                      <motion.div
                        key={participant.userId}
                        className="bg-white/5 rounded-lg p-4 flex items-center gap-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, ease: "easeOut" }}
                      >
                        <div className="text-gray-400 font-medium w-6 text-center">
                          {index + 1}
                        </div>
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-10 h-10 rounded-full border border-white/20"
                        />
                        <div className="flex-grow">
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-xs text-gray-400">
                            Answered: {participant.answersSubmitted || 0}/
                            {quizQuestions.length || 0}
                          </div>
                        </div>
                        <div className="font-medium">
                          {participant.score || 0} pts
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Questions</h3>
                <div className="text-sm text-gray-400">
                  {quizQuestions.length || 0} Total
                </div>
              </div>
              <div className="space-y-4">
                {quizQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, ease: "easeOut" }}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`bg-${
                            index === currentQuestionIndex
                              ? "teal-500"
                              : "gray-700"
                          }/30 text-${
                            index === currentQuestionIndex
                              ? "teal-300"
                              : "gray-400"
                          } text-xs font-medium px-3 py-1 rounded-full`}
                        >
                          Q{index + 1}
                        </span>
                        <span className="badge bg-blue-500/30 text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                          {question.type || "multiple-choice"}
                        </span>
                      </div>
                      <div
                        className={`text-xs ${
                          index === currentQuestionIndex
                            ? "text-teal-300"
                            : "text-gray-400"
                        }`}
                      >
                        {index === currentQuestionIndex ? "Current" : "Next"}
                      </div>
                    </div>
                    <p className="text-base sm:text-lg font-medium mb-3">
                      {question.question}
                    </p>
                    {renderContent(question.content)}
                    {renderOptions(question)}
                    <p className="text-sm sm:text-base font-medium text-teal-300 mt-3">
                      Correct Answer: {renderCorrectAnswer(question)}
                    </p>
                    {question.explanation && (
                      <p className="text-sm sm:text-base font-medium text-gray-300 mt-3">
                        Explanation: {question.explanation}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <motion.div
        className="fixed bottom-8 left-0 right-0 flex justify-center"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
      >
        <motion.button
          onClick={handlePauseResume}
          whileHover={{ scale: 1.05, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-3 px-8 py-4 rounded-full shadow-xl ${
            isPaused
              ? "bg-green-500 hover:bg-green-600"
              : "bg-yellow-500 hover:bg-yellow-600"
          } text-white font-bold relative overflow-hidden text-base transition-all duration-200`}
        >
          {isPaused && (
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <motion.div
            animate={{ rotate: isPaused ? 0 : 360 }}
            transition={{ duration: 0.5 }}
          >
            {isPaused ? (
              <PlayIcon className="text-xl" />
            ) : (
              <PauseIcon className="text-xl" />
            )}
          </motion.div>
          <span className="font-medium">
            {isPaused ? "Resume Quiz" : "Pause Quiz"}
          </span>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuizHostPage;
