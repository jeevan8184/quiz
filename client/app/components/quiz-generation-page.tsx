import React, {
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  type Question,
  type Quiz,
} from "~/components/constants";
import QuestionEditor from "~/components/question-editor";
import toast from "react-hot-toast";
import axios from "axios";
import { CircularProgress } from "@mui/material";

// Corrected Material-UI Icon Imports
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PreviewIcon from "@mui/icons-material/Preview";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import AddIcon from "@mui/icons-material/Add";
import PsychologyIcon from "@mui/icons-material/Psychology";
import InfoIcon from "@mui/icons-material/Info";

interface UnsplashImage {
  id: string;
  urls: { small: string };
}

interface QuizGenerationPageProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  quiz: Quiz;
  setQuiz: Dispatch<SetStateAction<Quiz>>;
  selectedSource: string | null;
  uploadedContent: {
    type: string;
    name: string;
    size: number;
    content: string;
    url?: string;
  } | null;
  textContent: string;
  urlContent: string;
  error: string;
  setError: (error: string) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  questionTypes: { value: string; label: string; checked: boolean }[];
  setQuestionTypes: Dispatch<
    SetStateAction<{ value: string; label: string; checked: boolean }[]>
  >;
  isProcessing: boolean;
  processingProgress: number;
  processingStep: string;
  generateQuiz: React.Dispatch<React.SetStateAction<Quiz>>;
  createQuiz: () => Promise<void>;
  isCreating: boolean;
}

export default function QuizGenerationPage({
  currentStep,
  setCurrentStep,
  quiz,
  setQuiz,
  selectedSource,
  uploadedContent,
  textContent,
  urlContent,
  error,
  setError,
  questionCount,
  setQuestionCount,
  questionTypes,
  setQuestionTypes,
  isProcessing,
  processingProgress,
  processingStep,
  generateQuiz,
  createQuiz,
  isCreating,
}: QuizGenerationPageProps) {
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [gifsImages, setGifsImages] = useState<UnsplashImage[]>([]);
  const [page, setPage] = useState({ imgPage: 1, gifPage: 1 });
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
      console.error("Failed to fetch Giphy images:", error);
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
        params: { page: pageNum, per_page: 30, ...(query && { query }) },
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

  const handleQuestionCountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQuestionCount(parseInt(e.target.value));
  };

  const handleQuestionTypeChange = (index: number) => {
    setQuestionTypes((prev) =>
      prev.map((type, i) =>
        i === index ? { ...type, checked: !type.checked } : type
      )
    );
    setError("");
  };

  const handleCheckboxChange = (field: keyof Quiz) => {
    setQuiz((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Quiz
  ) => {
    setQuiz((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const previewContent = () => {
    if (!selectedSource) {
      toast.error("Please select a content source first");
      setError("Please select a content source first");
      return;
    }
    let content = "";
    switch (selectedSource) {
      case "text":
        content = textContent;
        break;
      case "url":
        content = urlContent;
        break;
      case "pdf":
      case "image":
        content = uploadedContent ? uploadedContent.name : "";
        break;
    }
    if (!content) {
      toast.error("Please provide content to preview");
      setError("Please provide content to preview");
      return;
    }
    toast(`Content preview: ${content.substring(0, 100)}...`, { icon: "ℹ️" });
  };

  const regenerateQuiz = () => {
    if (
      window.confirm(
        "This will generate a completely new set of questions. Continue?"
      )
    ) {
      generateQuiz(quiz);
    }
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: quiz.questions.length + 1,
      type: "multiple-choice",
      question: "Enter your question here...",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: "Enter explanation here...",
    };
    setQuiz((prev) => ({
      ...prev,
      questions: [...quiz.questions, newQuestion],
    }));
    toast.success("New question added successfully!");
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    if (field === "type") {
      updatedQuestions[index].options =
        value === "multiple-choice"
          ? ["Option A", "Option B", "Option C", "Option D"]
          : undefined;
      updatedQuestions[index].correctAnswer =
        value === "multiple-choice" ? 0 : value === "true-false" ? true : "";
    }
    setQuiz((prev) => ({ ...prev, questions: updatedQuestions }));
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value:
      | string
      | { type: "image"; url: string; file: File; description: string }
  ) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex].options![optionIndex] = value;
    setQuiz((prev) => ({ ...prev, questions: updatedQuestions }));
  };

  const deleteQuestion = (index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: quiz.questions.filter((_, i) => i !== index),
    }));
  };

  const saveQuiz = () => {
    if (quiz.questions.length === 0) {
      toast.error("Please add at least one question before saving.");
      setError("Please add at least one question before saving.");
      return;
    }
    console.log("Saving quiz:", quiz);
    toast.success("Quiz saved successfully!");
  };

  const publishQuiz = () => {
    if (quiz.questions.length === 0) {
      toast.error("Please add at least one question before publishing.");
      setError("Please add at least one question before publishing.");
      return;
    }

    for (const question of quiz.questions) {
      if (!question.question.trim()) {
        toast.error("All questions must have non-empty text.");
        setError("All questions must have non-empty text.");
        return;
      }
      if (question.type === "multiple-choice") {
        if (!question.options?.length) {
          toast.error(
            "Multiple-choice questions must have at least one option."
          );
          setError("Multiple-choice questions must have at least one option.");
          return;
        }
        if (
          question.options.some((opt) => {
            if (opt === undefined || opt === null) return true;
            if (typeof opt === "string" && !opt.trim()) return true;
            if (typeof opt === "object" && !opt.description?.trim() && !opt.url)
              return true;
            return false;
          })
        ) {
          toast.error(
            "All options must have content (either text or an image)."
          );
          setError("All options must have content (either text or an image).");
          return;
        }
        if (
          question.correctAnswer === undefined ||
          question.correctAnswer >= question.options.length
        ) {
          toast.error(
            "Multiple-choice questions must have a valid correct answer."
          );
          setError(
            "Multiple-choice questions must have a valid correct answer."
          );
          return;
        }
      }
      if (
        question.type === "true-false" &&
        typeof question.correctAnswer !== "boolean"
      ) {
        toast.error("True/false questions must have a valid boolean answer.");
        setError("True/false questions must have a valid boolean answer.");
        return;
      }
      if (
        (question.type === "short-answer" ||
          question.type === "fill-in-the-blank") &&
        !question.correctAnswer?.trim()
      ) {
        toast.error(
          `${question.type} questions must have a non-empty correct answer.`
        );
        setError(
          `${question.type} questions must have a non-empty correct answer.`
        );
        return;
      }
    }
    createQuiz();
  };

  if (currentStep < 3 || currentStep > 5) {
    return (
      <motion.div
        className="rounded-3xl p-6 sm:p-8 bg-black/20 backdrop-blur-md border border-red-500/30 text-red-300 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-xl font-semibold">Invalid Step</h2>
        <p>
          Current step ({currentStep}) is not valid for QuizGenerationPage.
          Expected steps: 3, 4, or 5.
        </p>
        <button
          onClick={() => setCurrentStep(3)}
          className="mt-4 px-6 py-2 bg-cyan-500/50 hover:bg-cyan-500/70 rounded-lg font-medium text-sm transition-colors"
        >
          Go to Step 3
        </button>
      </motion.div>
    );
  }

  return (
    <>
      {currentStep === 3 && (
        <>
          <div className="rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 bg-black/20 backdrop-blur-md border border-cyan-300/20">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
              AI Question Generation
            </h2>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 text-red-300 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2 sm:mb-3">
                    Number of Questions
                  </label>
                  <div className="flex items-center gap-4 ">
                    <div className="w-full ">
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={questionCount}
                        onChange={handleQuestionCountChange}
                        className="flex-1 h-3 w-full rounded-lg cursor-pointer appearance-auto"
                      />
                    </div>
                    <div className="bg-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 min-w-[3rem] sm:min-w-[4rem] text-center">
                      <span className="text-cyan-100 font-semibold text-sm sm:text-base">
                        {questionCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2 sm:mb-3">
                    Question Types
                  </label>
                  <div className="space-y-3">
                    {questionTypes.map(({ value, label, checked }, index) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-black/20 hover:bg-cyan-500/20 rounded-md cursor-pointer transition-all hover:shadow-[0_0_10px_#0ff]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleQuestionTypeChange(index)}
                          className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-500 rounded"
                        />
                        <span className="text-cyan-100 text-sm sm:text-base">
                          {label}
                        </span>
                        <span className="ml-auto text-xs sm:text-sm text-cyan-300">
                          {value === "multiple-choice"
                            ? "Most popular"
                            : value === "true-false"
                            ? "Quick assessment"
                            : value === "short-answer"
                            ? "Open-ended"
                            : "Memory test"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-cyan-500/10 border border-cyan-300/30 rounded-md p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <InfoIcon className="text-cyan-300 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-cyan-300 font-medium text-sm sm:text-base">
                      AI Generation Tips
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-cyan-100">
                    Select multiple question types for variety. The AI will use
                    your uploaded content or text to generate relevant
                    questions.
                  </p>
                </div>
                {isProcessing && (
                  <div className="rounded-3xl p-6 sm:p-8 max-w-md w-full text-center bg-black/20 backdrop-blur-md border border-cyan-300/20">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500">
                      <PsychologyIcon className="text-cyan-300 text-2xl sm:text-3xl" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-cyan-300 mb-2 sm:mb-3">
                      AI is Processing
                    </h3>
                    <p className="text-xs sm:text-sm text-cyan-100 mb-3 sm:mb-6">
                      {processingStep}
                    </p>
                    <div className="w-full bg-cyan-300/20 rounded-full h-3 mb-3 sm:mb-4">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    <div className="text-xs sm:text-sm text-cyan-300">
                      <span>{Math.round(processingProgress)}%</span> complete
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-cyan-300/10">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
              >
                <ArrowBackIcon className="mr-2 text-sm" />
                Back
              </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* <button
                  onClick={previewContent}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 sm:px-6 rounded-md py-2.5 font-medium text-sm sm:text-base transition-all hover:shadow-[0_0_10px_#0ff] flex items-center gap-2"
                >
                  <PreviewIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  Preview Content
                </button> */}
                <button
                  onClick={() => generateQuiz(quiz)}
                  className={`flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                    isProcessing
                      ? "px-4 py-1.5 text-sm opacity-60 cursor-not-allowed"
                      : "px-6 sm:px-8 py-2.5 text-base sm:text-lg hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_0_8px_#0ff]"
                  }`}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <CircularProgress className="text-white h-5 w-5" />
                  ) : (
                    <>
                      <AutoAwesomeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Generate Quiz with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 4 && (
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
              Review & Edit Questions
            </h2>
            <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-0">
              {/* <button
                onClick={regenerateQuiz}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-sm sm:text-base transition-all hover:shadow-[0_0_10px_#0ff]"
              >
                <RefreshIcon className="mr-1 text-sm" />
                Regenerate
              </button> */}
              <button
                onClick={addNewQuestion}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center"
              >
                <AddIcon className="mr-2 text-sm" />
                Add Question
              </button>
            </div>
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
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
            >
              <ArrowBackIcon className="mr-2 text-sm" />
              Back
            </button>
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center"
            >
              Continue to Settings
              <ArrowForwardIcon className="ml-2 text-sm" />
            </button>
          </motion.div>
        </motion.div>
      )}

      {currentStep === 5 && (
        <motion.div
          className="bg-black/20 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 sm:p-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            className="text-xl sm:text-2xl font-semibold text-white mb-4"
            variants={itemVariants}
          >
            Quiz Settings & Publish
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="bg-black/30 rounded-xl p-4">
                <h3 className="text-base font-semibold text-cyan-100 mb-3">
                  Timing Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.enableTimer}
                      onChange={() => handleCheckboxChange("enableTimer")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">
                      Enable time limit
                    </span>
                  </label>
                  {quiz.enableTimer && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-cyan-100 mb-2 text-sm">
                          Time limit (minutes)
                        </label>
                        <input
                          type="number"
                          value={quiz.timeLimit}
                          onChange={(e) => handleInputChange(e, "timeLimit")}
                          min="1"
                          max="180"
                          className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-100 text-sm focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quiz.showTimer}
                          onChange={() => handleCheckboxChange("showTimer")}
                          className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                        />
                        <span className="text-cyan-100 text-sm">
                          Show timer to students
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <h3 className="text-base font-semibold text-cyan-100 mb-3">
                  Attempt Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyan-100 mb-2 text-sm">
                      Maximum attempts
                    </label>
                    <select
                      value={quiz.maxAttempts}
                      onChange={(e) => handleInputChange(e, "maxAttempts")}
                      className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm 
               focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                    >
                      <option value="1" className="text-cyan-300 bg-black">
                        1 attempt
                      </option>
                      <option value="2" className="text-cyan-300 bg-black">
                        2 attempts
                      </option>
                      <option value="3" className="text-cyan-300 bg-black">
                        3 attempts
                      </option>
                      <option
                        value="unlimited"
                        className="text-cyan-300 bg-black"
                      >
                        Unlimited
                      </option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeQuestions}
                      onChange={() =>
                        handleCheckboxChange("randomizeQuestions")
                      }
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">
                      Randomize question order
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeAnswers}
                      onChange={() => handleCheckboxChange("randomizeAnswers")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">
                      Randomize answer choices
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="bg-black/30 rounded-xl p-4">
                <h3 className="text-base font-semibold text-cyan-100 mb-3">
                  Feedback Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.showCorrectAnswers}
                      onChange={() =>
                        handleCheckboxChange("showCorrectAnswers")
                      }
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">
                      Show correct answers after completion
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.showExplanations}
                      onChange={() => handleCheckboxChange("showExplanations")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">
                      Show explanations
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.allowReview}
                      onChange={() => handleCheckboxChange("allowReview")} // Fixed typo
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">
                      Allow review before submission
                    </span>
                  </label>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                <h3 className="text-base font-semibold text-green-100 mb-3">
                  Quiz Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Total Questions:</span>
                    <span className="text-cyan-100 font-medium">
                      {quiz.questions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Estimated Time:</span>
                    <span className="text-cyan-100 font-medium">
                      {Math.ceil(quiz.questions.length * 1.5)}-
                      {Math.ceil(quiz.questions.length * 2)} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Difficulty:</span>
                    <span className="text-cyan-100 font-medium">
                      {quiz.difficulty
                        ? quiz.difficulty.charAt(0).toUpperCase() +
                          quiz.difficulty.slice(1)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Subject:</span>
                    <span className="text-cyan-100 font-medium">
                      {quiz.subject
                        ? quiz.subject.charAt(0).toUpperCase() +
                          quiz.subject.slice(1)
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div
            className="flex flex-col sm:flex-row justify-between mt-4 gap-3"
            variants={itemVariants}
          >
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
            >
              <ArrowBackIcon className="mr-2 text-sm" />
              Back
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* <button
                onClick={saveQuiz}
                className="px-6 py-2 bg-yellow-600/50 hover:bg-yellow-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
              >
                <SaveIcon className="mr-2 text-sm" />
                Save as Draft
              </button> */}
              <button
                onClick={publishQuiz}
                disabled={isCreating}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center"
              >
                {isCreating ? (
                  <CircularProgress className="text-white h-5 w-5" />
                ) : (
                  <>
                    <PublishIcon className="mr-2 text-sm" />
                    Publish Quiz
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
