import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  type Question,
  type Quiz,
  type Content,
} from "~/components/constants";
import QuestionEditor from "~/components/question-editor";
import axios from "axios";
import toast from "react-hot-toast";

// Corrected Material-UI Icon Imports
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import TextIcon from "@mui/icons-material/TextFormat";
import VideoIcon from "@mui/icons-material/VideoLibrary";
import AudioIcon from "@mui/icons-material/AudioFile";

interface UnsplashImage {
  id: string;
  urls: { small: string };
}

interface QuizQuestionsEditorProps {
  quiz: Quiz;
  setQuiz: React.Dispatch<React.SetStateAction<Quiz>>;
  questionTypes: { value: string; label: string }[];
  addNewQuestion: () => void;
  updateQuestion: (index: number, field: string, value: any) => void;
  updateQuestionOption: (
    questionIndex: number,
    optionIndex: number,
    value:
      | string
      | { type: "image"; url: string; file: File; description: string }
  ) => void;
  deleteQuestion: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setError: (error: string) => void;
}

export default function QuizQuestionsEditor({
  quiz,
  setQuiz,
  questionTypes,
  addNewQuestion,
  updateQuestion,
  updateQuestionOption,
  deleteQuestion,
  nextStep,
  prevStep,
  setError,
}: QuizQuestionsEditorProps) {
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [gifsImages, setGifsImages] = useState([]);
  const [page, setPage] = useState({
    imgPage: 1,
    gifPage: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState({
    imgQuery: "",
    gifQuery: "",
  });

  const fetchGifsImages = async (
    pageNum: number,
    query: string = "",
    append: boolean = false
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const limit = 30;
      const offset = (pageNum - 1) * limit;
      const endpoint = query
        ? "https://api.giphy.com/v1/gifs/search"
        : "https://api.giphy.com/v1/gifs/trending";
      const response = await axios.get(endpoint, {
        params: {
          api_key: import.meta.env.VITE_GIFS_KEY,
          q: query || undefined,
          limit,
          offset,
        },
      });
      const gifs = response.data.data.map((gif: any) => ({
        id: gif.id,
        urls: { small: gif.images.fixed_height.url },
      }));
      setGifsImages((prev) => (append ? [...prev, ...gifs] : gifs));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load GIFs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnsplashImages = async (
    pageNum: number,
    query: string = "",
    append: boolean = false
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const endpoint = query
        ? "https://api.unsplash.com/search/photos"
        : "https://api.unsplash.com/photos";
      const response = await axios.get(endpoint, {
        params: {
          page: pageNum,
          per_page: 30,
          ...(query && { query }),
        },
        headers: {
          Authorization: `Client-ID ${import.meta.env.VITE_UNSPLASH_KEY}`,
        },
      });
      const images = (query ? response.data.results : response.data).map(
        (img: any) => ({
          id: img.id,
          urls: { small: img.urls.small },
        })
      );
      setUnsplashImages((prev) => (append ? [...prev, ...images] : images));
    } catch (error) {
      console.error("Failed to fetch Unsplash images:", error);
      toast.error("Failed to load Unsplash images. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreImages = (query: string = "") => {
    if (query !== currentQuery.imgQuery) {
      setCurrentQuery((prev) => ({ ...prev, imgQuery: query }));
      setPage((prev) => ({ ...prev, imgPage: 1 }));
      fetchUnsplashImages(1, query);
    } else {
      setPage((prev) => ({ ...prev, imgPage: prev.imgPage + 1 }));
      fetchUnsplashImages(page.imgPage + 1, query, true);
    }
  };

  const loadMoreGifs = (query: string = "") => {
    if (query !== currentQuery.gifQuery) {
      setCurrentQuery((prev) => ({ ...prev, gifQuery: query }));
      setPage((prev) => ({ ...prev, gifPage: 1 }));
      fetchGifsImages(1, query);
    } else {
      setPage((prev) => ({ ...prev, gifPage: prev.gifPage + 1 }));
      fetchGifsImages(page.gifPage + 1, query, true);
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_UNSPLASH_KEY) {
      fetchUnsplashImages(1);
      fetchGifsImages(1);
    } else {
      console.error("Unsplash API key is not set.");
      toast.error("Unsplash API key is missing. Contact the administrator.");
    }
  }, []);

  return (
    <motion.div
      className="bg-black/20 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-between mb-4"
        variants={itemVariants}
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          Create Questions
        </h2>
        <button
          onClick={addNewQuestion}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center mt-2 sm:mt-0"
        >
          <AddIcon className="mr-2 text-sm" />
          Add Question
        </button>
      </motion.div>
      <motion.div className="space-y-4" variants={itemVariants}>
        {quiz.questions.length === 0 && (
          <p className="text-gray-400 text-center text-sm">
            No questions added yet. Click "Add Question" to start.
          </p>
        )}
        {quiz.questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            deleteQuestion={deleteQuestion}
            questionTypes={questionTypes}
            unsplashImages={unsplashImages}
            gifsImages={gifsImages}
            loadMoreImages={loadMoreImages}
            loadMoreGifs={loadMoreGifs}
            isLoading={isLoading}
            fetchUnsplashImages={fetchUnsplashImages}
            fetchGifsImages={fetchGifsImages}
            quiz={quiz}
            setQuiz={setQuiz}
            setError={setError}
          />
        ))}
      </motion.div>
      <motion.div
        className="flex flex-col sm:flex-row justify-between mt-4 gap-3"
        variants={itemVariants}
      >
        <button
          onClick={prevStep}
          className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
        >
          <ArrowBackIcon className="mr-2 text-sm" />
          Back
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center"
        >
          Continue to Settings
          <ArrowForwardIcon className="ml-2 text-sm" />
        </button>
      </motion.div>
    </motion.div>
  );
}
