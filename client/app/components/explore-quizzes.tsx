import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";
import CategoryIcon from "@mui/icons-material/Category";
import HelpOutline from "@mui/icons-material/HelpOutline";
import { containerVariants, itemVariants } from "./constants";

const QuizCard = ({ quiz, imageUrl }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/dashboard/explore-quiz/${quiz.id}`, { state: { quiz } });
  };

  return (
    <motion.div variants={itemVariants} className="w-full">
      <motion.div
        onClick={handleCardClick}
        className="cursor-pointer"
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
    </motion.div>
  );
};

export default function ExploreQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchAndProcessQuizzes = async () => {
      setLoading(true);
      try {
        const categories = [
          "arts_and_literature",
          "film_and_tv",
          "food_and_drink",
          "general_knowledge",
          "geography",
          "history",
          "music",
          "science",
          "society_and_culture",
          "sport_and_leisure",
        ];

        const quizPromises = categories.map((category) =>
          axios.get(
            `https://the-trivia-api.com/v2/questions?limit=100&categories=${category}`
          )
        );

        const responses = await Promise.all(quizPromises);
        const allQuestions = responses.flatMap((response) => response.data);

        const groupedQuizzes = groupQuestionsIntoQuizzes(allQuestions);
        setQuizzes(groupedQuizzes);
      } catch (error) {
        console.error("Failed to fetch trivia quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessQuizzes();
  }, []);

  useEffect(() => {
    if (quizzes.length > 0) {
      const fetchImagesForCategories = async () => {
        const uniqueCategories = [...new Set(quizzes.map((q) => q.subject))];
        const imagePromises = uniqueCategories.map((category) => {
          return axios.get(`https://api.unsplash.com/search/photos`, {
            headers: {
              Authorization: `Client-ID ${import.meta.env.VITE_UNSPLASH_KEY}`,
            },
            params: {
              query: category,
              per_page: 10,
              orientation: "landscape",
            },
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
  }, [quizzes]);

  const quizWithImages = useMemo(() => {
    const categoryCounts = {};
    return quizzes.map((quiz) => {
      let imageUrl = "";
      if (imagesByCategory[quiz.subject]?.length > 0) {
        const imageIndex = categoryCounts[quiz.subject] || 0;
        imageUrl =
          imagesByCategory[quiz.subject][
            imageIndex % imagesByCategory[quiz.subject].length
          ];
        categoryCounts[quiz.subject] = imageIndex + 1;
      }
      return { ...quiz, coverImage: imageUrl };
    });
  }, [quizzes, imagesByCategory]);

  const filteredQuizzes = quizWithImages.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-3xl font-bold text-white">Explore Quizzes</h2>
        <div className="mx-auto max-w-lg">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
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
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} imageUrl={quiz.coverImage} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
