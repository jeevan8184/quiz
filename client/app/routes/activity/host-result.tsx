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
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CircularProgress } from "@mui/material";

// Corrected Material-UI Icon Imports
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import People from "@mui/icons-material/People";
import Replay from "@mui/icons-material/Replay";
import Home from "@mui/icons-material/Home";
import BarChart from "@mui/icons-material/BarChart";
import ListAlt from "@mui/icons-material/ListAlt";
import Timer from "@mui/icons-material/Timer";
import School from "@mui/icons-material/School";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Cancel from "@mui/icons-material/Cancel";
import TrendingDown from "@mui/icons-material/TrendingDown";
import MilitaryTech from "@mui/icons-material/MilitaryTech";
import HelpOutline from "@mui/icons-material/HelpOutline";
import Feedback from "@mui/icons-material/Feedback";
import Star from "@mui/icons-material/Star";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.reducer.currentUser);
  const [quizSession, setQuizSession] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [feedbacks, setFeedbacks] = useState([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/quiz-session/host-results/${id}`,
          { params: { userId: user._id } }
        );
        if (response.data) {
          console.log("response : ", response);

          setQuizSession(response.data.quizSession);
          setLeaderboard(response.data.leaderboard || []);
          setFeedbacks(response.data.feedbacks);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    if (id && user?._id) {
      fetchResults();
    }
  }, [id, user]);

  const handleStartLive = async () => {
    if (!quizSession) {
      toast.error("quiz session not found");
      return;
    }
    try {
      setIsCreatingSession(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/create/${
          quizSession?.quizId._id
        }`,
        {
          userId: user._id,
          isPublic: true,
          maxParticipants: 100,
          socketId: null,
        }
      );
      if (response.data) {
        console.log("Quiz session created:", response.data);
        navigate(`/activity/start-quiz/${response.data.quizSession._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start live quiz");
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-teal-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !quizSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 p-4">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-md rounded-2xl border border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            No Results Found
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "Could not find the quiz session."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-200 overflow-x-hidden font-sans">
      <AnimatedBackground />
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
        <Header
          quizSession={quizSession}
          leaderboard={leaderboard}
          navigate={navigate}
        />
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isHost={user?._id === quizSession.hostId._id}
        />

        <AnimatePresence mode="wait">
          {activeTab === "leaderboard" && (
            <LeaderboardTab leaderboard={leaderboard} />
          )}
          {activeTab === "stats" && (
            <StatsTab leaderboard={leaderboard} quiz={quizSession.quizId} />
          )}
          {activeTab === "questions" &&
            user?._id === quizSession.hostId._id && (
              <QuestionsTab
                quiz={quizSession.quizId}
                leaderboard={leaderboard}
              />
            )}
          {activeTab === "participants" && (
            <ParticipantsTab participants={leaderboard} />
          )}
          {activeTab === "feedback" && <FeedbackTab feedbacks={feedbacks} />}
        </AnimatePresence>

        {user?._id === quizSession.hostId._id && (
          <HostActions
            navigate={navigate}
            sessionId={id}
            handleStartLive={handleStartLive}
            isCreatingSession={isCreatingSession}
          />
        )}
      </main>
    </div>
  );
};

const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl"
      animate={{
        x: [-100, 200, -100],
        y: [-100, 300, -100],
        scale: [1, 1.5, 1],
      }}
      transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"
      animate={{ x: [100, -200, 100], y: [100, -300, 100], scale: [1, 1.3, 1] }}
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
    className={`bg-gray-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 ${className}`}
  >
    {children}
  </motion.div>
);

const Header = ({ quizSession, leaderboard, navigate }) => {
  const duration =
    quizSession.endTime && quizSession.startTime
      ? Math.floor(
          (new Date(quizSession.endTime) - new Date(quizSession.startTime)) /
            60000
        )
      : 0;

  return (
    <GlassCard className="mb-8">
      {/* ADDED: Return to Dashboard button and header title */}
      <div className="flex justify-between items-center mb-6">
        <motion.button
          onClick={() => navigate("/dashboard")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
        >
          <Home className="text-xl" />
          <span>Dashboard</span>
        </motion.button>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          {quizSession.quizId.title}
        </h1>
        <div className="w-20 hidden sm:block"></div>{" "}
        {/* Spacer for alignment */}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <img
          src={
            quizSession.quizId.coverImage ||
            "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg"
          }
          alt={quizSession.quizId.title}
          className="w-full md:w-56 h-36 md:h-auto object-cover rounded-xl"
        />
        <div className="flex-1 text-center md:text-left">
          <p className="text-gray-400 mb-4">{quizSession.quizId.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem
              icon={<School className="text-cyan-400" />}
              label="Subject"
              value={quizSession.quizId.subject || "General"}
            />
            <InfoItem
              icon={<Timer className="text-purple-400" />}
              label="Duration"
              value={`${duration} mins`}
            />
            <InfoItem
              icon={<ListAlt className="text-blue-400" />}
              label="Questions"
              value={quizSession.quizId.questions.length}
            />
            <InfoItem
              icon={<People className="text-yellow-400" />}
              label="Participants"
              value={leaderboard.length}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="bg-black/20 p-4 rounded-xl">
    <div className="flex items-center justify-center gap-2">
      {icon}
      <p className="text-sm text-gray-400">{label}</p>
    </div>
    <p className="text-xl font-bold mt-1">{value}</p>
  </div>
);

const Tabs = ({ activeTab, setActiveTab, isHost }) => (
  <div className="flex border-b border-white/10 mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    <TabButton
      id="leaderboard"
      activeTab={activeTab}
      onClick={setActiveTab}
      icon={<EmojiEvents />}
      label="Leaderboard"
    />
    <TabButton
      id="stats"
      activeTab={activeTab}
      onClick={setActiveTab}
      icon={<BarChart />}
      label="Statistics"
    />
    {isHost && (
      <TabButton
        id="questions"
        activeTab={activeTab}
        onClick={setActiveTab}
        icon={<ListAlt />}
        label="Question Analysis"
      />
    )}
    <TabButton
      id="feedback"
      activeTab={activeTab}
      onClick={setActiveTab}
      icon={<Feedback />}
      label="Feedback"
    />
    <TabButton
      id="participants"
      activeTab={activeTab}
      onClick={setActiveTab}
      icon={<People />}
      label="Participants"
    />
  </div>
);

const TabButton = ({ id, activeTab, onClick, icon, label }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative px-4 sm:px-6 py-3 text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-300 ${
      activeTab === id ? "text-white" : "text-gray-500 hover:text-white"
    }`}
  >
    {icon} {label}
    {activeTab === id && (
      <motion.div
        layoutId="tabIndicator"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500"
      />
    )}
  </button>
);

const LeaderboardTab = ({ leaderboard }) => (
  <motion.div
    key="leaderboard"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className=" pt-4"
  >
    <Podium leaderboard={leaderboard} />
    <div className="space-y-3 mt-8">
      {leaderboard.slice(3).map((participant, index) => (
        <LeaderboardItem
          key={participant.userId}
          participant={participant}
          rank={index + 4}
        />
      ))}
    </div>
  </motion.div>
);

const Podium = ({ leaderboard }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
    <PodiumItem
      participant={leaderboard[1]}
      rank={2}
      color="from-gray-500 to-gray-600"
      textColor="text-gray-200"
      delay={0.2}
    />
    <PodiumItem
      participant={leaderboard[0]}
      rank={1}
      color="from-yellow-500 to-amber-600"
      textColor="text-yellow-200"
      delay={0}
      isFirst
    />
    <PodiumItem
      participant={leaderboard[2]}
      rank={3}
      color="from-amber-700 to-orange-800"
      textColor="text-orange-200"
      delay={0.4}
    />
  </div>
);

const PodiumItem = ({
  participant,
  rank,
  color,
  textColor,
  delay,
  isFirst = false,
}) => {
  if (!participant) return <div className="hidden md:block" />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className={`bg-gradient-to-b ${color} p-4 rounded-t-2xl text-center relative ${
        isFirst ? "md:scale-110 z-10" : ""
      }`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.5, type: "spring" }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl border-2 border-white/30"
      >
        {rank}
      </motion.div>
      <img
        src={
          participant.avatar ||
          `https://i.pravatar.cc/150?u=${participant.userId}`
        }
        alt={participant.name}
        className="w-20 h-20 rounded-full mx-auto mt-8 mb-3 border-4 border-white/20"
      />
      <h3 className="font-bold text-xl">{participant.name}</h3>
      <p className={`font-bold text-2xl ${textColor}`}>
        {participant.score} pts
      </p>
      <p className="text-xs text-gray-300">{participant.accuracy}% accuracy</p>
    </motion.div>
  );
};

const LeaderboardItem = ({ participant, rank }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: (rank - 4) * 0.05 }}
    className="bg-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors"
  >
    <div className="w-8 text-center font-bold text-gray-400">{rank}</div>
    <img
      src={
        participant.avatar ||
        `https://i.pravatar.cc/150?u=${participant.userId}`
      }
      alt={participant.name}
      className="w-10 h-10 rounded-full"
    />
    <div className="flex-grow">
      <h4 className="font-semibold">{participant.name}</h4>
      <p className="text-xs text-gray-400">
        {participant.correctAnswers}/{participant.answersCount} correct
      </p>
    </div>
    <div className="text-right">
      <p className="font-bold text-lg text-cyan-400">{participant.score} pts</p>
      <p className="text-xs text-gray-400">{participant.accuracy}%</p>
    </div>
  </motion.div>
);

const StatsTab = ({ leaderboard, quiz }) => {
  const avgScore =
    leaderboard.reduce((acc, p) => acc + p.score, 0) / leaderboard.length || 0;
  const avgAccuracy =
    leaderboard.reduce((acc, p) => acc + p.accuracy, 0) / leaderboard.length ||
    0;
  const toughestQuestions = quiz.questions
    .map((q, i) => {
      const correctCount = leaderboard.filter(
        (p) => p.questionStats[i]?.isCorrect
      ).length;
      return {
        question: q.question,
        accuracy: (correctCount / leaderboard.length) * 100,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  const scoreDistribution = [
    {
      range: "90-100%",
      count: leaderboard.filter((p) => p.accuracy >= 90).length,
    },
    {
      range: "70-89%",
      count: leaderboard.filter((p) => p.accuracy >= 70 && p.accuracy < 90)
        .length,
    },
    {
      range: "50-69%",
      count: leaderboard.filter((p) => p.accuracy >= 50 && p.accuracy < 70)
        .length,
    },
    { range: "<50%", count: leaderboard.filter((p) => p.accuracy < 50).length },
  ];
  const barChartData = {
    labels: scoreDistribution.map((d) => d.range),
    datasets: [
      {
        label: "# of Players",
        data: scoreDistribution.map((d) => d.count),
        backgroundColor: "rgba(56, 189, 248, 0.6)",
        borderColor: "rgba(56, 189, 248, 1)",
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      key="stats"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      <GlassCard>
        <h3 className="text-xl font-bold mb-4">Overall Performance</h3>
        <motion.div variants={containerVariants} className="space-y-4">
          <StatItem
            label="Average Score"
            value={avgScore.toFixed(1)}
            unit="pts"
          />
          <StatItem
            label="Average Accuracy"
            value={avgAccuracy.toFixed(1)}
            unit="%"
          />
          <StatItem
            label="Highest Score"
            value={Math.max(...leaderboard.map((p) => p.score)) || 0}
            unit="pts"
          />
          <StatItem
            label="Fastest Avg. Time"
            value={`${
              Math.min(...leaderboard.map((p) => p.averageTime)) || 0
            }s`}
          />
        </motion.div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingDown className="text-red-400" /> Toughest Questions
        </h3>
        <motion.div variants={containerVariants} className="space-y-4">
          {toughestQuestions.map((q, i) => (
            <motion.div key={i} variants={itemVariants} className="text-sm">
              <p className="truncate">{q.question}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${q.accuracy}%` }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                      delay: 0.2 + i * 0.1,
                    }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full"
                  />
                </div>
                <span className="text-xs font-mono text-red-300">
                  {q.accuracy.toFixed(0)}%
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
      <GlassCard className="md:col-span-2">
        <h3 className="text-xl font-bold mb-4">Accuracy Distribution</h3>
        <div className="h-64">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </GlassCard>
    </motion.div>
  );
};

const ParticipantsTab = ({ participants }) => {
  if (!participants || participants.length === 0) {
    return (
      <motion.div
        key="participants-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-16"
      >
        <People
          className="text-gray-600 mx-auto"
          style={{ fontSize: "4rem" }}
        />
        <h3 className="mt-4 text-xl font-bold text-gray-400">
          No Participants Found
        </h3>
        <p className="text-gray-500">
          There are no participants in this session's leaderboard.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="participants"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <GlassCard>
        <h3 className="text-xl font-bold mb-6">
          All Participants ({participants.length})
        </h3>
        <div className="flex flex-col gap-3">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.userId || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              className="bg-black/20 p-4 rounded-xl flex items-center gap-4 transition-colors duration-300"
            >
              {/* Rank */}
              <div className="w-8 text-center text-lg font-bold text-gray-400">
                {index + 1}
              </div>

              {/* Avatar and Name */}
              <img
                src={
                  participant.avatar ||
                  `https://i.pravatar.cc/150?u=${participant.userId}`
                }
                alt={participant.name}
                className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
              />
              <div className="flex-grow">
                <p className="text-md font-semibold text-gray-200">
                  {participant.name}
                </p>
                <p className="text-sm text-cyan-400">{participant.score} pts</p>
              </div>

              {/* Additional Stats */}
              <div className="hidden sm:flex items-center gap-6 text-center">
                <div>
                  <p className="text-xs text-gray-400">Accuracy</p>
                  <p className="font-semibold text-green-400">
                    {participant.accuracy}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg. Time</p>
                  <p className="font-semibold">{participant.averageTime}s</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

const StatItem = ({ label, value, unit }) => (
  <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
    <p className="text-gray-300">{label}</p>
    <p className="font-bold text-xl">
      {value} {unit && <span className="text-base text-cyan-400">{unit}</span>}
    </p>
  </div>
);

const QuestionsTab = ({ quiz, leaderboard }) => (
  <motion.div
    key="questions"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="space-y-6"
  >
    {quiz.questions.map((question, qIndex) => (
      <QuestionAnalysisCard
        key={question._id}
        question={question}
        qIndex={qIndex}
        leaderboard={leaderboard}
      />
    ))}
  </motion.div>
);

const FeedbackTab = ({ feedbacks }) => {
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <motion.div
        key="feedback-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center py-16"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Feedback
            className="text-gray-700 mx-auto"
            style={{ fontSize: "4rem" }}
          />
        </motion.div>
        <h3 className="mt-4 text-xl font-bold text-gray-400">
          No Feedback Received
        </h3>
        <p className="text-gray-500">
          When participants submit feedback, it will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="feedback"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {feedbacks.map((feedback) => (
        <motion.div
          key={feedback?._id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)" }}
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col h-full transition-all duration-300"
        >
          <div className="flex items-center mb-4">
            <img
              src={
                feedback?.avatar ||
                `https://i.pravatar.cc/150?u=${feedback.userId?._id}`
              }
              alt={feedback?.name || "User"}
              className="w-10 h-10 rounded-full mr-3 border-2 border-white/20"
            />
            <div className="flex-grow">
              <p className="font-bold text-white">
                {feedback?.name || "Anonymous"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.2 + i * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
              >
                <Star
                  className={
                    i < feedback.rating ? "text-yellow-400" : "text-gray-600"
                  }
                />
              </motion.div>
            ))}
          </div>

          <div className="flex-grow">
            {feedback.comment ? (
              <p className="text-gray-300 italic">"{feedback.comment}"</p>
            ) : (
              <p className="text-gray-500 italic">No comment provided.</p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
const QuestionAnalysisCard = ({ question, qIndex, leaderboard }) => {
  const totalPlayers = leaderboard.length;
  const answerCounts = {};

  // Initialize answer counts based on question type
  if (question.type === "multiple-choice") {
    question.options?.forEach((_, index) => {
      answerCounts[index] = 0;
    });
  } else if (question.type === "true-false") {
    answerCounts[true] = 0;
    answerCounts[false] = 0;
  } else {
    answerCounts["answered"] = 0;
  }

  // Aggregate answers from leaderboard
  leaderboard.forEach((player) => {
    const answer = player.questionStats[qIndex]?.userAnswer;
    if (answer !== undefined && answer !== null) {
      if (
        question.type === "multiple-choice" ||
        question.type === "true-false"
      ) {
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      } else {
        answerCounts["answered"] = (answerCounts["answered"] || 0) + 1;
      }
    }
  });

  // Function to get the correct answer text
  const getCorrectAnswerText = () => {
    if (!question) return "N/A";
    if (question.type === "multiple-choice") {
      return question.options && question.options[question.correctAnswer]
        ? `${String.fromCharCode(65 + question.correctAnswer)}. ${
            question.options[question.correctAnswer]
          }`
        : "N/A";
    }
    if (question.type === "true-false") {
      return question.correctAnswer ? "True" : "False";
    }
    return question.correctAnswer?.toString() || "N/A";
  };

  // Collect individual user answers
  const userAnswers = leaderboard
    .map((player) => {
      const answer = player.questionStats[qIndex]?.userAnswer;
      if (answer === undefined || answer === null) return null;
      return {
        name: player.name,
        answer:
          question.type === "multiple-choice" && answer !== undefined
            ? question.options && question.options[answer]
              ? `${String.fromCharCode(65 + answer)}. ${
                  question.options[answer]
                }`
              : "N/A"
            : answer?.toString() || "Not answered",
        isCorrect: player.questionStats[qIndex]?.isCorrect || false,
      };
    })
    .filter((answer) => answer !== null);

  return (
    <GlassCard>
      <h3 className="font-bold text-lg mb-4">
        Q{qIndex + 1}: {question.question}
      </h3>
      <div className="space-y-4">
        {/* Display Correct Answer */}
        <div className="bg-black/20 p-3 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-cyan-300">Correct Answer:</strong>{" "}
            {getCorrectAnswerText()}
          </p>
        </div>

        {question.type === "multiple-choice" ? (
          question.options?.map((option, oIndex) => {
            const count = answerCounts[oIndex] || 0;
            const percentage =
              totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
            const isCorrect = oIndex === question.correctAnswer;
            return (
              <AnswerOptionBar
                key={oIndex}
                text={
                  typeof option === "object" && option.type === "image" ? (
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
                    option
                  )
                }
                percentage={percentage}
                count={count}
                isCorrect={isCorrect}
              />
            );
          })
        ) : question.type === "true-false" ? (
          <>
            <AnswerOptionBar
              text="True"
              percentage={
                totalPlayers > 0 ? (answerCounts[true] / totalPlayers) * 100 : 0
              }
              count={answerCounts[true] || 0}
              isCorrect={question.correctAnswer === true}
            />
            <AnswerOptionBar
              text="False"
              percentage={
                totalPlayers > 0
                  ? (answerCounts[false] / totalPlayers) * 100
                  : 0
              }
              count={answerCounts[false] || 0}
              isCorrect={question.correctAnswer === false}
            />
          </>
        ) : (
          <div className="text-sm text-gray-400">
            <p>
              {answerCounts["answered"]} of {totalPlayers} players answered this
              question.
            </p>
          </div>
        )}

        {/* Individual User Answers */}
        {userAnswers.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">
              Participant Answers
            </h4>
            <div className="space-y-2">
              {userAnswers.map((user, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm bg-black/10 p-2 rounded-lg"
                >
                  <span className="text-gray-300">{user.name}</span>
                  <span
                    className={
                      user.isCorrect ? "text-green-300" : "text-red-300"
                    }
                  >
                    {user.answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {question.explanation && (
        <p className="text-xs mt-4 p-3 bg-black/20 rounded-lg text-gray-400">
          <strong>Explanation:</strong> {question.explanation}
        </p>
      )}
    </GlassCard>
  );
};

const AnswerOptionBar = ({ text, percentage, count, isCorrect }) => (
  <div>
    <div className="flex justify-between items-center text-sm mb-1">
      <div className="flex items-center gap-2">
        {isCorrect ? (
          <CheckCircle className="text-green-400" fontSize="small" />
        ) : (
          <HelpOutline className="text-gray-500" fontSize="small" />
        )}
        <span
          className={
            isCorrect ? "font-semibold text-green-300" : "text-gray-300"
          }
        >
          {text}
        </span>
      </div>
      <span className="font-mono text-gray-400">
        {count} players ({percentage.toFixed(0)}%)
      </span>
    </div>
    <div className="w-full bg-gray-700/50 rounded-full h-2.5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-2.5 rounded-full ${
          isCorrect ? "bg-green-500" : "bg-gray-500"
        }`}
      />
    </div>
  </div>
);

const HostActions = ({
  navigate,
  sessionId,
  handleStartLive,
  isCreatingSession,
}) => (
  <motion.div
    initial={{ y: 100 }}
    animate={{ y: 0 }}
    transition={{ delay: 0.5, type: "spring" }}
    className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4"
  >
    <button
      onClick={handleStartLive}
      disabled={isCreatingSession}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed"
      style={{ minWidth: "180px" }} // Prevents the button from changing size
    >
      {isCreatingSession ? (
        <>
          <CircularProgress size={20} color="inherit" />
          <span>Creating...</span>
        </>
      ) : (
        <>
          <Replay />
          <span>Restart Quiz</span>
        </>
      )}
    </button>
    {/* <button
      onClick={() => navigate("/activity/start-join")}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
    >
      <Home /> New Session
    </button> */}
  </motion.div>
);

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: "rgba(255, 255, 255, 0.7)", stepSize: 1 },
      grid: { color: "rgba(255, 255, 255, 0.1)" },
    },
    x: {
      ticks: { color: "rgba(255, 255, 255, 0.7)" },
      grid: { color: "rgba(255, 255, 255, 0.05)" },
    },
  },
};

export default ResultsPage;
