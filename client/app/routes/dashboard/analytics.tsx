import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { CircularProgress, Chip } from "@mui/material";

// Corrected Material-UI Icon Imports
import People from "@mui/icons-material/People";
import Star from "@mui/icons-material/Star";
import Timer from "@mui/icons-material/Timer";
import School from "@mui/icons-material/School";
import ListAlt from "@mui/icons-material/ListAlt";
import BarChart from "@mui/icons-material/BarChart";
import InsertChart from "@mui/icons-material/InsertChart";
import ShowChart from "@mui/icons-material/ShowChart";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Leaderboard from "@mui/icons-material/Leaderboard";
import QuestionAnswer from "@mui/icons-material/QuestionAnswer";
import Book from "@mui/icons-material/Book";
import FilterIcon from "@mui/icons-material/FilterList";
import Visibility from "@mui/icons-material/Visibility";
import GridIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/ViewList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const Analytics = () => {
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.reducer.currentUser);
  const [hostedSessions, setHostedSessions] = useState<any[]>([]);
  const [participatedSessions, setParticipatedSessions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(6);
  const [tabValue] = useSearchParams();

  useEffect(() => {
    if (tabValue.get("tabValue") === "hosted") setActiveTab("hosted");
    else if (tabValue.get("tabValue") === "participated")
      setActiveTab("participated");
    else setActiveTab("overview");
  }, [tabValue]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?._id) {
        setError("User not authenticated");
        toast.error("Please log in");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/all`,
          { params: { userId: user._id } }
        );
        const { hostedSessions, participatedSessions, feedback } =
          response.data;
        setHostedSessions(hostedSessions || []);
        setParticipatedSessions(participatedSessions || []);
        setFeedback(feedback || []);
      } catch (err: any) {
        const message =
          err.response?.data?.error || "Failed to fetch analytics";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  const subjects = useMemo(() => {
    const allSessions = [...hostedSessions, ...participatedSessions];
    return [
      "all",
      ...Array.from(
        new Set(allSessions.map((session) => session.quizId.subject))
      ),
    ];
  }, [hostedSessions, participatedSessions]);

  const processedSessions = useMemo(() => {
    const sessions =
      activeTab === "hosted" ? hostedSessions : participatedSessions;
    return sessions
      .filter((session) => {
        const titleMatch = session.quizId.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const difficultyMatch =
          filterDifficulty === "all" ||
          session.quizId.difficulty === filterDifficulty;
        const subjectMatch =
          filterSubject === "all" || session.quizId.subject === filterSubject;
        return titleMatch && difficultyMatch && subjectMatch;
      })
      .sort((a, b) => {
        const multiplier = sortOrder === "asc" ? 1 : -1;
        if (sortBy === "title")
          return multiplier * a.quizId.title.localeCompare(b.quizId.title);
        if (sortBy === "createdAt")
          return (
            multiplier *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        if (sortBy === "difficulty") {
          const order = ["beginner", "intermediate", "advanced"];
          return (
            multiplier *
            (order.indexOf(a.quizId.difficulty) -
              order.indexOf(b.quizId.difficulty))
          );
        }
        return 0;
      });
  }, [
    activeTab,
    hostedSessions,
    participatedSessions,
    searchTerm,
    filterDifficulty,
    filterSubject,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(processedSessions.length / sessionsPerPage);
  const currentSessions = processedSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterDifficulty,
    filterSubject,
    sortBy,
    sortOrder,
    activeTab,
  ]);

  const totalQuizzes = new Set(
    [...hostedSessions, ...participatedSessions].map((s) => s.quizId._id)
  ).size;
  const totalSessions = hostedSessions.length + participatedSessions.length;
  const averageRating = feedback.length
    ? (
        feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length
      ).toFixed(1)
    : "N/A";
  const calculateAverageScore = (sessions: any[]) => {
    if (!sessions.length) return 0;
    const total = sessions.reduce((sum, s) => {
      const p = s.participants.find((p) => p.userId === user._id);
      return sum + (p?.score || 0);
    }, 0);
    return (total / sessions.length).toFixed(1);
  };
  const feedbackDistributionData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        data: feedback.reduce((acc, fb) => {
          acc[fb.rating - 1] = (acc[fb.rating - 1] || 0) + 1;
          return acc;
        }, Array(5).fill(0)),
        backgroundColor: [
          "#EF4444",
          "#FBBF24",
          "#22C55E",
          "#3B82F6",
          "#8B5CF6",
        ],
        borderColor: "#1a1a2e",
        borderWidth: 2,
      },
    ],
  };
  const sessionTimelineData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Hosted",
        data: Array(12)
          .fill(0)
          .map(
            (_, i) =>
              hostedSessions.filter(
                (s) => new Date(s.createdAt).getMonth() === i
              ).length
          ),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Participated",
        data: Array(12)
          .fill(0)
          .map(
            (_, i) =>
              participatedSessions.filter(
                (s) => new Date(s.createdAt).getMonth() === i
              ).length
          ),
        backgroundColor: "rgba(139, 92, 246, 0.6)",
        borderColor: "rgba(139, 92, 246, 1)",
        borderWidth: 1,
      },
    ],
  };
  const difficulties = ["all", "beginner", "intermediate", "advanced"];
  const difficultyDistributionData = {
    labels: ["Beginner", "Intermediate", "Advanced"],
    datasets: [
      {
        label: "Quizzes by Difficulty",
        data: [
          [...hostedSessions, ...participatedSessions].filter(
            (s) => s.quizId.difficulty === "beginner"
          ).length,
          [...hostedSessions, ...participatedSessions].filter(
            (s) => s.quizId.difficulty === "intermediate"
          ).length,
          [...hostedSessions, ...participatedSessions].filter(
            (s) => s.quizId.difficulty === "advanced"
          ).length,
        ],
        backgroundColor: ["#22C55E", "#FBBF24", "#EF4444"],
      },
    ],
  };
  const scoreTrendData = {
    labels: participatedSessions
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((session) => format(new Date(session.createdAt), "MMM d")),
    datasets: [
      {
        label: "Your Score (%)",
        data: participatedSessions
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((session) => {
            const participant = session.participants.find(
              (p: any) => p.userId === user._id
            );
            return participant?.score || 0;
          }),
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#8B5CF6",
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
      },
    ],
  };
  const { subjectPerformanceData, questionTypePerformanceData } =
    useMemo(() => {
      const subjectStats = {};
      const questionTypeStats = {};
      participatedSessions.forEach((session) => {
        const userParticipant = session.participants.find(
          (p) => p.userId === user._id
        );
        if (!userParticipant || !userParticipant.answers) return;
        userParticipant.answers.forEach((ans) => {
          const question = session.quizId.questions.find(
            (q) => q._id === ans.questionId
          );
          if (question) {
            const subject = session.quizId.subject || "General";
            if (!subjectStats[subject])
              subjectStats[subject] = { correct: 0, total: 0 };
            subjectStats[subject].total++;
            if (ans.isCorrect) subjectStats[subject].correct++;
            const qType = question.type.replace("_", "-") || "unknown";
            if (!questionTypeStats[qType])
              questionTypeStats[qType] = { correct: 0, total: 0 };
            questionTypeStats[qType].total++;
            if (ans.isCorrect) questionTypeStats[qType].correct++;
          }
        });
      });
      return {
        subjectPerformanceData: {
          labels: Object.keys(subjectStats),
          datasets: [
            {
              label: "Accuracy (%)",
              data: Object.values(subjectStats).map(
                (s) => (s.correct / s.total) * 100
              ),
              backgroundColor: "rgba(16, 185, 129, 0.6)",
              borderColor: "rgba(16, 185, 129, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        questionTypePerformanceData: {
          labels: Object.keys(questionTypeStats),
          datasets: [
            {
              data: Object.values(questionTypeStats).map(
                (s) => (s.correct / s.total) * 100
              ),
              backgroundColor: [
                "rgba(59, 130, 246, 0.7)",
                "rgba(239, 68, 68, 0.7)",
                "rgba(245, 158, 11, 0.7)",
                "rgba(16, 185, 129, 0.7)",
              ],
              borderColor: "#1a1a2e",
              borderWidth: 2,
            },
          ],
        },
      };
    }, [participatedSessions, user]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  const chartOptions = (legendPosition = "top") => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: legendPosition,
        labels: { color: "#cbd5e1", font: { family: "Inter" } },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: { family: "Inter", weight: "bold" },
        bodyFont: { family: "Inter" },
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#94a3b8", font: { family: "Inter" } },
      },
      x: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#94a3b8", font: { family: "Inter" } },
      },
    },
  });
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#cbd5e1", font: { family: "Inter" } },
      },
      tooltip: chartOptions().plugins.tooltip,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400">
        {error}
      </div>
    );
  }

  const renderPagination = () =>
    totalPages > 1 && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center gap-4 mt-8"
      >
        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-slate-800 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors border border-purple-500/30"
        >
          Previous
        </button>
        <span className="text-purple-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-slate-800 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors border border-purple-500/30"
        >
          Next
        </button>
      </motion.div>
    );

  return (
    <div className="min-h-screen font-inter text-white bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold">Quiz Analytics</h1>
            <p className="text-gray-400 mt-1">
              Your performance and activity hub.
            </p>
          </div>
          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/dashboard/quizzes")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-lg"
          >
            <ListAlt /> Back to Quizzes
          </motion.button> */}
        </motion.div>

        <div className="relative border-b border-gray-700 mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {["overview", "hosted", "participated"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 font-semibold capitalize relative ${
                  activeTab === tab
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-purple-500"
                    layoutId="underline"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[
                  {
                    icon: <School className="text-blue-400" />,
                    label: "Total Quizzes",
                    value: totalQuizzes,
                  },
                  {
                    icon: <People className="text-purple-400" />,
                    label: "Total Sessions",
                    value: totalSessions,
                  },
                  {
                    icon: <Star className="text-yellow-400" />,
                    label: "Average Rating",
                    value: averageRating,
                  },
                  {
                    icon: <CheckCircle className="text-green-400" />,
                    label: "Your Avg. Score",
                    value: `${calculateAverageScore(participatedSessions)}%`,
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1"
                  >
                    {" "}
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-800 rounded-full">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{item.label}</p>
                        <h3 className="text-2xl font-bold">{item.value}</h3>
                      </div>
                    </div>{" "}
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <InsertChart className="text-blue-400" /> Feedback
                    Distribution
                  </h3>
                  <div className="h-72">
                    <Pie
                      data={feedbackDistributionData}
                      options={pieChartOptions}
                    />
                  </div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShowChart className="text-purple-400" /> Session Timeline
                  </h3>
                  <div className="h-72">
                    <Bar data={sessionTimelineData} options={chartOptions()} />
                  </div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart className="text-yellow-400" /> Difficulty
                    Distribution
                  </h3>
                  <div className="h-72">
                    <Bar
                      data={difficultyDistributionData}
                      options={{
                        ...chartOptions(),
                        plugins: {
                          ...chartOptions().plugins,
                          legend: { display: false },
                        },
                      }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Timer className="text-pink-400" /> Your Score Trend
                  </h3>
                  <div className="h-72">
                    <Line
                      data={scoreTrendData}
                      options={{
                        ...chartOptions(),
                        scales: {
                          ...chartOptions().scales,
                          y: { ...chartOptions().scales.y, suggestedMax: 100 },
                        },
                      }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Book className="text-green-400" /> Performance by Subject
                  </h3>
                  <div className="h-72">
                    <Bar
                      data={subjectPerformanceData}
                      options={{
                        ...chartOptions(),
                        scales: {
                          ...chartOptions().scales,
                          y: { ...chartOptions().scales.y, suggestedMax: 100 },
                        },
                      }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <QuestionAnswer className="text-teal-400" /> Accuracy by
                    Question Type
                  </h3>
                  <div className="h-72">
                    <Doughnut
                      data={questionTypePerformanceData}
                      options={pieChartOptions}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {(activeTab === "hosted" || activeTab === "participated") && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-6">
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500/20 to-slate-600/30 text-gray-300 rounded-lg hover:bg-slate-600/40 transition-all duration-300 border border-slate-500/30 hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <FilterIcon className="w-5 h-5" />
                  <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
                  <ExpandMoreIcon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search sessions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:ring-2 hover:ring-purple-500/50 transition-all duration-300"
                        />
                      </div>
                      <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="w-full p-3 bg-black/30 border border-purple-300/30 rounded-lg text-purple-300 text-sm focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                      >
                        {subjects.map((subject) => (
                          <option
                            key={subject}
                            value={subject}
                            className="bg-slate-900 text-purple-300"
                          >
                            {subject === "all" ? "All Subjects" : subject}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="w-full p-3 bg-black/30 border border-purple-300/30 rounded-lg text-purple-300 text-sm focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                      >
                        <option value="all" className="bg-slate-900">
                          All Difficulties
                        </option>
                        <option value="beginner" className="bg-slate-900">
                          Beginner
                        </option>
                        <option value="intermediate" className="bg-slate-900">
                          Intermediate
                        </option>
                        <option value="advanced" className="bg-slate-900">
                          Advanced
                        </option>
                      </select>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-3 bg-black/30 border border-purple-300/30 rounded-lg text-purple-300 text-sm focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                      >
                        <option value="createdAt" className="bg-slate-900">
                          Sort by Date
                        </option>
                        <option value="title" className="bg-slate-900">
                          Sort by Title
                        </option>
                        <option value="difficulty" className="bg-slate-900">
                          Sort by Difficulty
                        </option>
                      </select>
                      <motion.button
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500/20 to-purple-600/30 text-purple-300 rounded-lg hover:bg-purple-600/40 transition-all duration-300 border border-purple-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
                      >
                        <FilterIcon className="w-5 h-5" />
                        <span>
                          {sortOrder === "asc" ? "Ascending" : "Descending"}
                        </span>
                      </motion.button>
                      <motion.button
                        onClick={() =>
                          setViewMode(viewMode === "grid" ? "list" : "grid")
                        }
                        className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-slate-500/20 to-slate-600/30 text-gray-300 rounded-lg hover:bg-slate-600/40 transition-all duration-300 border border-slate-500/30 hover:-translate-y-0.5"
                      >
                        {viewMode === "grid" ? (
                          <ListIcon className="w-5 h-5" />
                        ) : (
                          <GridIcon className="w-5 h-5" />
                        )}
                        <span>
                          {viewMode === "grid" ? "List View" : "Grid View"}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                layout
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                <AnimatePresence>
                  {currentSessions.length > 0 ? (
                    currentSessions.map((session) => {
                      const participant = session.participants.find(
                        (p: any) => p.userId === user._id
                      );
                      return (
                        <motion.div
                          layout
                          key={session._id}
                          variants={itemVariants}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() =>
                            navigate(
                              activeTab === "hosted"
                                ? `/activity/host-result/${session._id}`
                                : `/activity/user-result/${session._id}`
                            )
                          }
                          className={`bg-gradient-to-br from-gray-900 to-purple-900/20 border border-purple-500/30 rounded-2xl backdrop-blur-sm shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] hover:scale-[1.02] transition-all duration-300 group ${
                            viewMode === "list" && "flex items-center p-4 gap-4"
                          }`}
                        >
                          <div
                            className={`relative rounded-xl overflow-hidden ${
                              viewMode === "grid"
                                ? "w-full h-40"
                                : "w-full sm:w-40 h-40"
                            }`}
                          >
                            <img
                              src={session.quizId.coverImage}
                              alt={session.quizId.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white px-3 py-1 rounded-full text-xs font-bold">
                              {session.quizId.subject}
                            </span>
                          </div>
                          <div
                            className={`flex-1 ${
                              viewMode === "grid" ? "p-4" : "space-y-1"
                            }`}
                          >
                            <h2 className="text-lg font-semibold text-purple-300">
                              {session.quizId.title}
                            </h2>
                            <p className="text-gray-300 text-sm">
                              Played on:{" "}
                              <span className="text-purple-300 font-medium">
                                {format(
                                  new Date(session.createdAt),
                                  "MM/dd/yyyy"
                                )}
                              </span>
                            </p>
                            <div
                              className={`grid grid-cols-2 gap-2 text-sm ${
                                viewMode === "grid" ? "mt-4" : "mt-2"
                              }`}
                            >
                              <p title="Difficulty">
                                <span className="text-purple-300 font-medium">
                                  {session.quizId.difficulty}
                                </span>
                              </p>
                              <p title="Questions">
                                <span className="text-purple-300 font-medium">
                                  {session.quizId.questions.length} Questions
                                </span>
                              </p>
                              <p title="Participants">
                                <span className="text-purple-300 font-medium">
                                  {session.participants.length} Players
                                </span>
                              </p>
                              {activeTab === "participated" && (
                                <p title="Your Score">
                                  <span className="text-purple-300 font-medium">
                                    {(participant?.score || 0).toFixed(1)}%
                                    Score
                                  </span>
                                </p>
                              )}
                              <p title="Average Score">
                                <span className="text-purple-300 font-medium">
                                  {(
                                    session.participants.reduce(
                                      (a, p) => a + p.score,
                                      0
                                    ) / (session.participants.length || 1)
                                  ).toFixed(1)}
                                  % Avg. Score
                                </span>
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-400 col-span-full text-center py-16"
                    >
                      No sessions found matching your criteria.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              {renderPagination()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Analytics;
