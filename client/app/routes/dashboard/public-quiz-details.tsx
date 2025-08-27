import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { containerVariants, itemVariants } from "~/components/constants";
import { useSelector } from "react-redux";

// Corrected Material-UI Icon Imports
import BackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Save from "@mui/icons-material/Save";
import Edit from "@mui/icons-material/Edit";

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
  if (!options || options.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((option, index) => {
        const isCorrect =
          type === "multiple-choice"
            ? index === correctAnswer
            : option === correctAnswer;
        const isObject = typeof option === "object" && option !== null;
        const optionText = isObject ? option.description : String(option);
        const optionImage = isObject ? option.url : null;

        return (
          <div
            key={index}
            className={`p-3 rounded-lg flex items-center gap-3 border ${
              isCorrect
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-slate-800/50 border-slate-700"
            }`}
          >
            {optionImage && (
              <img
                src={optionImage}
                alt={optionText || "Option"}
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            {optionText && (
              <span className="text-sm text-slate-200 flex-1">
                {optionText}
              </span>
            )}
            {isCorrect && (
              <CheckCircleIcon className="text-cyan-400" fontSize="small" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function PublicQuizDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.reducer.currentUser);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quiz/public/${id}`
        );
        setQuiz(response.data);
      } catch (error) {
        toast.error("Could not load the quiz.");
        navigate("/dashboard/community");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleSaveQuiz = async () => {
    if (!user) {
      toast.error("You must be logged in to save a quiz.");
      return;
    }
    setIsSaving(true);
    try {
      const { _id, ...quizDataToSend } = quiz;

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/save-explored`,
        {
          quizData: quizDataToSend,
          userId: user._id,
        }
      );
      if (response.data) {
        toast.success("Quiz saved to your library!");
        const newQuizId = response.data.quiz._id;
        navigate(`/dashboard/quizzes/${newQuizId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuiz = () => {
    navigate("/dashboard/create-quiz", { state: { quiz } });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c29]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-cyan-400 border-r-transparent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0f0c29]">
        <h2 className="text-2xl">Quiz not found</h2>
        <Link to="/dashboard/community" className="mt-4 text-cyan-400">
          Back to Community Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/dashboard/community"
            className="mb-6 inline-flex items-center gap-2 text-cyan-400 transition-colors hover:text-cyan-300"
          >
            <BackIcon />
            <span>Back to Community Quizzes</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="sticky top-24 bg-slate-900/50 rounded-2xl border border-slate-700"
            >
              <img
                src={quiz.coverImage}
                alt={quiz.title}
                className="w-full h-56 object-cover rounded-t-2xl"
              />
              <div className="p-6">
                <h1 className="text-3xl font-bold text-cyan-300">
                  {quiz.title}
                </h1>
                <p className="text-slate-300 mt-2 text-sm">
                  {quiz.description}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-3">
                  <img
                    src={quiz.userId.picture}
                    alt={quiz.userId.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs text-slate-400">Created by</p>
                    <p className="font-semibold text-white">
                      {quiz.userId.name}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                  <motion.button
                    onClick={() => handleSaveQuiz()}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save /> {isSaving ? "Saving..." : "Save to My Quizzes"}
                  </motion.button>
                  <motion.button
                    onClick={() => handleEditQuiz()}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit /> Save & Edit
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </aside>

          <main className="lg:col-span-2">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-3xl font-bold mb-4">Questions</h2>
              <div className="space-y-6">
                {quiz.questions.map((q, index) => (
                  <motion.div
                    key={q._id}
                    variants={itemVariants}
                    className="bg-slate-800/60 p-5 rounded-lg border border-slate-700"
                  >
                    <p className="font-semibold text-lg text-slate-100">
                      {index + 1}. {q.question}
                    </p>
                    {q.content &&
                      q.content.map((c, i) => (
                        <div key={i}>{renderContent(c)}</div>
                      ))}
                    <div className="mt-4">
                      {renderOptions(q.options, q.type, q.correctAnswer)}
                    </div>
                    {(q.showCorrectAnswers || q.showExplanations) && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs space-y-2">
                        <p className="text-slate-400">
                          Correct Answer:{" "}
                          <span className="font-semibold text-green-400 bg-green-900/30 px-2 py-1 rounded-md">
                            {(() => {
                              if (q.type !== "multiple-choice")
                                return String(q.correctAnswer);
                              const correctOpt = q.options[q.correctAnswer];
                              if (
                                typeof correctOpt === "object" &&
                                correctOpt !== null
                              ) {
                                return (
                                  correctOpt.description ||
                                  `Option #${q.correctAnswer + 1}`
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
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
