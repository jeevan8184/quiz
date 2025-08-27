import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  CircularProgress,
} from "@mui/material";
import { useSelector } from "react-redux";
import QuestionEditor from "~/components/question-editor";
import {
  containerVariants,
  itemVariants,
  type Question,
  type Quiz,
  type UnsplashImage,
} from "~/components/constants";

// Corrected Material-UI Icon Imports
import BackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";

const EditQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: any) => state.reducer.currentUser);
  const [quiz, setQuiz] = useState<Quiz | null>(location.state?.quiz || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const questionTypes = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "short-answer", label: "Short Answer" },
    { value: "fill-in-the-blank", label: "Fill in the Blank" },
  ];

  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [gifsImages, setGifsImages] = useState<UnsplashImage[]>([]);
  const [page, setPage] = useState({ imgPage: 1, gifPage: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState({
    imgQuery: "",
    gifQuery: "",
  });

  const fetchQuiz = async () => {
    if (!user?._id) {
      setError("User not authenticated");
      toast.error("Please log in to edit quiz");
      setLoading(false);
      return;
    }
    if (!id) {
      setError("Invalid quiz ID");
      toast.error("Invalid quiz ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/${id}`,
        {
          params: { userId: user._id },
        }
      );
      setQuiz(response.data.quiz);
      setCoverImagePreview(response.data.quiz.coverImage);
      setError("");
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to fetch quiz";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quiz && id) fetchQuiz();
    else setLoading(false);
  }, [id, user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: string
  ) => {
    const { value } = e.target;
    setQuiz((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCheckboxChange = (field: string) => {
    setQuiz((prev) => (prev ? { ...prev, [field]: !prev[field] } : prev));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
        toast.success("Cover image selected");
      } else {
        toast.error("Please upload an image file (e.g., PNG, JPEG)");
        setError("Please upload an image file (e.g., PNG, JPEG)");
      }
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...(quiz?.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuiz((prev) => (prev ? { ...prev, questions: updatedQuestions } : prev));
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value:
      | string
      | { type: "image"; url: string; file: File; description: string }
  ) => {
    const updatedQuestions = [...(quiz?.questions || [])];
    const options = [...(updatedQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuiz((prev) => (prev ? { ...prev, questions: updatedQuestions } : prev));
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = (quiz?.questions || []).filter(
      (_, i) => i !== index
    );
    setQuiz((prev) => (prev ? { ...prev, questions: updatedQuestions } : prev));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: quiz.questions.length + 1,
      type: "multiple-choice",
      question: "Enter your question here...",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: "Enter explanation here...",
    };
    setQuiz((prev) =>
      prev
        ? { ...prev, questions: [...(prev.questions || []), newQuestion] }
        : prev
    );
    toast.success("New question added");
  };

  const handleSaveQuiz = async () => {
    if (!quiz) return;
    if (!quiz.title.trim() || !quiz.subject.trim() || !quiz.difficulty) {
      toast.error("Title, subject, and difficulty are required");
      setError("Title, subject, and difficulty are required");
      return;
    }
    if (quiz.questions.length === 0) {
      toast.error("At least one question is required");
      setError("At least one question is required");
      return;
    }

    setSaveDialogOpen(true);
  };

  const confirmSaveQuiz = async () => {
    if (!quiz || !user?._id) return;
    setIsEditing(true);
    try {
      let coverImageBase64 = quiz.coverImage;
      if (coverImageFile instanceof File) {
        const reader = new FileReader();
        coverImageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () =>
            reject(new Error("Failed to read cover image file"));
          reader.readAsDataURL(coverImageFile);
        });
        if (!coverImageBase64.startsWith("data:image/")) {
          toast.error("Invalid cover image format. Must be an image file.");
          setError("Invalid cover image format. Must be an image file.");
          return;
        }
      }

      const questionsWithContent = await Promise.all(
        quiz.questions.map(async (question) => {
          const contentWithBase64 = await Promise.all(
            (question.content || []).map(async (content) => {
              if (
                (content.type === "image" || content.type === "audio") &&
                content.file instanceof File
              ) {
                const reader = new FileReader();
                const base64 = await new Promise((resolve, reject) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () =>
                    reject(new Error(`Failed to read ${content.type} file`));
                  reader.readAsDataURL(content.file);
                });
                if (
                  (content.type === "image" &&
                    !base64.startsWith("data:image/")) ||
                  (content.type === "audio" &&
                    !base64.startsWith("data:audio/"))
                ) {
                  throw new Error(
                    `Invalid ${content.type} format. Must be a valid ${content.type} file.`
                  );
                }
                return { ...content, url: base64, file: undefined };
              }
              return content;
            })
          );
          const processedOptions = await Promise.all(
            (question.options || []).map(async (option) => {
              if (typeof option === "string") {
                return option.trim() || "";
              }
              const isExternalUrl =
                typeof option.url === "string" &&
                (option.url.includes("giphy.com") ||
                  option.url.includes("unsplash.com") ||
                  option.url.includes("cloudinary.com"));
              if (isExternalUrl) {
                return {
                  ...option,
                  url: option.url,
                  description: option.description?.trim() || "",
                  file: undefined,
                };
              }
              if (option.file instanceof File) {
                const reader = new FileReader();
                const base64 = await new Promise((resolve, reject) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () =>
                    reject(new Error("Failed to read option image file"));
                  reader.readAsDataURL(option.file);
                });
                if (!base64.startsWith("data:image/")) {
                  throw new Error(
                    "Invalid option image format. Must be an image file."
                  );
                }
                return {
                  ...option,
                  url: base64,
                  description: option.description?.trim() || "",
                  file: undefined,
                };
              }
              return {
                ...option,
                url: option.url || "",
                description: option.description?.trim() || "",
                file: undefined,
              };
            })
          );
          return {
            ...question,
            content: contentWithBase64,
            options: processedOptions,
          };
        })
      );

      const quizData = {
        title: quiz.title.trim(),
        description: quiz.description.trim(),
        subject: quiz.subject.trim(),
        difficulty: quiz.difficulty,
        questions: JSON.stringify(questionsWithContent),
        enableTimer: quiz.enableTimer,
        timeLimit: Number(quiz.timeLimit) || 0,
        showTimer: quiz.showTimer,
        maxAttempts:
          quiz.maxAttempts === "unlimited" ? 0 : Number(quiz.maxAttempts) || 1,
        randomizeQuestions: quiz.randomizeQuestions,
        randomizeAnswers: quiz.randomizeAnswers,
        showCorrectAnswers: quiz.showCorrectAnswers,
        showExplanations: quiz.showExplanations,
        allowReview: quiz.allowReview,
        coverImage: coverImageBase64,
        userId: user._id,
        isAICreated: quiz.isAICreated,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/edit/${id}`,
        quizData
      );
      if (response.data) {
        console.log("Quiz updated successfully:", response);
        toast.success("Quiz updated successfully!");
        navigate(`/dashboard/quizzes/${id}`);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to update quiz";
      toast.error(message);
      setError(message);
    } finally {
      setIsEditing(false);
      setSaveDialogOpen(false);
    }
  };

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

  const handleBack = () => {
    navigate(`/dashboard/quizzes/${id}`);
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
      className="min-h-screen w-full p-4 sm:p-6 font-sans transition-transform duration-200 rounded-xl ease-in-out"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full container mx-auto">
        <motion.div
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-teal-300 hover:text-teal-100 transition-colors p-2 rounded-lg hover:bg-teal-800/30"
          >
            <BackIcon className="w-5 h-5" />
            <span className="text-sm sm:text-base">Back to Quiz</span>
          </button>
          <motion.button
            onClick={handleSaveQuiz}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all card-hover"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <SaveIcon className="w-5 h-5" />
            <span className="text-sm sm:text-base">Save Quiz</span>
          </motion.button>
        </motion.div>

        {loading && (
          <motion.div
            className="flex justify-center items-center h-64"
            variants={itemVariants}
          >
            <motion.div
              className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
        {error && (
          <motion.div
            className="bg-red-500/10 text-red-300 rounded-xl p-4 sm:p-6 mb-6 border border-red-500/20"
            variants={itemVariants}
          >
            {error}
            <button
              onClick={fetchQuiz}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Retry Loading
            </button>
          </motion.div>
        )}

        {!loading && !error && quiz && (
          <motion.div className="space-y-6" variants={containerVariants}>
            {/* Quiz Metadata */}
            <motion.div
              className="bg-gray-900/90 border border-teal-500/30 rounded-xl p-4 sm:p-6 animate-pulse-glow hover:shadow-[0_12px_24px_rgba(45,212,191,0.3)]"
              variants={itemVariants}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-teal-300 mb-4">
                Edit Quiz
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={quiz.title}
                    onChange={(e) => handleInputChange(e, "title")}
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                    placeholder="Enter quiz title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={quiz.description}
                    onChange={(e) => handleInputChange(e, "description")}
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none resize-none transition-colors duration-200"
                    rows={3}
                    placeholder="Enter quiz description..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-100 mb-2">
                      Subject *
                    </label>
                    <select
                      value={quiz.subject}
                      onChange={(e) => handleInputChange(e, "subject")}
                      className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                    >
                      <option value="" className="text-cyan-300 bg-black">
                        Select subject...
                      </option>
                      <option
                        value="mathematics"
                        className="text-cyan-300 bg-black"
                      >
                        Mathematics
                      </option>
                      <option
                        value="science"
                        className="text-cyan-300 bg-black"
                      >
                        Science
                      </option>
                      <option
                        value="history"
                        className="text-cyan-300 bg-black"
                      >
                        History
                      </option>
                      <option
                        value="english"
                        className="text-cyan-300 bg-black"
                      >
                        English
                      </option>
                      <option
                        value="geography"
                        className="text-cyan-300 bg-black"
                      >
                        Geography
                      </option>
                      <option
                        value="computer-science"
                        className="text-cyan-300 bg-black"
                      >
                        Computer Science
                      </option>
                      <option value="other" className="text-cyan-300 bg-black">
                        Other
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-100 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={quiz.difficulty}
                      onChange={(e) => handleInputChange(e, "difficulty")}
                      className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
                    >
                      <option value="" className="text-cyan-300 bg-black">
                        Select difficulty...
                      </option>
                      <option
                        value="beginner"
                        className="text-cyan-300 bg-black"
                      >
                        Beginner
                      </option>
                      <option
                        value="intermediate"
                        className="text-cyan-300 bg-black"
                      >
                        Intermediate
                      </option>
                      <option
                        value="advanced"
                        className="text-cyan-300 bg-black"
                      >
                        Advanced
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-100 mb-2">
                    Cover Image
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg flex items-center gap-1 text-sm transition-colors duration-200"
                    >
                      <ImageIcon className="text-sm" />
                      Upload Image
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                  </div>
                  {coverImagePreview && (
                    <img
                      src={coverImagePreview}
                      alt="Cover Preview"
                      className="mt-2 my-3 w-full max-w-xs h-44 object-cover rounded-lg border border-cyan-500/30"
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-100 mb-2">
                      Maximum attempts
                    </label>
                    <select
                      value={quiz.maxAttempts}
                      onChange={(e) => handleInputChange(e, "maxAttempts")}
                      className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
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
                      checked={quiz.enableTimer}
                      onChange={() => handleCheckboxChange("enableTimer")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    <span className="text-cyan-100 text-sm">Enable timer</span>
                  </label>
                  {quiz.enableTimer && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-2">
                          Time limit (minutes)
                        </label>
                        <input
                          type="number"
                          value={quiz.timeLimit}
                          onChange={(e) => handleInputChange(e, "timeLimit")}
                          min="1"
                          max="180"
                          className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
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
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-cyan-100">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeQuestions}
                      onChange={() =>
                        handleCheckboxChange("randomizeQuestions")
                      }
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    Randomize Questions
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cyan-100">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeAnswers}
                      onChange={() => handleCheckboxChange("randomizeAnswers")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    Randomize Answers
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cyan-100">
                    <input
                      type="checkbox"
                      checked={quiz.showCorrectAnswers}
                      onChange={() =>
                        handleCheckboxChange("showCorrectAnswers")
                      }
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    Show Correct Answers
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cyan-100">
                    <input
                      type="checkbox"
                      checked={quiz.showExplanations}
                      onChange={() => handleCheckboxChange("showExplanations")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    Show Explanations
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cyan-100">
                    <input
                      type="checkbox"
                      checked={quiz.allowReview}
                      onChange={() => handleCheckboxChange("allowReview")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-cyan-300/30 rounded focus:ring-cyan-500"
                    />
                    Allow Review
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Questions Section */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-teal-300">
                  Questions
                </h3>
                <motion.button
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all card-hover"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AddIcon className="w-5 h-5" />
                  <span className="text-sm sm:text-base">Add Question</span>
                </motion.button>
              </div>
              <AnimatePresence>
                {quiz.questions.length === 0 ? (
                  <motion.p
                    className="text-gray-300 text-sm sm:text-base"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    No questions available. Add a question to get started.
                  </motion.p>
                ) : (
                  quiz.questions.map((question, index) => (
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
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* Save Confirmation Dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
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
            Confirm Save
          </DialogTitle>
          <DialogContent className="pt-6">
            <DialogContentText
              className="text-gray-200 text-base"
              style={{ color: "#e0f2fe", padding: 30 }}
            >
              Are you sure you want to save changes to this quiz?
            </DialogContentText>
          </DialogContent>
          <DialogActions className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setSaveDialogOpen(false)}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              disabled={isEditing}
              onClick={confirmSaveQuiz}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
            >
              {isEditing ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                <>
                  <SaveIcon className="w-5 h-5 mr-2" />
                  Save
                </>
              )}
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default EditQuizPage;
