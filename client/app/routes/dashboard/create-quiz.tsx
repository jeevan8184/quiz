import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  type Question,
  type Quiz,
  type Content,
} from "~/components/constants";
import toast from "react-hot-toast";
import axios from "axios";
import QuizInfoEditor from "~/components/quizinfo-editor";
import QuizQuestionsEditor from "~/components/quizquestions-editor";
import QuizSettingsEditor from "~/components/quizsettings-editor";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Corrected Material-UI Icon Imports
import QuizIcon from "@mui/icons-material/Quiz";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import PublishIcon from "@mui/icons-material/Publish";
import InfoIcon from "@mui/icons-material/Info";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeIcon from "@mui/icons-material/Home";

export default function ManualCreateQuizPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [quiz, setQuiz] = useState<Quiz>({
    title: "",
    description: "",
    subject: "",
    difficulty: "intermediate",
    questions: [] as Question[],
    enableTimer: false,
    timeLimit: 30,
    showTimer: false,
    maxAttempts: "1",
    randomizeQuestions: true,
    randomizeAnswers: true,
    showCorrectAnswers: true,
    showExplanations: true,
    allowReview: true,
    coverImage: null,
    previewUrl: null,
  });
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [questionTypes, setQuestionTypes] = useState([
    { value: "multiple-choice", label: "Multiple Choice", checked: true },
    { value: "true-false", label: "True/False", checked: false },
    { value: "short-answer", label: "Short Answer", checked: false },
    { value: "fill-in-the-blank", label: "Fill in the Blank", checked: false },
  ]);
  const user = useSelector((state: any) => state.reducer.currentUser);
  const location = useLocation();
  const initialQuizFromState = location.state?.quiz;

  useEffect(() => {
    if (initialQuizFromState) {
      setQuiz({
        ...quiz,
        ...initialQuizFromState,
        coverImage: initialQuizFromState.coverImage,
        previewUrl: initialQuizFromState.coverImage,
        difficulty: initialQuizFromState?.difficulty || "intermediate",
      });
      setCurrentStep(2);
    }
  }, [initialQuizFromState]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: keyof Quiz
  ) => {
    setQuiz({ ...quiz, [field]: e.target.value });
    setError("");
  };

  const handleCheckboxChange = (field: keyof Quiz) => {
    setQuiz({ ...quiz, [field]: !quiz[field] });
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: quiz.questions.length + 1,
      type: "multiple-choice",
      question: "Enter your question here...",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: "Enter explanation here...",
      content: [],
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
        value === "multiple-choice" ? ["", "", "", ""] : undefined;
      updatedQuestions[index].correctAnswer =
        value === "multiple-choice" ? 0 : value === "true-false" ? true : "";
    }
    setQuiz({ ...quiz, questions: updatedQuestions });
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
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const deleteQuestion = (index: number) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index),
    });
    toast.success("Question deleted!");
  };

  const createQuiz = async () => {
    if (!user) {
      toast.error("User not authenticated");
      setError("User not authenticated");
      return;
    }
    try {
      setIsCreating(true);

      if (!quiz.title.trim() || !quiz.subject.trim()) {
        toast.error("Title, subject, and description are required");
        setError("Title, subject, and description are required");
        return;
      }
      if (quiz.questions.length === 0) {
        toast.error("Please add at least one question");
        setError("Please add at least one question");
        return;
      }

      let coverImageBase64 = "";
      if (quiz.coverImage) {
        if (quiz.coverImage instanceof File) {
          const reader = new FileReader();
          coverImageBase64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(quiz.coverImage);
          });
          if (!coverImageBase64.startsWith("data:image/")) {
            toast.error("Invalid cover image format. Must be an image file.");
            setError("Invalid cover image format. Must be an image file.");
            return;
          }
        } else if (
          typeof quiz.coverImage === "string" &&
          (quiz.coverImage.startsWith("http") ||
            quiz.coverImage.startsWith("https"))
        ) {
          coverImageBase64 = quiz.coverImage;
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
                  option.url.includes("unsplash.com"));
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

      console.log(
        "Questions with content:",
        JSON.stringify(questionsWithContent, null, 2)
      );
      console.log("Quiz:", JSON.stringify(quiz, null, 2));

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz/create`,
        {
          ...quiz,
          questions: JSON.stringify(questionsWithContent),
          coverImage: coverImageBase64,
          userId: user._id,
          isAICreated: false,
        }
      );

      if (response.data) {
        console.log("Quiz created AI:", response);
        toast.success("Quiz created successfully!");
        setQuiz({
          title: "",
          description: "",
          subject: "",
          difficulty: "intermediate",
          questions: [],
          enableTimer: false,
          timeLimit: 30,
          showTimer: false,
          maxAttempts: "1",
          randomizeQuestions: true,
          randomizeAnswers: true,
          showCorrectAnswers: true,
          showExplanations: true,
          allowReview: true,
          coverImage: null,
          previewUrl: null,
        });

        setCurrentStep(1);
        setQuestionTypes([
          { value: "multiple-choice", label: "Multiple Choice", checked: true },
          { value: "true-false", label: "True/False", checked: false },
          { value: "short-answer", label: "Short Answer", checked: false },
          {
            value: "fill-in-the-blank",
            label: "Fill in the Blank",
            checked: false,
          },
        ]);
        setError("");
        navigate(`/dashboard/quizzes/${response.data.quiz._id}`);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.error || error.message || "Failed to create quiz";
      setError(message);
      toast.error(message);
      console.error("Error in createQuiz:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const publishQuiz = () => {
    if (quiz.questions.length === 0) {
      setError("Please add at least one question before publishing.");
      toast.error("Please add at least one question before publishing.");
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

  const nextStep = () => {
    if (currentStep < 4) {
      if (currentStep === 1) {
        if (!quiz.title.trim()) {
          setError("Please enter a quiz title.");
          toast.error("Please enter a quiz title.");
          return;
        }
        if (!quiz.subject.trim()) {
          setError("Please select a subject.");
          toast.error("Please select a subject.");
          return;
        }
        if (!quiz.description.trim()) {
          setError("Please enter a description.");
          toast.error("Please enter a description.");
          return;
        }
      }
      if (currentStep === 2 && quiz.questions.length === 0) {
        setError("Please add at least one question.");
        toast.error("Please add at least one question.");
        return;
      }
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen text-white font-sans flex bg-gradient-to-b from-gray-900 to-black overflow-x-hidden">
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <AutoAwesomeIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              {initialQuizFromState ? "Edit Quiz" : "Create Quiz"}
            </h1>
            <div className="text-sm text-gray-400 mt-2 sm:mt-0">
              Step {currentStep} of 4
            </div>
          </div>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-6"
            variants={itemVariants}
          >
            {[
              { step: "Basic Info", icon: <InfoIcon className="text-sm" /> },
              { step: "Questions", icon: <EditIcon className="text-sm" /> },
              { step: "Settings", icon: <SettingsIcon className="text-sm" /> },
              { step: "Publish", icon: <PublishIcon className="text-sm" /> },
            ].map((stepObj, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all w-full justify-center ${
                    currentStep === idx + 1
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : currentStep > idx + 1
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-gray-600/30 text-gray-400"
                  }`}
                >
                  {stepObj.icon}
                  <span className="hidden sm:inline">{stepObj.step}</span>
                </div>
                {idx < 3 && (
                  <div
                    className={`h-1 w-full sm:w-12 bg-gradient-to-r ${
                      currentStep > idx + 1
                        ? "from-green-500 to-emerald-500"
                        : currentStep === idx + 1
                        ? "from-cyan-500 to-blue-500"
                        : "bg-gray-600/30"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {error && (
          <motion.div
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-sm text-red-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {currentStep === 1 && (
          <QuizInfoEditor
            quiz={quiz}
            setQuiz={setQuiz}
            error={error}
            setError={setError}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === 2 && (
          <QuizQuestionsEditor
            quiz={quiz}
            setQuiz={setQuiz}
            questionTypes={questionTypes}
            addNewQuestion={addNewQuestion}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            deleteQuestion={deleteQuestion}
            nextStep={nextStep}
            prevStep={prevStep}
            setError={setError}
          />
        )}
        {currentStep === 3 || currentStep === 4 ? (
          <QuizSettingsEditor
            quiz={quiz}
            handleInputChange={handleInputChange}
            handleCheckboxChange={handleCheckboxChange}
            publishQuiz={publishQuiz}
            nextStep={nextStep}
            prevStep={prevStep}
            currentStep={currentStep}
            setError={setError}
            isCreating={isCreating}
          />
        ) : null}
      </div>
    </div>
  );
}
