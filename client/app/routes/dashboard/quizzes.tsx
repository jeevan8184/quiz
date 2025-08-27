import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  containerVariants,
  itemVariants,
  type Quiz,
} from "~/components/constants";

// Corrected Material-UI Icon Imports
import ViewIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayIcon from "@mui/icons-material/PlayArrow";
import FilterIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import GridIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/List";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const QuizzesPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [quizzesPerPage] = useState<number>(9);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const user = useSelector((state: any) => state.reducer.currentUser);

  const fetchQuizzes = async () => {
    if (!user?._id) {
      setError("User not authenticated");
      toast.error("Please log in to view quizzes");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz`,
        {
          params: { userId: user._id },
        }
      );
      if (response.data) {
        console.log("response : ", response);
        const quizzes = response.data.quizzes || [];
        setQuizzes(quizzes);
        toast.success(
          quizzes.length === 0
            ? "No quizzes available"
            : "Quizzes loaded successfully"
        );
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to fetch quizzes";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchQuizzes();
    }
  }, [user]);

  const filteredQuizzes = quizzes
    .filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(search.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((quiz) => filterSubject === "all" || quiz.subject === filterSubject)
    .filter(
      (quiz) =>
        filterDifficulty === "all" || quiz.difficulty === filterDifficulty
    )
    .filter(
      (quiz) =>
        filterType === "all" ||
        (filterType === "ai" ? quiz.isAICreated : !quiz.isAICreated)
    )
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "title") {
        return multiplier * a.title.localeCompare(b.title);
      } else if (sortBy === "createdAt") {
        return (
          multiplier *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      } else if (sortBy === "difficulty") {
        const order = ["easy", "intermediate", "hard"];
        return (
          multiplier *
          (order.indexOf(a.difficulty) - order.indexOf(b.difficulty))
        );
      }
      return 0;
    });

  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = filteredQuizzes.slice(
    indexOfFirstQuiz,
    indexOfLastQuiz
  );
  const totalPages = Math.ceil(filteredQuizzes.length / quizzesPerPage);

  const handleDelete = (quizId: string) => {
    setQuizToDelete(quizId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/${quizToDelete}`,
        {
          params: { userId: user._id },
        }
      );
      setQuizzes(quizzes.filter((quiz) => quiz._id !== quizToDelete));
      toast.success("Quiz deleted successfully!");
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to delete quiz";
      toast.error(message);
    } finally {
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuizToDelete(null);
  };

  const subjects = ["all", ...new Set(quizzes.map((quiz) => quiz.subject))];
  const difficulties = ["all", "easy", "intermediate", "hard"];

  return (
    <motion.div
      className="min-h-screen flex flex-col font-inter p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
          <motion.h1
            className="text-2xl sm:text-4xl font-bold text-cyan-300 tracking-wide"
            variants={itemVariants}
          >
            Your Quiz Dashboard
          </motion.h1>
          <motion.button
            onClick={() => navigate("/dashboard/create-quiz")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-cyan-600/30 text-cyan-300 rounded-lg hover:bg-cyan-600/40 transition-all duration-200 border border-cyan-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] w-full sm:w-auto"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <AddIcon className="w-5 h-5" />
            <span>Create Quiz</span>
          </motion.button>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <motion.div
            className="flex justify-center items-center h-64"
            variants={itemVariants}
          >
            <motion.div
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
        {error && (
          <motion.div
            className="text-red-400 bg-red-500/10 rounded-lg p-4 mb-6 border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
            variants={itemVariants}
          >
            {error}
            <button
              onClick={fetchQuizzes}
              className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Retry Loading
            </button>
          </motion.div>
        )}

        {/* Filters and Search */}
        {!loading && !error && (
          <motion.div className="mb-6" variants={itemVariants}>
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/30 text-gray-300 rounded-lg hover:bg-gray-600/40 transition-all duration-200 border border-gray-500/30 hover:-translate-y-0.5 w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FilterIcon className="w-5 h-5" />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              <ExpandMoreIcon
                className={`w-5 h-5 transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </motion.button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:ring-2 hover:ring-cyan-500/50 transition-all duration-200"
                    />
                  </div>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                  >
                    {subjects.map((subject) => (
                      <option
                        key={subject}
                        value={subject}
                        className="text-cyan-300 bg-black"
                      >
                        {subject === "all" ? "All Subjects" : subject}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                  >
                    {difficulties.map((difficulty) => (
                      <option
                        key={difficulty}
                        value={difficulty}
                        className="text-cyan-300 bg-black"
                      >
                        {difficulty === "all"
                          ? "All Difficulties"
                          : difficulty.charAt(0).toUpperCase() +
                            difficulty.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                  >
                    <option value="all" className="text-cyan-300 bg-black">
                      All Types
                    </option>
                    <option value="ai" className="text-cyan-300 bg-black">
                      AI-Generated
                    </option>
                    <option value="manual" className="text-cyan-300 bg-black">
                      Manual
                    </option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                  >
                    <option value="title" className="text-cyan-300 bg-black">
                      Sort by Title
                    </option>
                    <option
                      value="createdAt"
                      className="text-cyan-300 bg-black"
                    >
                      Sort by Date
                    </option>
                    <option
                      value="difficulty"
                      className="text-cyan-300 bg-black"
                    >
                      Sort by Difficulty
                    </option>
                  </select>
                  <motion.button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-cyan-500/20 to-cyan-600/30 text-cyan-300 rounded-lg hover:bg-cyan-600/40 transition-all duration-200 border border-cyan-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FilterIcon className="w-5 h-5" />
                    <span>{sortOrder === "asc" ? "Asc" : "Desc"}</span>
                  </motion.button>
                  <motion.button
                    onClick={() =>
                      setViewMode(viewMode === "grid" ? "list" : "grid")
                    }
                    className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-gray-500/20 to-gray-600/30 text-gray-300 rounded-lg hover:bg-gray-600/40 transition-all duration-200 border border-gray-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
          </motion.div>
        )}

        {/* Quiz List */}
        {!loading && !error && (
          <motion.div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
            variants={containerVariants}
          >
            {currentQuizzes.length === 0 && (
              <motion.p
                className="text-gray-300 text-center text-sm"
                variants={itemVariants}
              >
                No quizzes found. Create one to get started!
              </motion.p>
            )}
            <AnimatePresence>
              {currentQuizzes.map((quiz) => (
                <motion.div
                  key={quiz._id}
                  className={
                    viewMode === "grid"
                      ? "bg-gradient-to-br from-gray-900 to-cyan-900/20 border border-cyan-500/50 rounded-2xl p-4 backdrop-blur-sm shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:scale-102 transition-all duration-200"
                      : "bg-gradient-to-br from-gray-900 to-cyan-900/20 border border-cyan-500/50 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:scale-102 transition-all duration-200"
                  }
                  variants={itemVariants}
                >
                  {viewMode === "grid" ? (
                    <>
                      <div className="relative rounded-xl overflow-hidden mb-4">
                        <img
                          src={quiz.coverImage}
                          alt={quiz.title}
                          className="w-full h-40 object-cover transition-transform duration-300 hover:scale-105 animate-pulse"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg")
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute bottom-3 left-3 bg-cyan-500/90 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                          {quiz.difficulty}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-cyan-300 mb-2">
                        {quiz.title}
                      </h2>
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-gray-300 text-sm">
                            Subject:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.subject}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-gray-300 text-sm">
                            Questions:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.questions.length}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-gray-300 text-sm">
                            Created:{" "}
                            <span className="text-cyan-300 font-medium">
                              {format(new Date(quiz.createdAt), "MM/dd/yyyy")}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-gray-300 text-sm">
                            Type:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.isAICreated ? "AI-Generated" : "Manual"}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-gray-300 text-sm">
                            Attempts:{" "}
                            <span className="text-cyan-300 font-medium">
                              42
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-gray-300 text-sm">
                            Avg. Score:{" "}
                            <span className="text-cyan-300 font-medium">
                              78%
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <motion.button
                          onClick={() =>
                            navigate(`/dashboard/quizzes/${quiz._id}`)
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/30 text-blue-300 rounded-lg hover:bg-blue-600/40 transition-all duration-200 border border-blue-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ViewIcon className="w-4 h-4" />
                          <span>View</span>
                        </motion.button>
                        <motion.button
                          onClick={() =>
                            navigate(`/dashboard/edit-quiz/${quiz._id}`)
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/30 text-yellow-300 rounded-lg hover:bg-yellow-600/40 transition-all duration-200 border border-yellow-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <EditIcon className="w-4 h-4" />
                          <span>Edit</span>
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(quiz._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/30 text-red-300 rounded-lg hover:bg-red-600/40 transition-all duration-200 border border-red-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <DeleteIcon className="w-4 h-4" />
                          <span>Delete</span>
                        </motion.button>
                        {/* <motion.button
                          onClick={() =>
                            navigate(`/dashboard/quizzes/${quiz._id}/start`)
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/30 text-emerald-300 rounded-lg hover:bg-emerald-600/40 transition-all duration-200 border border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <PlayArrowIcon className="w-4 h-4" />
                          <span>Start</span>
                        </motion.button> */}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 w-full">
                        <div className="relative rounded-xl overflow-hidden w-full sm:w-40 h-40 sm:h-40">
                          <img
                            src={quiz.coverImage}
                            alt={quiz.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 animate-pulse"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg")
                            }
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <span className="absolute bottom-1 left-1 bg-cyan-500/90 text-white px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">
                            {quiz.difficulty}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1">
                          <h2 className="text-lg font-semibold text-cyan-300">
                            {quiz.title}
                          </h2>
                          <p className="text-gray-300 text-sm">
                            Subject:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.subject}
                            </span>{" "}
                            | Difficulty:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.difficulty}
                            </span>
                          </p>
                          <p className="text-gray-300 text-sm">
                            Questions:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.questions.length}
                            </span>{" "}
                            | Created:{" "}
                            <span className="text-cyan-300 font-medium">
                              {format(new Date(quiz.createdAt), "MM/dd/yyyy")}
                            </span>
                          </p>
                          <p className="text-gray-300 text-sm">
                            Type:{" "}
                            <span className="text-cyan-300 font-medium">
                              {quiz.isAICreated ? "AI-Generated" : "Manual"}
                            </span>
                          </p>
                          <p className="text-gray-300 text-sm">
                            Attempts:{" "}
                            <span className="text-cyan-300 font-medium">
                              42
                            </span>{" "}
                            | Avg. Score:{" "}
                            <span className="text-cyan-300 font-medium">
                              78%
                            </span>
                          </p>
                        </div>

                        <div className="flex gap-2 sm:flex-col sm:items-end">
                          <motion.button
                            onClick={() =>
                              navigate(`/dashboard/quizzes/${quiz._id}`)
                            }
                            className="p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/30 text-blue-300 rounded-lg hover:bg-blue-600/40 transition-all duration-200 border border-blue-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ViewIcon className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() =>
                              navigate(`/dashboard/edit-quiz/${quiz._id}`)
                            }
                            className="p-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/30 text-yellow-300 rounded-lg hover:bg-yellow-600/40 transition-all duration-200 border border-yellow-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <EditIcon className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(quiz._id)}
                            className="p-2 bg-gradient-to-r from-red-500/20 to-red-600/30 text-red-300 rounded-lg hover:bg-red-600/40 transition-all duration-200 border border-red-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() =>
                              navigate(`/dashboard/quizzes/${quiz._id}/start`)
                            }
                            className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/30 text-emerald-300 rounded-lg hover:bg-emerald-600/40 transition-all duration-200 border border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PlayArrowIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredQuizzes.length > 0 && (
          <motion.div
            className="flex justify-center gap-4 mt-6"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 ${
                currentPage === 1
                  ? "bg-gradient-to-r from-gray-500/20 to-gray-600/30 text-gray-300 border-gray-500/30"
                  : "bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 text-cyan-200 border-cyan-500/30 hover:bg-cyan-600/40"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>

            <span className="py-2 text-cyan-300">
              Page {currentPage} of {totalPages}
            </span>

            <motion.button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 ${
                currentPage === totalPages
                  ? "bg-gradient-to-r from-gray-500/20 to-gray-600/30 text-gray-300 border-gray-500/30"
                  : "bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 text-cyan-200 border-cyan-500/30 hover:bg-cyan-600/40"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          PaperProps={{
            style: {
              background:
                "linear-gradient(145deg, rgba(15, 12, 41, 0.95), rgba(25, 20, 60, 0.95))",
              backdropFilter: "blur(12px)",
              color: "#e0f2fe",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0, 255, 255, 0.2)",
              border: "1px solid rgba(0, 255, 255, 0.25)",
              padding: 10,
            },
          }}
        >
          <DialogTitle className="text-xl font-semibold text-cyan-300 border-b border-cyan-500/30 pb-3">
            Confirm Delete
          </DialogTitle>
          <DialogContent className="pt-6">
            <DialogContentText
              className="text-gray-200 text-base"
              style={{ color: "#e0f2fe", padding: 30 }}
            >
              Are you sure you want to delete this quiz? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions className="flex justify-end gap-2 pt-4">
            <button
              onClick={handleDeleteCancel}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default QuizzesPage;
