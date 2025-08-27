import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { containerVariants, itemVariants } from "~/components/constants";
import { useSelector } from "react-redux";

// Corrected Material-UI Icon Imports
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const QuizCard = ({ quiz }) => {
  const user = useSelector((state) => state.reducer.currentUser);

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Link
        to={
          quiz.userId._id === user._id
            ? `/dashboard/quizzes/${quiz._id}`
            : `/dashboard/public-quiz/${quiz._id}`
        }
      >
        <div className="group relative h-64 w-full overflow-hidden rounded-2xl shadow-lg border border-slate-700/50 transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/10 hover:-translate-y-1">
          <img
            src={quiz.coverImage}
            alt={quiz.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
            <div className="flex justify-end">
              <div className="flex items-center gap-2 rounded-full bg-black/30 p-1 pr-2 text-xs backdrop-blur-sm">
                <img
                  src={quiz.userId.picture}
                  alt={quiz.userId.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span>{quiz.userId.name}</span>
              </div>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg">{quiz.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                <HelpOutlineIcon sx={{ fontSize: "0.8rem" }} />
                {quiz.questions.length} Questions
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function CommunityQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicQuizzes = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quiz/public`
        );
        setQuizzes(response.data);
      } catch (error) {
        console.error("Failed to fetch public quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <PeopleIcon sx={{ fontSize: "2.5rem" }} />
          Community Quizzes
        </h1>
        <p className="mt-2 text-slate-400">
          Explore quizzes created by other users.
        </p>
        <div className="relative mt-6 mx-auto max-w-lg">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for quizzes by title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-cyan-400 border-r-transparent" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
