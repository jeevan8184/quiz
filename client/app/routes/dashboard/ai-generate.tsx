import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SourceSelectionPage from "~/components/source-selection-page";
import QuizInfoPage from "~/components/quizinfo-page";
import QuizGenerationPage from "~/components/quiz-generation-page";
import {
  containerVariants,
  itemVariants,
  type Quiz,
} from "~/components/constants";
import toast from "react-hot-toast";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Corrected Material-UI Icon Imports
import QuizIcon from "@mui/icons-material/Quiz";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InfoIcon from "@mui/icons-material/Info";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import TuneIcon from "@mui/icons-material/Tune";

export default function AIGeneratePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<string | null>("pdf");
  const [isCreating, setIsCreating] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<{
    type: string;
    name: string;
    size: number;
    content: string;
    url?: string;
  } | null>(null);
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [quiz, setQuiz] = useState<Quiz>({
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
  const user = useSelector((state: any) => state.reducer.currentUser);
  const navigate = useNavigate();

  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState([
    { value: "multiple-choice", label: "Multiple Choice", checked: true },
    { value: "true-false", label: "True/False", checked: false },
    { value: "short-answer", label: "Short Answer", checked: false },
    { value: "fill-in-the-blank", label: "Fill in the Blank", checked: false },
  ]);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(
    "Analyzing your content..."
  );

  const steps = [
    { step: "Select Source", icon: <UploadFileIcon className="text-sm" /> },
    { step: "Basic Info", icon: <InfoIcon className="text-sm" /> },
    { step: "AI Generate", icon: <AutoAwesomeIcon className="text-sm" /> },
    { step: "Edit Questions", icon: <RefreshIcon className="text-sm" /> },
    { step: "Settings", icon: <TuneIcon className="text-sm" /> },
  ];

  useEffect(() => {
    if (error) {
      setInterval(() => {
        setError("");
      }, 2000);
    }
  }, [error]);

  const generateQuiz = async () => {
    if (!selectedSource) {
      toast.error("Please select a content source first");
      setError("Please select a content source first");
      return;
    }

    let hasContent = false;
    switch (selectedSource) {
      case "text":
        hasContent = textContent.trim().length > 0;
        break;
      case "url":
        hasContent = urlContent.trim().length > 0;
        break;
      case "pdf":
      case "image":
        hasContent = uploadedContent !== null;
        break;
    }

    if (!hasContent) {
      toast.error("Please provide content before generating quiz");
      setError("Please provide content before generating quiz");
      return;
    }

    if (!questionTypes.some((type) => type.checked)) {
      toast.error("Please select at least one question type");
      setError("Please select at least one question type");
      return;
    }

    setIsProcessing(true);
    const steps = [
      "Analyzing your content...",
      "Extracting key concepts...",
      "Generating questions...",
      "Creating answer choices...",
      "Adding explanations...",
      "Finalizing your quiz...",
    ];

    let currentStep = 0;
    let progress = 0;

    const interval = setInterval(async () => {
      progress += Math.random() * 9 + 3;
      if (progress > 100) progress = 100;
      setProcessingProgress(progress);

      if (
        progress > (currentStep + 1) * 16.67 &&
        currentStep < steps.length - 1
      ) {
        currentStep++;
        setProcessingStep(steps[currentStep]);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(async () => {
          const selectedTypes = questionTypes
            .filter((type) => type.checked)
            .map((type) => type.value);

          try {
            let response;

            if (selectedSource === "pdf" && uploadedContent?.file) {
              const formData = new FormData();
              formData.append("pdf", uploadedContent.file);
              formData.append("questionCount", questionCount.toString());
              formData.append("questionTypes", JSON.stringify(selectedTypes));
              formData.append("subject", quiz.subject);
              formData.append("difficulty", quiz.difficulty);

              response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/generate-quiz/pdf`,
                formData
              );
            } else if (selectedSource === "image" && uploadedContent?.file) {
              const formData = new FormData();
              formData.append("image", uploadedContent.file);
              formData.append("questionCount", questionCount.toString());
              formData.append("questionTypes", JSON.stringify(selectedTypes));
              formData.append("subject", quiz.subject);
              formData.append("difficulty", quiz.difficulty);

              response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/generate-quiz/image`,
                formData
              );
            } else if (selectedSource === "text" && textContent) {
              response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/generate-quiz/text`,
                {
                  text: textContent,
                  questionCount: questionCount.toString(),
                  questionTypes: JSON.stringify(selectedTypes),
                  subject: quiz.subject,
                  difficulty: quiz.difficulty,
                }
              );
            } else if (selectedSource === "url" && urlContent) {
              response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/generate-quiz/url`,
                {
                  url: urlContent,
                  questionCount: questionCount.toString(),
                  questionTypes: JSON.stringify(selectedTypes),
                  subject: quiz.subject,
                  difficulty: quiz.difficulty,
                }
              );
            }

            if (response?.data) {
              console.log("response", response);
              toast.success("Quiz generated successfully!");
              setCurrentStep(currentStep + 1);
              setError("");
              setQuiz((prev) => ({
                ...prev,
                questions: response.data.questions,
              }));
              setTimeout(() => setCurrentStep(4), 1000);
            }
          } catch (error: any) {
            const message =
              error.response?.data?.error ||
              error.message ||
              "Failed to generate quiz";
            setError(message);
            toast.error(message);
          } finally {
            setIsProcessing(false);
          }
        }, 1000);
      }
    }, 200);
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
          isAICreated: true,
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
        setSelectedSource(null);
        setUploadedContent(null);
        setTextContent("");
        setUrlContent("");
        setQuestionCount(5);
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

  return (
    <div className="min-h-screen font-inter text-white bg-gradient-to-b from-gray-900 to-black overflow-x-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <QuizIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              Create AI-Powered Quiz
            </h1>
            <div className="text-sm text-cyan-300 mt-2 sm:mt-0">
              Step {currentStep} of {steps.length}
            </div>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-6"
            variants={itemVariants}
          >
            {steps.map((stepObj, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all w-full justify-center ${
                    currentStep === idx + 1
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : currentStep > idx + 1
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-gray-600/30 text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300"
                  }`}
                  // onClick={() => handleStepClick(idx)}
                >
                  {stepObj.icon}
                  <span className="hidden sm:inline">{stepObj.step}</span>
                </div>
                {idx < 4 && (
                  <div
                    className={`h-1 w-full sm:w-12 bg-gradient-to-r ${
                      currentStep > idx + 1
                        ? "from-green-500 to-emerald-500"
                        : currentStep === idx + 1
                        ? "from-cyan-500 to-blue-500"
                        : "bg-gray-600/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300 text-sm"
              variants={itemVariants}
            >
              {error}
            </motion.div>
          )}

          {currentStep === 1 && (
            <SourceSelectionPage
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              selectedSource={selectedSource}
              setSelectedSource={setSelectedSource}
              uploadedContent={uploadedContent}
              setUploadedContent={setUploadedContent}
              textContent={textContent}
              setTextContent={setTextContent}
              urlContent={urlContent}
              setUrlContent={setUrlContent}
              error={error}
              setError={setError}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
            />
          )}

          {currentStep === 2 && (
            <QuizInfoPage
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              quiz={quiz}
              setQuiz={setQuiz}
              error={error}
              setError={setError}
            />
          )}

          {(currentStep === 3 || currentStep === 4 || currentStep === 5) && (
            <QuizGenerationPage
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              quiz={quiz}
              setQuiz={setQuiz}
              selectedSource={selectedSource}
              uploadedContent={uploadedContent}
              textContent={textContent}
              urlContent={urlContent}
              error={error}
              setError={setError}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              questionTypes={questionTypes}
              setQuestionTypes={setQuestionTypes}
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              processingStep={processingStep}
              generateQuiz={generateQuiz}
              createQuiz={createQuiz}
              isCreating={isCreating}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
