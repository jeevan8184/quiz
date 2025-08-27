import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  containerVariants,
  itemVariants,
  type Quiz,
} from "~/components/constants";
import io from "socket.io-client";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import { formatDistanceToNow } from "date-fns";
import { intervalToDuration, formatDuration } from "date-fns";

// Corrected Material-UI Icon Imports
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BackIcon from "@mui/icons-material/ArrowBack";
import AnalyticsIcon from "@mui/icons-material/BarChart";
import ShareIcon from "@mui/icons-material/Share";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import TimerIcon from "@mui/icons-material/Timer";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/ErrorOutline";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/HighlightOff";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import Public from "@mui/icons-material/Public";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

// --- Styled Chart Components ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#cbd5e1",
        font: { size: 12, family: "'Inter', sans-serif" },
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      titleColor: "#e2e8f0",
      bodyColor: "#94a3b8",
      borderColor: "#334155",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: "#94a3b8", stepSize: 20 },
      grid: { color: "rgba(51, 65, 85, 0.5)" },
    },
    x: {
      ticks: { color: "#94a3b8" },
      grid: { display: false },
    },
  },
};

const PieChart = ({ data, labels, colors }) => (
  <Pie
    data={{
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: "#1e293b",
          borderWidth: 2,
        },
      ],
    }}
    options={{ ...chartOptions, scales: {} }}
  />
);

const BarChart = ({ data, labels, colors }) => (
  <Bar
    data={{
      labels,
      datasets: [
        {
          label: "Correct Rate (%)",
          data,
          backgroundColor: colors,
          borderRadius: 4,
        },
      ],
    }}
    options={chartOptions}
  />
);

const LineChart = ({ data, labels, colors }) => (
  <Line
    data={{
      labels,
      datasets: [
        {
          label: "Time Spent (min)",
          data,
          borderColor: colors[0],
          backgroundColor: colors[0] + "33",
          fill: true,
          tension: 0.4,
        },
      ],
    }}
    options={chartOptions}
  />
);

// --- Socket.io Initialization ---
const socket = io(`${import.meta.env.VITE_SERVER_URL}`, { autoConnect: false });

// --- Main Component ---
const QuizDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const user = useSelector((state: any) => state.reducer.currentUser);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [quizSchedule, setQuizSchedule] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- MOCK ANALYTICS DATA (NO CHANGE IN LOGIC) ---
  const [analytics] = useState({
    totalAttempts: 128,
    averageScore: 72,
    completionRate: 85,
    questionStats: [
      { question: "Q1", correctRate: 89 },
      { question: "Q2", correctRate: 76 },
      { question: "Q3", correctRate: 92 },
      { question: "Q4", correctRate: 68 },
      { question: "Q5", correctRate: 81 },
    ],
    timeSpent: [2.5, 3.1, 1.8, 4.2, 2.9],
    playerEngagement: { active: 42, casual: 56, new: 30 },
  });

  // --- NEW: Memoized analytics insights derived from existing data ---
  const keyInsights = useMemo(() => {
    if (!analytics || analytics.questionStats.length === 0) {
      return { easiest: null, hardest: null };
    }
    const sortedByRate = [...analytics.questionStats].sort(
      (a, b) => a.correctRate - b.correctRate
    );
    return {
      hardest: sortedByRate[0],
      easiest: sortedByRate[sortedByRate.length - 1],
    };
  }, [analytics]);

  // --- DATA FETCHING (NO CHANGE IN LOGIC) ---
  const fetchQuiz = async () => {
    if (!user?._id) {
      setError("User not authenticated");
      toast.error("Please log in to view quiz details");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/${id}`,
        {
          params: { userId: user._id },
        }
      );
      if (response.data) {
        console.log("Fetched quiz:", response.data);
        setQuiz(response.data.quiz);
        setQuizSchedule(response.data.quizSchedule || null);
        setError("");
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to fetch quiz";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // --- USE EFFECT FOR FETCHING & SOCKETS (NO CHANGE IN LOGIC) ---
  useEffect(() => {
    if (id) {
      fetchQuiz();
      socket.auth = { userId: user?._id, sessionId: null };
      if (socket.disconnected) socket.connect();
      socket.on("connect", () =>
        console.log(`Connected to WebSocket server: ${socket.id}`)
      );
      socket.on("error", ({ message }) => toast.error(message));
    } else {
      setError("Invalid quiz ID");
      toast.error("Invalid quiz ID");
      setLoading(false);
    }
    return () => {
      socket.off("error");
      socket.disconnect();
    };
  }, [id, user, navigate]);

  useEffect(() => {
    let interval;
    if (quizSchedule && quizSchedule.status === "pending") {
      interval = setInterval(() => {
        const duration = intervalToDuration({
          start: new Date(),
          end: new Date(quizSchedule.scheduleTime),
        });
        setCountdown(
          formatDuration(duration, {
            format: ["days", "hours", "minutes", "seconds"],
            delimiter: " ",
          }) || "Starting soon"
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizSchedule]);

  const handleStartLive = async () => {
    if (!socket.connected || !socket.id) {
      toast.error("Not connected to server. Please try again.");
      return;
    }
    try {
      setIsCreatingSession(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/create/${id}`,
        {
          userId: user._id,
          isPublic: true,
          maxParticipants: 100,
          socketId: socket.id,
        }
      );
      if (response.data) {
        socket.auth.sessionId = response.data.quizSession._id;
        socket.emit("joinSession", response.data.quizSession._id);
        navigate(`/activity/start-quiz/${response.data.quizSession._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start live quiz");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handlePublishQuiz = async () => {
    if (!user) {
      toast.error("You must be logged in to publish a quiz.");
      return;
    }
    setIsPublishing(true);
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/${quiz?._id}/publish`,
        { userId: user._id }
      );
      if (response.data) {
        toast.success(response.data.message);
        setQuiz((prev) => ({ ...prev, isPublic: response.data.quiz.isPublic }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to toggle quiz status."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/quiz/${id}`, {
        params: { userId: user._id },
      });
      toast.success("Quiz deleted successfully!");
      navigate("/dashboard/quizzes");
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to delete quiz";
      toast.error(message);
    }
    setDeleteDialogOpen(false);
  };

  const handleScheduleQuiz = async () => {
    try {
      if (!scheduleTime) {
        toast.error("Please select a valid date and time");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/schedule/create/${id}`,
        {
          userId: user._id,
          scheduleTime,
        }
      );
      if (response) {
        toast.success(response.data.message || "Quiz scheduled successfully!");
        setScheduleDialogOpen(false);
        setScheduleTime("");
        setQuizSchedule(response.data.quizSchedule);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to schedule quiz";
      toast.error(message);
    }
  };

  const handleShare = () => {
    const quizUrl = `${window.location.origin}/dashboard/quizzes/${id}`;
    navigator.clipboard.writeText(quizUrl);
    toast.success("Quiz URL copied to clipboard!");
  };

  const handleCancelConfirm = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/schedule/${
          quizSchedule?._id
        }/cancel`
      );
      if (response) {
        toast.success(response.data.message);
        setQuizSchedule(null);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to cancel quiz schedule"
      );
    }
    setCancelDialogOpen(false);
  };

  const handleBack = () => navigate("/dashboard/quizzes");

  // --- RENDER HELPERS (IMPROVED STYLES) ---
  const renderContent = (content) => {
    const contentBoxStyle =
      "bg-slate-800/50 p-3 rounded-lg border border-slate-700";
    const contentTypeStyle =
      "flex items-center gap-2 text-cyan-400 font-medium text-xs uppercase tracking-wider";

    switch (content.type) {
      case "text":
        return (
          <div className={contentBoxStyle}>
            <div className={contentTypeStyle}>Text Content</div>
            <p className="text-slate-300 mt-2 text-sm">{content.value}</p>
          </div>
        );
      case "image":
        return (
          <div className={contentBoxStyle}>
            <div className={contentTypeStyle}>Image</div>
            <div className="mt-3 flex justify-center">
              <img
                src={content.url}
                alt="Question content"
                className="rounded-lg border border-cyan-500/20 max-w-sm w-full h-auto object-cover"
                onError={(e) =>
                  (e.currentTarget.src =
                    "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg")
                }
              />
            </div>
          </div>
        );
      case "audio":
        return (
          <div className={contentBoxStyle}>
            <div className={contentTypeStyle}>Audio</div>
            <audio controls className="mt-2 w-full">
              <source src={content.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case "video":
        return (
          <div className={contentBoxStyle}>
            <div className={contentTypeStyle}>Video</div>
            <iframe
              src={content.value}
              className="mt-2 w-full h-48 rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Question video"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderOptions = (options, type, correctAnswer) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isCorrect =
            type === "multiple-choice"
              ? index === correctAnswer
              : typeof option === "string" && option === correctAnswer;

          const isOptionObject = typeof option === "object" && option !== null;
          const optionValue = isOptionObject
            ? typeof option.description === "string"
              ? option.description
              : ""
            : String(option);
          const optionImage = isOptionObject ? option.url : null;
          const hasText = !!optionValue;
          const hasImage = !!optionImage;

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`p-3 rounded-lg flex items-center gap-3 border transition-all duration-300 ${
                isCorrect
                  ? "bg-cyan-500/10 border-cyan-500/30"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600"
              }`}
            >
              {hasImage && (
                <img
                  src={optionImage}
                  alt={hasText ? optionValue : "Option image"}
                  className="w-16 h-16 object-cover rounded-md border border-slate-600"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg")
                  }
                />
              )}
              {hasText && (
                <span className="text-sm text-slate-200 flex-1">
                  {optionValue}
                </span>
              )}
              {isCorrect && (
                <CheckCircleIcon className="text-cyan-400" fontSize="small" />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-slate-900">
        <motion.div
          className="h-12 w-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-slate-600 border-l-slate-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-slate-900 p-4">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-slate-800/50 border border-red-500/30 rounded-xl p-8 text-center max-w-md"
        >
          <ErrorIcon className="text-red-400 mx-auto text-5xl mb-4" />
          <h2 className="text-xl font-bold text-slate-100">
            An Error Occurred
          </h2>
          <p className="text-slate-400 text-sm mt-2 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <motion.button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go Back
            </motion.button>
            <motion.button
              onClick={fetchQuiz}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-slate-200">
      <div className="container mx-auto max-w-8xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
          >
            <motion.button
              onClick={handleBack}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors p-2 -ml-2 rounded-lg hover:bg-cyan-900/20"
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <BackIcon />{" "}
              <span className="text-sm font-medium">Back to Quizzes</span>
            </motion.button>
            <div className="flex gap-2 flex-wrap">
              {/* <motion.button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/70 hover:bg-slate-700/90 text-slate-200 rounded-lg transition-all border border-slate-700 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShareIcon sx={{ fontSize: 16 }} /> Share
              </motion.button> */}
              {!quizSchedule || quizSchedule.status !== "pending" ? (
                <motion.button
                  onClick={() => setScheduleDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/70 hover:bg-slate-700/90 text-slate-200 rounded-lg transition-all border border-slate-700 text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ScheduleIcon sx={{ fontSize: 16 }} /> Schedule
                </motion.button>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-900/20 px-3 py-1 rounded-lg"
                >
                  <CalendarIcon sx={{ fontSize: 16 }} />
                  <span>Starts in: {countdown}</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {quiz && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Quiz Details & Questions */}
              <motion.div
                className="lg:col-span-2 space-y-8"
                variants={containerVariants}
              >
                {/* Quiz Header Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-800/50 border border-slate-700/80 rounded-xl shadow-2xl shadow-slate-950/30 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/3 h-48 md:h-auto rounded-lg overflow-hidden relative group">
                        <img
                          src={quiz.coverImage}
                          alt={quiz.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg")
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <Chip
                            label={quiz.difficulty}
                            className={`${getDifficultyColor(
                              quiz.difficulty
                            )} !text-xs !font-semibold`}
                            size="small"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                          <h2 className="text-2xl font-bold text-white">
                            {quiz.title}
                          </h2>
                          {quiz.isAICreated && (
                            <Chip
                              label="AI-Generated"
                              className="!bg-purple-500/10 !text-purple-400 !text-xs"
                              size="small"
                            />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {quiz.description}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <p className="text-slate-500 text-xs">Subject</p>
                            <p className="text-cyan-400 font-medium">
                              {quiz.subject}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <p className="text-slate-500 text-xs">Questions</p>
                            <p className="font-medium text-slate-100">
                              {quiz.questions.length}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <p className="text-slate-500 text-xs">Created</p>
                            <p className="font-medium text-slate-100">
                              {format(new Date(quiz.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {quiz.enableTimer && (
                            <Chip
                              icon={<TimerIcon />}
                              label={`${quiz.timeLimit} min Timer`}
                              className="!bg-sky-500/10 !text-sky-300 !text-xs"
                              size="small"
                            />
                          )}
                          {quiz.randomizeQuestions && (
                            <Chip
                              label="Random Questions"
                              className="!bg-purple-500/10 !text-purple-300 !text-xs"
                              size="small"
                            />
                          )}
                          {quiz.randomizeAnswers && (
                            <Chip
                              label="Random Answers"
                              className="!bg-green-500/10 !text-green-300 !text-xs"
                              size="small"
                            />
                          )}
                          {quiz.showCorrectAnswers && (
                            <Chip
                              label="Shows Answers"
                              className="!bg-yellow-500/10 !text-yellow-300 !text-xs"
                              size="small"
                            />
                          )}
                        </div>
                        {quizSchedule && quizSchedule.status === "pending" && (
                          <motion.div
                            variants={itemVariants}
                            className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-900/20 px-3 py-1 rounded-lg"
                          >
                            <CalendarIcon sx={{ fontSize: 16 }} />
                            <span>
                              Scheduled:{" "}
                              {formatDistanceToNow(
                                new Date(quizSchedule.scheduleTime),
                                { addSuffix: true }
                              )}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Questions Section */}
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-6 shadow-2xl shadow-slate-950/30"
                >
                  <h3 className="text-xl font-semibold text-white mb-5">
                    Questions ({quiz.questions.length})
                  </h3>
                  <div className="space-y-6">
                    {quiz.questions.length > 0 ? (
                      quiz.questions.map((q, index) => (
                        <motion.div
                          key={q._id}
                          variants={itemVariants}
                          className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <span className="bg-slate-700 text-cyan-400 text-xs font-bold px-2 py-1 rounded-md">
                              Q{index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-100">
                                {q.question}
                              </h4>
                              <span className="text-xs text-slate-500 mt-1">
                                {q.type.replace(/-/g, " ").toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {q.content?.length > 0 && (
                            <div className="mb-4 space-y-3">
                              {q.content.map((c, i) => (
                                <motion.div key={i} variants={itemVariants}>
                                  {renderContent(c)}
                                </motion.div>
                              ))}
                            </div>
                          )}
                          {q.options?.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-xs text-slate-500 font-bold tracking-wider mb-2">
                                OPTIONS
                              </h5>
                              {renderOptions(
                                q.options,
                                q.type,
                                q.correctAnswer
                              )}
                            </div>
                          )}
                          <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs space-y-2">
                            <p className="text-slate-400">
                              Correct Answer:{" "}
                              <span className="font-semibold text-green-400 bg-green-900/30 px-2 py-1 rounded-md">
                                {(() => {
                                  if (q.type !== "multiple-choice") {
                                    return String(q.correctAnswer);
                                  }
                                  const correctOpt = q.options[q.correctAnswer];
                                  if (
                                    typeof correctOpt === "object" &&
                                    correctOpt !== null
                                  ) {
                                    return (
                                      correctOpt.description ||
                                      `Option ${q.correctAnswer + 1}`
                                    );
                                  }
                                  return correctOpt;
                                })()}
                              </span>
                            </p>
                            {q.explanation && (
                              <p className="text-slate-400">
                                Explanation:{" "}
                                <span className="text-slate-300">
                                  {q.explanation}
                                </span>
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">
                        This quiz doesn't have any questions yet.
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Actions & Analytics */}
              <motion.div
                className="lg:col-span-1 space-y-8"
                variants={containerVariants}
              >
                {/* Actions Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 shadow-2xl shadow-slate-950/30"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Conditional buttons for scheduled vs. unscheduled quiz */}
                    {!quizSchedule || quizSchedule.status !== "pending" ? (
                      // Button to start a live quiz (if not scheduled)
                      <motion.button
                        onClick={handleStartLive}
                        disabled={isCreatingSession}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all text-sm font-semibold disabled:bg-cyan-800 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {isCreatingSession ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <>
                            <PlayArrowIcon /> Start Live Quiz
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => setCancelDialogOpen(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/90 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-semibold"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} /> Cancel Scheduled
                        Quiz
                      </motion.button>
                    )}

                    <motion.button
                      onClick={handlePublishQuiz}
                      disabled={isPublishing}
                      className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                        quiz?.isPublic
                          ? "bg-slate-700/50 hover:bg-slate-600 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isPublishing ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <>
                          <Public sx={{ fontSize: 18 }} />
                          {quiz?.isPublic
                            ? "Unpublish Quiz"
                            : "Publish to Community"}
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() =>
                        navigate(`/dashboard/edit-quiz/${quiz._id}`)
                      }
                      className="w-full flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm font-semibold"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} /> Edit
                    </motion.button>
                    <motion.button
                      onClick={() => setDeleteDialogOpen(true)}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/90 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-semibold"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} /> Delete
                    </motion.button>
                  </div>
                </motion.div>

                {/* Analytics Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 shadow-2xl shadow-slate-950/30"
                >
                  <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <AnalyticsIcon className="text-cyan-400" /> Quiz Analytics
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Summary Cards */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center gap-4"
                    >
                      <PeopleIcon className="text-cyan-400 text-3xl" />
                      <div>
                        <p className="text-slate-400 text-xs">Total Attempts</p>
                        <p className="text-2xl font-bold text-white">
                          {analytics.totalAttempts}
                        </p>
                      </div>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center gap-4"
                    >
                      <StarIcon className="text-yellow-400 text-3xl" />
                      <div>
                        <p className="text-slate-400 text-xs">Average Score</p>
                        <p className="text-2xl font-bold text-white">
                          {analytics.averageScore}%
                        </p>
                      </div>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center gap-4"
                    >
                      <CheckCircleIcon className="text-green-400 text-3xl" />
                      <div>
                        <p className="text-slate-400 text-xs">
                          Completion Rate
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {analytics.completionRate}%
                        </p>
                      </div>
                    </motion.div>

                    {/* Key Insights */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <LightbulbIcon
                          className="text-yellow-400"
                          sx={{ fontSize: 18 }}
                        />{" "}
                        Key Insights
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <TrendingUpIcon className="text-green-400" />
                          <span>
                            Easiest Question:{" "}
                            <strong>{keyInsights.easiest?.question}</strong> (
                            {keyInsights.easiest?.correctRate}% correct)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDownIcon className="text-red-400" />
                          <span>
                            Hardest Question:{" "}
                            <strong>{keyInsights.hardest?.question}</strong> (
                            {keyInsights.hardest?.correctRate}% correct)
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Charts */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3">
                        Question Performance
                      </h4>
                      <div className="h-64">
                        <BarChart
                          data={analytics.questionStats.map(
                            (q) => q.correctRate
                          )}
                          labels={analytics.questionStats.map(
                            (q) => q.question
                          )}
                          colors={["#22d3ee"]}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3">
                        Player Engagement
                      </h4>
                      <div className="h-64">
                        <PieChart
                          data={Object.values(analytics.playerEngagement)}
                          labels={Object.keys(analytics.playerEngagement)}
                          colors={["#22d3ee", "#818cf8", "#4ade80"]}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3">
                        Time Spent Per Question (min)
                      </h4>
                      <div className="h-64">
                        <LineChart
                          data={analytics.timeSpent}
                          labels={analytics.questionStats.map(
                            (q) => q.question
                          )}
                          colors={["#22d3ee"]}
                        />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
      {/* MODALS / DIALOGS (Improved Styles) */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        PaperProps={{
          className:
            "!bg-slate-800 border border-slate-700 !rounded-xl !text-slate-200",
        }}
      >
        <DialogTitle className="!font-semibold !text-lg flex items-center gap-2">
          <CalendarIcon className="text-cyan-400" /> Schedule Quiz
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="!text-slate-400 text-sm mb-4">
            Select a date and time to schedule this quiz.
          </DialogContentText>
          <input
            type="datetime-local"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full p-2 bg-slate-700 text-slate-200 rounded-lg border border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
          />
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-700">
          <motion.button
            onClick={() => setScheduleDialogOpen(false)}
            className="px-4 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleScheduleQuiz}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Schedule
          </motion.button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          className:
            "!bg-slate-800 border border-slate-700 !rounded-xl !text-slate-200",
        }}
      >
        <DialogTitle className="!font-semibold !text-lg flex items-center gap-2">
          <CloseIcon className="text-red-400" /> Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="!text-slate-400 text-sm">
            Are you sure you want to delete this quiz? This action cannot be
            undone and all associated data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-700">
          <motion.button
            onClick={() => setDeleteDialogOpen(false)}
            className="px-4 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete
          </motion.button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        PaperProps={{
          className:
            "!bg-slate-800 border border-slate-700 !rounded-xl !text-slate-200",
        }}
      >
        <DialogTitle className="!font-semibold !text-lg flex items-center gap-2">
          <CloseIcon className="text-red-400" /> Cancel Schedule
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="!text-slate-400 text-sm">
            Are you sure you want to cancel the scheduled quiz? This action can
            be reversed by scheduling a new time.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-700">
          <motion.button
            onClick={() => setCancelDialogOpen(false)}
            className="px-4 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>
          <motion.button
            onClick={handleCancelConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel Schedule
          </motion.button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuizDetailPage;
