import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

// Corrected Material-UI Icon Imports
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Cancel from "@mui/icons-material/Cancel";
import Timer from "@mui/icons-material/Timer";
import Star from "@mui/icons-material/Star";
import BarChart from "@mui/icons-material/BarChart";
import List from "@mui/icons-material/List";
import Home from "@mui/icons-material/Home";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TrendingDown from "@mui/icons-material/TrendingDown";
import Psychology from "@mui/icons-material/Psychology";
import TaskAlt from "@mui/icons-material/TaskAlt";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import PlayArrow from "@mui/icons-material/PlayArrow";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const UserResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.reducer.currentUser);
  const [quizSession, setQuizSession] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("performance");

  useEffect(() => {
    const fetchUserResults = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/quiz-session/user-results/${id}`,
          { params: { userId: user._id } }
        );
        if (response.data) {
          console.log("response", response);
          setQuizSession(response.data.quizSession);
          setUserStats(response.data.userStats);
          setError("");
        }
      } catch (err: any) {
        const message =
          err.response?.data?.error || "Failed to fetch quiz results";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (id && user?._id) {
      fetchUserResults();
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-8 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-900/20 border border-red-500/30 text-red-300 text-xl p-8 rounded-2xl shadow-xl text-center"
        >
          <p className="font-bold mb-4">An Error Occurred</p>
          <p>{error}</p>
          <button
            onClick={() => navigate("/activity/start-join")}
            className="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-200 overflow-x-hidden font-sans">
      <AnimatedBackground />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent text-center sm:text-left">
            Quiz Results: {quizSession?.quizId?.title || "N/A"}
          </h1>
          {/* <button
            onClick={() => navigate("/activity/start-join")}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
          >
            <PlayArrow fontSize="small" />
            Join Now
          </button> */}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/80 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={
                quizSession?.quizId.coverImage ||
                "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg"
              }
              alt={quizSession?.quizId.title}
              className="w-full md:w-56 h-36 md:h-auto object-cover rounded-xl"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {quizSession?.quizId.title}
              </h1>
              <p className="text-gray-400 mb-4">
                {quizSession?.quizId.description || "No description provided."}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <button
                  onClick={() => navigate("/activity/start-join")}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <PlayArrow fontSize="small" /> Join New Quiz
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <Home fontSize="small" /> Dashboard
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {userStats && <KeyMetrics stats={userStats} />}
        {userStats && <PerformanceSummary stats={userStats} />}

        <div className="flex border-b border-white/10 mb-8">
          <TabButton
            id="performance"
            activeTab={activeTab}
            onClick={setActiveTab}
            icon={<BarChart />}
            label="Performance"
          />
          <TabButton
            id="details"
            activeTab={activeTab}
            onClick={setActiveTab}
            icon={<List />}
            label="Question Details"
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "performance" && userStats && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <PerformanceTimelineChart stats={userStats} />
                </div>
                <div className="lg:col-span-2">
                  <ScoreDistributionChart stats={userStats} />
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === "details" && userStats && quizSession && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <QuestionBreakdown stats={userStats} quiz={quizSession.quizId} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl"
      animate={{
        x: [-100, 200, -100],
        y: [-100, 300, -100],
        scale: [1, 1.5, 1],
      }}
      transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"
      animate={{
        x: [100, -200, 100],
        y: [100, -300, 100],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 45,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 5,
      }}
    />
  </div>
);

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.5 }}
    className={`bg-gray-800/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 ${className}`}
  >
    {children}
  </motion.div>
);

const KeyMetrics = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
    <StatCard
      icon={<Star />}
      title="Your Rank"
      value={`#${stats.rank || "N/A"}`}
      color="text-purple-400"
      delay={0}
    />
    <StatCard
      icon={<EmojiEvents />}
      title="Total Score"
      value={`${stats.score || 0} pts`}
      color="text-yellow-400"
      delay={1}
    />
    <StatCard
      icon={<CheckCircle />}
      title="Accuracy"
      value={`${stats.accuracy || 0}%`}
      color="text-green-400"
      delay={2}
    />
    <StatCard
      icon={<Timer />}
      title="Average Time"
      value={`${stats.averageTime?.toFixed(1) || 0}s`}
      color="text-blue-400"
      delay={3}
    />
  </div>
);

const StatCard = ({ icon, title, value, color, delay }) => (
  <GlassCard
    delay={delay}
    className="text-center hover:-translate-y-2 transition-transform duration-300 p-4 sm:p-6"
  >
    <div
      className={`mx-auto w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-white/10 ${color}`}
    >
      {React.cloneElement(icon, { style: { fontSize: "28px" } })}
    </div>
    <p className="text-sm text-gray-400 mb-1">{title}</p>
    <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
  </GlassCard>
);

const PerformanceSummary = ({ stats }) => {
  const strongestTopic =
    stats.questionStats?.[0]?.question?.split(" ")[0] || "General";
  const weakestTopic =
    stats.questionStats?.[stats.questionStats.length - 1]?.question?.split(
      " "
    )[0] || "General";

  return (
    <GlassCard className="mb-8" delay={4}>
      <h3 className="text-2xl font-bold text-white mb-4">At a Glance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-900/30 p-4 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-400" />
            <h4 className="font-semibold text-green-300">Strengths</h4>
          </div>
          <p className="text-gray-300">
            You excelled at questions related to{" "}
            <span className="font-bold text-white">{strongestTopic}</span>.
            Great job!
          </p>
        </div>
        <div className="bg-red-900/30 p-4 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="text-red-400" />
            <h4 className="font-semibold text-red-300">
              Areas for Improvement
            </h4>
          </div>
          <p className="text-gray-300">
            Consider reviewing{" "}
            <span className="font-bold text-white">{weakestTopic}</span>. More
            practice could boost your score.
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

const TabButton = ({ id, activeTab, onClick, icon, label }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative px-4 py-3 text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-300 ${
      activeTab === id ? "text-white" : "text-gray-500 hover:text-white"
    }`}
  >
    {icon}
    {label}
    {activeTab === id && (
      <motion.div
        layoutId="activeTabIndicator"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500"
      />
    )}
  </button>
);

const PerformanceTimelineChart = ({ stats }) => {
  const data = {
    labels: stats.questionStats?.map((_, i) => `Q${i + 1}`) || [],
    datasets: [
      {
        label: "Points per Question",
        data: stats.questionStats?.map((q) => q.points || 0) || [],
        borderColor: "rgba(56, 189, 248, 1)",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#fff",
        pointBorderColor: "rgba(56, 189, 248, 1)",
        pointHoverRadius: 8,
        pointHoverBackgroundColor: "rgba(56, 189, 248, 1)",
        pointHoverBorderColor: "#fff",
      },
    ],
  };
  return (
    <GlassCard className="h-full">
      <h3 className="text-2xl font-bold text-white mb-6">
        Your Score Progression
      </h3>
      <div className="h-80">
        <Line data={data} options={chartOptions} />
      </div>
    </GlassCard>
  );
};

const ScoreDistributionChart = ({ stats }) => {
  const data = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [
          stats.correctAnswers || 0,
          (stats.answersCount || 0) - (stats.correctAnswers || 0),
        ],
        backgroundColor: [
          "rgba(52, 211, 153, 0.7)",
          "rgba(248, 113, 113, 0.7)",
        ],
        borderColor: ["rgba(52, 211, 153, 1)", "rgba(248, 113, 113, 1)"],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };
  return (
    <GlassCard className="h-full flex flex-col">
      <h3 className="text-2xl font-bold text-white mb-6">Answer Breakdown</h3>
      <div className="relative flex-grow flex items-center justify-center my-4">
        <div className="h-52 w-52 sm:h-64 sm:w-64">
          <Doughnut data={data} options={doughnutOptions} />
        </div>
        <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-4xl sm:text-5xl font-bold text-green-400"
          >
            {stats.accuracy || 0}%
          </motion.span>
          <span className="text-sm text-gray-300">Accuracy</span>
        </div>
      </div>
    </GlassCard>
  );
};

const QuestionBreakdown = ({ stats, quiz }) => (
  <GlassCard>
    <h3 className="text-2xl font-bold text-white mb-6">
      Detailed Question Analysis
    </h3>
    <div className="space-y-6">
      {quiz?.questions?.map((q, i) => {
        const userStat = stats.questionStats?.find(
          (qs) => qs.questionId === q._id
        );
        return (
          <QuestionDetailCard
            key={q._id || i}
            question={q}
            userStat={userStat}
            index={i}
          />
        );
      }) || <p className="text-gray-400">No questions available.</p>}
    </div>
  </GlassCard>
);

const QuestionDetailCard = ({ question, userStat, index }) => {
  const isCorrect = userStat?.isCorrect || false;
  const userAnswer = userStat?.userAnswer || "Not answered";

  const getCorrectAnswerText = (q) => {
    if (!q) return "N/A";
    if (q.type === "multiple-choice") {
      return q.options && q.options[q.correctAnswer]?.url
        ? `Image ${String.fromCharCode(65 + q.correctAnswer)}`
        : q.options && q.options[q.correctAnswer]
        ? `${String.fromCharCode(65 + q.correctAnswer)}. ${
            q.options[q.correctAnswer]
          }`
        : "N/A";
    }
    if (q.type === "true-false") {
      return q.correctAnswer ? "True" : "False";
    }
    return q.correctAnswer?.toString() || "N/A";
  };

  const renderContent = (content) => {
    if (!content || !Array.isArray(content)) return null;
    return content.map((item, idx) => {
      switch (item.type) {
        case "text":
          return (
            <p key={idx} className="text-sm text-gray-300 mt-2">
              {item.value || ""}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-gray-900/50 p-5 rounded-2xl border border-white/10"
    >
      <div className="flex justify-between items-start mb-4">
        <p className="font-semibold text-lg flex-1 pr-4">
          Q{index + 1}: {question?.question || "N/A"}
        </p>
        <span
          className={`py-1 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isCorrect
              ? "bg-green-500/20 text-green-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {isCorrect ? (
            <CheckCircle fontSize="small" />
          ) : (
            <Cancel fontSize="small" />
          )}
          {isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>

      {question?.content?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">
            Question Content
          </h4>
          {renderContent(question.content)}
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Answers</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-400">Your Answer: </span>
            <span
              className={`text-sm ${
                isCorrect ? "text-green-300" : "text-red-300"
              }`}
            >
              {userAnswer}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-400">Correct Answer: </span>
            <span className="text-sm text-cyan-300">
              {getCorrectAnswerText(question)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <Psychology /> Answer Options & Popularity
        </h4>
        <div className="space-y-3">
          {question?.type === "multiple-choice" && question?.options?.length ? (
            question.options.map((option, i) => {
              const isUserAnswer = option === userAnswer;
              const isActualCorrect = i === question.correctAnswer;
              const popularity = userStat?.allAnswers?.[option] || 0;

              return (
                <div key={i} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      {isUserAnswer ? (
                        <TaskAlt
                          className={`mr-2 ${
                            isActualCorrect ? "text-green-400" : "text-red-400"
                          }`}
                        />
                      ) : (
                        <RadioButtonUnchecked className="mr-2 text-gray-600" />
                      )}
                      {typeof option === "object" && option.type === "image" ? (
                        <div>
                          <img
                            src={option.url}
                            alt="Option image"
                            className="max-w-full h-auto rounded-lg my-2"
                          />
                          {option.description && (
                            <p className="text-sm text-gray-300 mt-2">
                              {option.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`${
                            isActualCorrect
                              ? "text-cyan-300 font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          {option || "N/A"}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      {popularity}% chose this
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${popularity}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.2 + index * 0.1,
                        ease: "easeOut",
                      }}
                      className={`h-2 rounded-full ${
                        isActualCorrect ? "bg-cyan-400" : "bg-gray-600"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400">
              Detailed analytics are available for multiple-choice questions
              only.
            </p>
          )}
        </div>
      </div>

      {question?.explanation && (
        <div className="mt-4 text-sm p-3 bg-black/30 rounded-lg border border-white/10">
          <span className="font-bold text-purple-300">Explanation: </span>
          {question.explanation}
        </div>
      )}
    </motion.div>
  );
};

// Chart.js options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  interaction: { mode: "index", intersect: false },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: "rgba(255, 255, 255, 0.7)" },
      grid: { color: "rgba(255, 255, 255, 0.1)" },
    },
    x: {
      ticks: { color: "rgba(255, 255, 255, 0.7)" },
      grid: { color: "rgba(255, 255, 255, 0.1)" },
    },
  },
  animation: {
    duration: 1000,
    easing: "easeOutQuart",
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "rgba(255, 255, 255, 0.8)",
        padding: 20,
        usePointStyle: true,
        pointStyle: "rectRounded",
      },
    },
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1200,
  },
};

export default UserResultsPage;
