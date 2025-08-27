import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { containerVariants, itemVariants } from "~/components/constants";
import { useSelector } from "react-redux";

// Corrected Material-UI Icon Imports
import BackIcon from "@mui/icons-material/ArrowBack";
import HelpOutline from "@mui/icons-material/HelpOutline";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import CategoryIcon from "@mui/icons-material/Category";

const SimilarQuizCard = ({ quiz, imageUrl }) => {
  const navigate = useNavigate();
  const handleCardClick = () => {
    navigate(`/dashboard/explore-quiz/${quiz.id}`, { state: { quiz } });
    window.scrollTo(0, 0);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="w-full cursor-pointer"
      onClick={handleCardClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="group relative h-64 w-full overflow-hidden rounded-2xl shadow-lg">
        <img
          src={
            imageUrl ||
            `https://via.placeholder.com/400x300.png?text=${quiz.subject}`
          }
          alt={quiz.subject}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
          <div className="mb-2 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm self-start">
            <CategoryIcon sx={{ fontSize: "1rem" }} />
            <span>{quiz.subject}</span>
          </div>
          <h3 className="font-bold text-lg">{quiz.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <HelpOutline sx={{ fontSize: "0.8rem" }} />
            {quiz.questions.length} Questions
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function QuizDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz } = location.state || {};
  const user = useSelector((state) => state.reducer.currentUser);
  const [similarQuizzes, setSimilarQuizzes] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quiz) {
      const fetchSimilar = async () => {
        try {
          const response = await axios.get(
            `https://the-trivia-api.com/v2/questions?limit=80&categories=${quiz.subject}`
          );
          const groupedQuizzes = groupQuestionsIntoQuizzes(response.data);
          setSimilarQuizzes(
            groupedQuizzes.filter((q) => q.id !== quiz.id).slice(0, 8)
          );
        } catch (error) {
          console.error("Failed to fetch similar quizzes", error);
        }
      };
      fetchSimilar();
    }
  }, [quiz]);

  useEffect(() => {
    if (similarQuizzes.length > 0) {
      const fetchImagesForCategories = async () => {
        const uniqueCategories = [
          ...new Set(similarQuizzes.map((q) => q.subject)),
        ];
        const imagePromises = uniqueCategories.map((category) => {
          return axios.get(`https://api.unsplash.com/search/photos`, {
            headers: {
              Authorization: `Client-ID ${import.meta.env.VITE_UNSPLASH_KEY}`,
            },
            params: { query: category, per_page: 10, orientation: "landscape" },
          });
        });
        try {
          const responses = await Promise.all(imagePromises);
          const categoryImageMap = {};
          responses.forEach((response, index) => {
            const category = uniqueCategories[index];
            categoryImageMap[category] = response.data.results.map(
              (img) => img.urls.regular
            );
          });
          setImagesByCategory(categoryImageMap);
        } catch (error) {
          console.error("Failed to fetch images from Unsplash:", error);
        }
      };
      fetchImagesForCategories();
    }
  }, [similarQuizzes]);

  const groupQuestionsIntoQuizzes = (questions) => {
    const quizzesByCategory = {};
    const quizzes = [];
    const questionsPerQuiz = 10;

    questions.forEach((q) => {
      const category = q.category;
      if (!quizzesByCategory[category]) quizzesByCategory[category] = [];
      quizzesByCategory[category].push(q);
    });

    for (const category in quizzesByCategory) {
      const categoryQuestions = quizzesByCategory[category];
      for (let i = 0; i < categoryQuestions.length; i += questionsPerQuiz) {
        const chunk = categoryQuestions.slice(i, i + questionsPerQuiz);
        if (chunk.length > 0) {
          const commonWords = chunk
            .flatMap((q) => q.question.text.split(" "))
            .map((word) => word.toLowerCase().replace(/[^a-z]/g, ""))
            .filter(
              (word) =>
                word.length > 3 &&
                !["what", "which", "who", "the", "and"].includes(word)
            );

          const wordCounts = commonWords.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
          }, {});

          const sortedWords = Object.keys(wordCounts).sort(
            (a, b) => wordCounts[b] - wordCounts[a]
          );
          const topTwoWords = sortedWords
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" & ");

          const newTitle = topTwoWords
            ? `${topTwoWords} - ${category}`
            : `${category} Challenge #${i / questionsPerQuiz + 1}`;

          quizzes.push({
            id: `${category.replace(/[\s&]+/g, "-").toLowerCase()}-${i}`,
            title: newTitle,
            description: `Test your knowledge in the ${category} category!`,
            subject: category,
            difficulty: "mixed",
            questions: chunk.map((q) => {
              const options = [...q.incorrectAnswers, q.correctAnswer].sort(
                () => Math.random() - 0.5
              );
              const correctIndex = options.indexOf(q.correctAnswer);
              return {
                _id: q.id,
                question: q.question.text,
                type: "multiple-choice",
                options: options,
                correctAnswer: correctIndex,
                explanation: "Explanation not available for this question.",
              };
            }),
            coverImage: "",
          });
        }
      }
    }
    return quizzes;
  };

  const similarQuizzesWithImages = useMemo(() => {
    const categoryCounts = {};
    return similarQuizzes.map((q) => {
      let imageUrl = "";
      if (imagesByCategory[q.subject]?.length > 0) {
        const imageIndex = categoryCounts[q.subject] || 0;
        imageUrl =
          imagesByCategory[q.subject][
            imageIndex % imagesByCategory[q.subject].length
          ];
        categoryCounts[q.subject] = imageIndex + 1;
      }
      return { ...q, coverImage: imageUrl };
    });
  }, [similarQuizzes, imagesByCategory]);

  const handleSaveQuiz = async () => {
    if (!user) {
      toast.error("You must be logged in to save a quiz.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/save-explored`,
        {
          quizData: quiz,
          userId: user._id,
        }
      );
      if (response.data) {
        toast.success("Quiz saved to your collection!");
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

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <h2 className="text-2xl">Quiz not found</h2>
        <Link to="/dashboard" className="mt-4 text-cyan-400">
          Go back to Dashboard
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
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-cyan-400 transition-colors hover:text-cyan-300"
          >
            <BackIcon />
            <span>Back to Dashboard</span>
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
                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                  <span className="bg-slate-700/50 px-3 py-1 rounded-full">
                    {quiz.subject}
                  </span>
                  <span className="capitalize bg-slate-700/50 px-3 py-1 rounded-full">
                    {quiz.difficulty}
                  </span>
                  <span className="bg-slate-700/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <HelpOutline sx={{ fontSize: "1rem" }} />
                    {quiz.questions.length} Questions
                  </span>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                  <motion.button
                    onClick={() => handleSaveQuiz()}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SaveIcon /> {isSaving ? "Saving..." : "Save to My Quizzes"}
                  </motion.button>
                  <motion.button
                    onClick={() => handleEditQuiz()}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <EditIcon /> Save & Edit
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
              <div className="space-y-4">
                {quiz.questions.map((q, index) => (
                  <motion.div
                    key={q._id}
                    variants={itemVariants}
                    className="bg-slate-800/60 p-5 rounded-lg border border-slate-700"
                  >
                    <p className="font-semibold text-lg text-slate-100">
                      {index + 1}. {q.question}
                    </p>
                    <ul className="mt-3 space-y-2 text-slate-300">
                      {q.options.map((opt, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-3 p-2 rounded-md ${
                            i === q.correctAnswer
                              ? "bg-green-500/10 text-green-300 font-medium"
                              : ""
                          }`}
                        >
                          <span>•</span>
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </main>
        </div>

        {similarQuizzesWithImages.length > 0 && (
          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Similar Quizzes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarQuizzesWithImages.map((similarQuiz) => (
                <SimilarQuizCard
                  key={similarQuiz.id}
                  quiz={similarQuiz}
                  imageUrl={similarQuiz.coverImage}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
