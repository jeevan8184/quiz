import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { containerVariants, itemVariants } from "~/components/constants";
import { useSelector } from "react-redux";
import {
  formatDistanceToNow,
  intervalToDuration,
  formatDuration,
} from "date-fns";
import ExploreQuizzes from "~/components/explore-quizzes";

// Corrected Material-UI Icon Imports
import AddIcon from "@mui/icons-material/Add";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import UploadIcon from "@mui/icons-material/Upload";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TimerIcon from "@mui/icons-material/Timer";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShareIcon from "@mui/icons-material/Share";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DiamondIcon from "@mui/icons-material/Diamond";
import TrophyIcon from "@mui/icons-material/EmojiEvents"; // Correct direct import

// Main Dashboard Component
export default function DashboardIndex() {
  const [dashboardData, setDashboardData] = useState({
    quizStats: {
      totalQuizzes: 0,
      byDifficulty: [],
      bySubject: [],
      totalHosted: 0,
      totalParticipated: 0,
      avgParticipantDuration: 0,
      avgScore: 0,
    },
    sessions: {
      hosted: [],
      participated: [],
      scheduled: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.reducer.currentUser);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quiz/dashboard/data`,
          { params: { userId: user?._id } }
        );
        if (response.data) {
          console.log("Dashboard data:", response.data);
          setDashboardData(response.data);
          setUsers(response.data?.users || []);
        }
      } catch (error) {
        toast.error(
          error.response?.data?.error || "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const renderPlanBanner = () => {
    if (!user) return null;

    const plan = user.plan || "Free";
    let bannerContent;

    if (plan === "Pro") {
      bannerContent = {
        title: "You're on the Pro Plan!",
        message: `You have ${
          user.credits || 0
        } AI generations remaining this month.`,
        buttonText: "Manage Plan",
        buttonColor: "bg-green-600 hover:bg-green-500",
        bannerColor: "bg-green-900/40 border-green-500/50",
        icon: (
          <CheckCircleIcon sx={{ fontSize: 40 }} className="text-green-400" />
        ),
      };
    } else if (plan === "Enterprise") {
      bannerContent = {
        title: "Welcome, Enterprise User!",
        message:
          "You have unlimited AI generations and access to all features.",
        buttonText: "Contact Support",
        buttonColor: "bg-cyan-600 hover:bg-cyan-500",
        bannerColor: "bg-cyan-900/40 border-cyan-500/50",
        icon: <DiamondIcon sx={{ fontSize: 40 }} className="text-cyan-400" />,
      };
    } else {
      // Free plan
      bannerContent = {
        title: "Unlock Pro Features!",
        message:
          "Upgrade your plan to get more AI generations, image uploads, and detailed analytics.",
        buttonText: "Upgrade Now",
        buttonColor: "bg-purple-600 hover:bg-purple-500",
        bannerColor: "bg-purple-900/40 border-purple-500/50",
        icon: <StarIcon sx={{ fontSize: 40 }} className="text-yellow-400" />,
      };
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className={`p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-white my-4 ${bannerContent.bannerColor}`}
      >
        <div className="flex items-center gap-4">
          {bannerContent.icon}
          <div>
            <h2 className="text-xl font-semibold">{bannerContent.title}</h2>
            <p className="text-sm text-white mt-1">{bannerContent.message}</p>
          </div>
        </div>
        <motion.button
          onClick={() => navigate("/pricing")}
          className={`flex items-center gap-2 px-6 py-3 ${bannerContent.buttonColor} text-white font-semibold rounded-lg text-sm`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {bannerContent.buttonText} <ArrowForwardIcon />
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-screen">
      <motion.header
        className="mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]"
          variants={itemVariants}
        >
          Dashboard
        </motion.h1>
        <motion.p
          className="text-base text-slate-300 mt-2"
          variants={itemVariants}
        >
          Your hub for quiz creation, management, and insights.
        </motion.p>
      </motion.header>

      {loading ? (
        <motion.div
          className="flex justify-center items-center h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="h-16 w-16 border-4 border-t-cyan-400 border-r-cyan-400 border-b-slate-600 border-l-slate-600 rounded-full animate-spin" />
        </motion.div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              title="Total Quizzes"
              value={dashboardData.quizStats.totalQuizzes}
              icon={<AssessmentIcon />}
              color="from-blue-600/30 to-cyan-600/30"
            />
            <StatCard
              title="Hosted Sessions"
              value={dashboardData.quizStats.totalHosted}
              icon={<PeopleIcon />}
              color="from-purple-600/30 to-indigo-600/30"
            />
            <StatCard
              title="Avg Rating"
              value={dashboardData.quizStats?.averageRating.toFixed(1)}
              icon={<StarIcon />}
              color="from-amber-600/30 to-yellow-600/30"
            />
            <StatCard
              title="Avg Duration"
              value={`${Math.round(
                dashboardData.quizStats.avgParticipantDuration / 60
              )} min`}
              icon={<TimerIcon />}
              color="from-emerald-600/30 to-green-600/30"
            />
          </motion.div>

          <motion.div
            className="bg-slate-800/80 rounded-2xl p-6 mb-12 border border-slate-700/50 shadow-lg shadow-slate-950/20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickAction
                icon={<AddIcon />}
                title="Create Quiz"
                link="/dashboard/create-quiz"
                color="bg-cyan-600/30 hover:bg-cyan-600/40 border-cyan-500/40"
              />
              <QuickAction
                icon={<AutoAwesomeIcon />}
                title="AI Generate"
                link="/dashboard/ai-generate"
                color="bg-purple-600/30 hover:bg-purple-600/40 border-purple-500/40"
              />
              <QuickAction
                icon={<ArrowForwardIcon />}
                title="Join Now"
                link="/activity/start-join"
                color="bg-cyan-600/50 hover:bg-cyan-600/70 border-cyan-500/50"
              />
              <QuickAction
                icon={<EqualizerIcon />}
                title="Analytics"
                link="/dashboard/analytics"
                color="bg-amber-600/30 hover:bg-amber-600/40 border-amber-500/40"
              />
            </div>
          </motion.div>
          {renderPlanBanner()}
          <div className="space-y-12">
            {dashboardData.sessions.scheduled.length > 0 && (
              <ScheduledSessions
                sessions={dashboardData.sessions.scheduled}
                users={users}
              />
            )}
            {dashboardData.sessions.hosted.length > 0 && (
              <SessionList
                title="Recently Hosted"
                sessions={dashboardData.sessions.hosted}
                type="hosted"
                viewAllLink="/dashboard/sessions/hosted"
                emptyMessage="You haven't hosted any sessions yet."
              />
            )}
            {dashboardData.sessions.participated.length > 0 && (
              <SessionList
                title="Recently Participated"
                sessions={dashboardData.sessions.participated}
                type="participated"
                viewAllLink="/dashboard/sessions/participated"
                emptyMessage="You haven't participated in any sessions yet."
              />
            )}
          </div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <DifficultyStats
              difficultyData={dashboardData.quizStats.byDifficulty}
            />
            <SubjectStats subjectData={dashboardData.quizStats.bySubject} />
          </motion.div>
        </>
      )}
      <ExploreQuizzes />
    </div>
  );
}

// Session Item with larger image and more details
const SessionItem = ({ session, type }) => (
  <motion.div variants={itemVariants} className="w-full">
    <Link
      to={
        type === "hosted"
          ? `/activity/host-result/${session._id}`
          : `/activity/user-result/${session._id}`
      }
    >
      <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/60 transition-all duration-300 hover:border-cyan-500/70 hover:bg-slate-800 group flex items-center gap-5">
        <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={session.image}
            alt={session.quizTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white truncate">
            {session.quizTitle}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatDistanceToNow(new Date(session.createdAt), {
              addSuffix: true,
            })}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
            <div className="flex items-center gap-1.5">
              <AssessmentIcon sx={{ fontSize: "1rem" }} />
              <span>{session.questionCount} Questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PeopleIcon sx={{ fontSize: "1rem" }} />
              <span>{session.participants || 0} Participants</span>
            </div>
          </div>
        </div>
        {type === "participated" && (
          <div className="text-center px-4">
            <p className="text-xs text-slate-400">Score</p>
            <p className="font-bold text-xl text-purple-300">
              {session.userScore ?? "N/A"}
            </p>
          </div>
        )}
        <ArrowForwardIcon className="text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  </motion.div>
);

// Scheduled Session as a Card
// Scheduled Session as a Card
const ScheduledSessionItem = ({ session, users }) => {
  const [countdown, setCountdown] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteMethod, setInviteMethod] = useState("email");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!session?.scheduleTime) return;
    const targetDate = new Date(session.scheduleTime);
    const intervalId = setInterval(() => {
      const now = new Date();
      if (now >= targetDate) {
        setCountdown("Starting now!");
        clearInterval(intervalId);
        return;
      }
      const duration = intervalToDuration({ start: now, end: targetDate });
      setCountdown(
        formatDuration(duration, {
          format: ["days", "hours", "minutes", "seconds"],
        })
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, [session.scheduleTime]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (inviteMethod === "email" && !inviteeEmail) {
      toast.error("Please enter an email address");
      return;
    }
    if (inviteMethod === "userId" && selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    try {
      const inviteLink = `${window.location.origin}/activity/start-join?code=${session?.code}`;
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/schedule/invite`,
        {
          sessionId: session._id,
          inviteeEmail: inviteMethod === "email" ? inviteeEmail : null,
          inviteeIds: inviteMethod === "userId" ? selectedUsers : [],
          inviteLink,
          quizTitle: session.quizTitle,
          inviteMethod,
        }
      );
      toast.success(`Invitation sent!`);
      setInviteModalOpen(false);
      setInviteeEmail("");
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send invitation");
    }
  };

  const copyInviteLink = (e) => {
    e.preventDefault();
    const inviteLink = `${window.location.origin}/lobby/${session._id}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      variants={itemVariants}
      className="bg-slate-800/70 rounded-2xl overflow-hidden border border-slate-700/60 flex flex-col h-full transition-all duration-300 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/10"
    >
      <div className="h-32 overflow-hidden">
        <img
          src={session.image}
          alt={session.quizTitle}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-white truncate">
          {session.quizTitle}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-amber-300 font-mono text-sm bg-black/20 px-2 py-1 rounded-md">
          <TimerIcon fontSize="small" />
          <span>{countdown || "..."}</span>
        </div>
        <div className="flex-grow" />
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <motion.button
            onClick={() => setInviteModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
          >
            <ShareIcon sx={{ fontSize: "1rem" }} />
            <span>Invite</span>
          </motion.button>
          <Link to={`/dashboard/quizzes/${session.quizId}`} className="w-full">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full h-full flex items-center justify-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <VisibilityIcon sx={{ fontSize: "1rem" }} />
              <span>View</span>
            </motion.div>
          </Link>
        </div>
      </div>
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700/50"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Invite to {session.quizTitle}
            </h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInviteMethod("email")}
                className={`flex-1 p-2 rounded-lg ${
                  inviteMethod === "email"
                    ? "bg-cyan-600/50 text-white"
                    : "bg-slate-700/50 text-slate-300"
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setInviteMethod("userId")}
                className={`flex-1 p-2 rounded-lg ${
                  inviteMethod === "userId"
                    ? "bg-cyan-600/50 text-white"
                    : "bg-slate-700/50 text-slate-300"
                }`}
              >
                User
              </button>
            </div>
            {inviteMethod === "email" ? (
              <input
                type="email"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
                placeholder="Enter invitee's email"
                className="w-full p-2 rounded-lg bg-slate-900/50 text-white border border-slate-600 focus:border-cyan-400 outline-none mb-4"
              />
            ) : (
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email"
                  className="w-full p-2 rounded-lg bg-slate-900/50 text-white border border-slate-600 focus:border-cyan-400 outline-none mb-4"
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg cursor-pointer hover:bg-slate-900/50"
                        onClick={() => toggleUserSelection(u._id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u._id)}
                          readOnly
                          className="w-4 h-4 text-cyan-400 bg-slate-700 border-slate-600 rounded"
                        />
                        <img
                          src={
                            u.picture ||
                            `https://api.dicebear.com/6.x/initials/svg?seed=${u.name
                              .charAt(0)
                              .toUpperCase()}&size=40`
                          }
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm text-white">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">No users found</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <motion.button
                onClick={handleInvite}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-cyan-600/50 hover:bg-cyan-600/70 text-white px-4 py-2 rounded-lg"
              >
                Send Invite
              </motion.button>
              <motion.button
                onClick={() => setInviteModalOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const ScheduledSessions = ({ sessions, users }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    <h2 className="text-2xl font-semibold text-white mb-4 border-l-4 border-amber-400 pl-4">
      Upcoming Sessions
    </h2>
    {sessions.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <ScheduledSessionItem
            key={session._id}
            session={session}
            users={users}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-10 bg-slate-800/50 rounded-2xl">
        <CalendarIcon className="text-slate-500 text-4xl mx-auto" />
        <p className="mt-2 text-slate-400">No upcoming sessions.</p>
      </div>
    )}
  </motion.div>
);

const SessionList = ({ title, sessions, type, viewAllLink, emptyMessage }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    <div className="flex justify-between items-center mb-4">
      <h2
        className={`text-2xl font-semibold text-white border-l-4 ${
          type === "hosted" ? "border-cyan-400" : "border-purple-400"
        } pl-4`}
      >
        {title}
      </h2>
      {sessions.length > 8 && (
        <Link
          to={viewAllLink}
          className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          View All
        </Link>
      )}
    </div>
    {sessions.length > 0 ? (
      <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
        {sessions.slice(0, 8).map((session) => (
          <SessionItem key={session._id} session={session} type={type} />
        ))}
      </div>
    ) : (
      <div className="text-center py-10 bg-slate-800/50 rounded-2xl">
        <PeopleIcon className="text-slate-500 text-4xl mx-auto" />
        <p className="mt-2 text-slate-400">{emptyMessage}</p>
      </div>
    )}
  </motion.div>
);

// Unchanged Utility Components
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    className={`bg-gradient-to-br ${color} rounded-2xl p-5 border border-slate-700/50 shadow-lg shadow-slate-950/20 hover:shadow-cyan-500/20 transition-all duration-300`}
    variants={itemVariants}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-300 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className="p-3 bg-white/10 rounded-xl">
        {React.cloneElement(icon, { className: "text-white text-2xl" })}
      </div>
    </div>
  </motion.div>
);

const QuickAction = ({ icon, title, link, color }) => (
  <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Link
      to={link}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border ${color} transition-all duration-300 shadow-sm hover:shadow-cyan-500/20 h-full`}
    >
      <div className="p-3 bg-white/10 rounded-full mb-2">
        {React.cloneElement(icon, { className: "text-white text-xl" })}
      </div>
      <span className="text-sm text-white font-medium text-center">
        {title}
      </span>
    </Link>
  </motion.div>
);

const DifficultyStats = ({ difficultyData }) => (
  <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 shadow-lg shadow-slate-950/20">
    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
      <TrophyIcon className="text-amber-400" /> Quiz Difficulty
    </h3>
    <div className="grid grid-cols-3 gap-4">
      {difficultyData.map((item) => (
        <motion.div
          key={item._id}
          className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-600/50"
          whileHover={{ scale: 1.05 }}
        >
          <div
            className={`text-2xl font-bold ${
              item._id === "easy"
                ? "text-green-400"
                : item._id === "medium"
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {item.count}
          </div>
          <div className="text-sm text-slate-300 capitalize">{item._id}</div>
        </motion.div>
      ))}
    </div>
  </div>
);

const SubjectStats = ({ subjectData }) => (
  <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 shadow-lg shadow-slate-950/20">
    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
      <AssessmentIcon className="text-cyan-400" /> Quiz Subjects
    </h3>
    <div className="flex flex-wrap gap-3">
      {subjectData.length > 0 ? (
        subjectData.map((item) => (
          <motion.div
            key={item._id}
            className="px-4 py-2 bg-slate-900/50 rounded-full text-sm text-slate-300 border border-slate-600/50"
            whileHover={{ scale: 1.05 }}
          >
            {item._id}{" "}
            <span className="text-cyan-400 font-medium">{item.count}</span>
          </motion.div>
        ))
      ) : (
        <p className="text-slate-400 text-sm">No subject data available.</p>
      )}
    </div>
  </div>
);
