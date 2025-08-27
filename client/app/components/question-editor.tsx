import { useEffect, useRef, useState } from "react";
import {
  itemVariants,
  type Question,
  type Quiz,
  type Content,
} from "./constants";
import toast from "react-hot-toast";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import TextIcon from "@mui/icons-material/TextFields";
import VideoIcon from "@mui/icons-material/Videocam";
import AudioIcon from "@mui/icons-material/Audiotrack";
import { motion, AnimatePresence } from "framer-motion";
import ImageDialog from "./ImageDialog";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import axios from "axios";

interface UnsplashImage {
  id: string;
  urls: { small: string };
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  updateQuestion: (index: number, field: string, value: any) => void;
  updateQuestionOption: (
    questionIndex: number,
    optionIndex: number,
    value:
      | string
      | { type: "image"; url: string; file: File; description: string }
  ) => void;
  deleteQuestion: (index: number) => void;
  questionTypes: { value: string; label: string }[];
  unsplashImages: UnsplashImage[];
  gifsImages: any[];
  loadMoreImages: (query: string) => void;
  loadMoreGifs: (query: string) => void;
  isLoading: boolean;
  fetchUnsplashImages: (page: number, query?: string, append?: boolean) => void;
  fetchGifsImages: (page: number, query?: string, append?: boolean) => void;
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
  setError: (error: string) => void;
}

const QuestionEditor = ({
  question,
  index,
  updateQuestion,
  updateQuestionOption,
  deleteQuestion,
  questionTypes,
  unsplashImages,
  gifsImages,
  loadMoreImages,
  loadMoreGifs,
  isLoading,
  fetchUnsplashImages,
  fetchGifsImages,
  quiz,
  setQuiz,
  setError,
}: QuestionEditorProps) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<{
    type: string;
    name: string;
    url: string;
  } | null>(null);
  const [contentTypes] = useState([
    { value: "text", label: "Text", icon: <TextIcon /> },
    { value: "image", label: "Image", icon: <ImageIcon /> },
    { value: "video", label: "Video", icon: <VideoIcon /> },
    { value: "audio", label: "Audio", icon: <AudioIcon /> },
  ]);

  const handleOpenDialog = (optIndex: number) => {
    setSelectedOptionIndex(optIndex);
    setOpenDialog(true);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    optIndex: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        updateQuestionOption(index, optIndex, {
          type: "image",
          url,
          file,
          description: "",
        });
        setUploadedContent({ type: "image", name: file.name, url });
        toast.success(`Image uploaded for option ${optIndex + 1}`);
        if (fileInputRefs.current[index]?.[optIndex]) {
          fileInputRefs.current[index][optIndex]!.value = "";
        }
      } else {
        toast.error("Please upload an image file (e.g., PNG, JPEG).");
        setError("Please upload an image file (e.g., PNG, JPEG).");
      }
    }
  };

  const handleContentAdd = (contentType: string) => {
    if (question.content?.some((content) => content.type === contentType)) {
      toast.error(`Only one ${contentType} content can be added per question.`);
      setError(`Only one ${contentType} content can be added per question.`);
      return;
    }
    const newContent: Content = { type: contentType as Content["type"] };
    if (contentType === "text") newContent.value = "";
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index].content = [
      ...(updatedQuestions[index].content || []),
      newContent,
    ];
    setQuiz({ ...quiz, questions: updatedQuestions });
    toast.success(
      `${
        contentType.charAt(0).toUpperCase() + contentType.slice(1)
      } added to question ${index + 1}`
    );
  };

  const handleContentRemove = (contentIndex: number) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index].content = updatedQuestions[index].content?.filter(
      (_, i) => i !== contentIndex
    );
    setQuiz({ ...quiz, questions: updatedQuestions });
    toast.success(`Content removed from question ${index + 1}`);
  };

  const handleContentChange = (contentIndex: number, value: string | File) => {
    const updatedQuestions = [...quiz.questions];
    const content = updatedQuestions[index].content?.[contentIndex];
    if (!content) return;

    if (content.type === "text") {
      content.value = value as string;
      setQuiz({ ...quiz, questions: updatedQuestions });
    } else if (content.type === "video") {
      let videoUrl = value as string;
      if (videoUrl.includes("youtube.com/watch")) {
        const videoId = new URLSearchParams(new URL(videoUrl).search).get("v");
        if (videoId) {
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        } else {
          toast.error(
            "Invalid YouTube URL. Please use a valid YouTube video URL."
          );
          setError(
            "Invalid YouTube URL. Please use a valid YouTube video URL."
          );
          return;
        }
      } else if (
        !videoUrl.match(/^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+$/)
      ) {
        toast.error(
          "Please use a valid YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)."
        );
        setError(
          "Please use a valid YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)."
        );
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = videoUrl;
      iframe.onload = () => {
        content.value = videoUrl;
        setQuiz({ ...quiz, questions: updatedQuestions });
        toast.success("Video URL added successfully!");
        document.body.removeChild(iframe);
      };
      iframe.onerror = () => {
        toast.error(
          "Unable to embed the video. Ensure embedding is enabled for this YouTube video."
        );
        setError(
          "Unable to embed the video. Ensure embedding is enabled for this YouTube video."
        );
        document.body.removeChild(iframe);
      };
      document.body.appendChild(iframe);
    } else if (content.type === "image" || content.type === "audio") {
      const file = value as File;
      if (
        (content.type === "image" && file.type.startsWith("image/")) ||
        (content.type === "audio" && file.type.startsWith("audio/"))
      ) {
        content.file = file;
        content.url = URL.createObjectURL(file);
        setUploadedContent({
          type: content.type,
          name: file.name,
          url: content.url,
        });
        setQuiz({ ...quiz, questions: updatedQuestions });
        toast.success(
          `${
            content.type.charAt(0).toUpperCase() + content.type.slice(1)
          } uploaded successfully!`
        );
      } else {
        toast.error(`Please upload a valid ${content.type} file.`);
        setError(`Please upload a valid ${content.type} file.`);
        return;
      }
    }
  };

  const handleRemoveImage = (optIndex: number) => {
    updateQuestionOption(index, optIndex, "");
    setUploadedContent(null);
    toast.success(`Image removed from option ${optIndex + 1}`);
  };

  const handleOptionDescriptionChange = (optIndex: number, value: string) => {
    const updatedOptions = [...(question.options || [])];
    if (typeof updatedOptions[optIndex] !== "string") {
      updatedOptions[optIndex] = {
        ...(updatedOptions[optIndex] as {
          type: "image";
          url: string;
          file: File;
          description: string;
        }),
        description: value,
      };
      updateQuestionOption(index, optIndex, updatedOptions[optIndex]);
    }
  };

  const handleDeleteConfirm = () => {
    deleteQuestion(index);
    setDeleteDialogOpen(false);
    toast.success(`Question ${index + 1} deleted`);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleSaveQuestion = async (questionId: number) => {
    const updatedQuestions = [...quiz.questions];
    const questionIndex = updatedQuestions.findIndex(
      (q) => q.id === questionId
    );
    const question = updatedQuestions[questionIndex];

    if (!question.question.trim()) {
      toast.error("Question cannot be empty");
      setError("Question cannot be empty");
      return;
    }
    if (question.type === "multiple-choice") {
      if (!question.options?.length) {
        toast.error(
          "Please add at least one option for multiple-choice questions"
        );
        setError(
          "Please add at least one option for multiple-choice questions"
        );
        return;
      }
      if (
        question.correctAnswer === undefined ||
        question.correctAnswer >= question.options.length
      ) {
        toast.error(
          "Please select a valid correct answer for multiple-choice questions"
        );
        setError(
          "Please select a valid correct answer for multiple-choice questions"
        );
        return;
      }
      if (
        question.options?.some(
          (opt) =>
            opt === undefined ||
            opt === null ||
            (typeof opt === "string" && !opt.trim())
        )
      ) {
        toast.error("Options cannot be empty");
        setError("Options cannot be empty");
        return;
      }
    }
    if (
      question.type === "true-false" &&
      typeof question.correctAnswer !== "boolean"
    ) {
      toast.error("Please select a correct answer for true/false questions");
      setError("Please select a correct answer for true/false questions");
      return;
    }
    if (
      (question.type === "short-answer" ||
        question.type === "fill-in-the-blank") &&
      !question.correctAnswer?.trim()
    ) {
      toast.error(
        `Please provide a correct answer for ${question.type} questions`
      );
      setError(
        `Please provide a correct answer for ${question.type} questions`
      );
      return;
    }

    updatedQuestions[questionIndex] = {
      ...question,
      question: question.question.trim(),
      options: question.options?.map((opt) =>
        typeof opt === "string"
          ? opt.trim()
          : typeof opt === "number"
          ? opt
          : { ...opt, description: opt.description?.trim() || "" }
      ),
      correctAnswer:
        question.type === "true-false"
          ? question.correctAnswer
          : typeof question.correctAnswer === "number"
          ? question.correctAnswer
          : question.correctAnswer?.toString().trim(),
      explanation: question.explanation?.trim() || "No explanation provided",
      type: question.type,
    };

    setQuiz((prev) => ({ ...prev, questions: updatedQuestions }));
    toast.success("Question saved successfully!");
    setIsEditing(false);
  };

  const renderDisplayMode = () => (
    <motion.div
      className="bg-gradient-to-br from-gray-900 to-cyan-900/20 border border-cyan-500/50 rounded-2xl p-4 sm:p-6 mb-6 transition-all hover:shadow-[0_10px_30px_rgba(0,255,255,0.2)] hover:-translate-y-1 backdrop-blur-sm"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-cyan-300 tracking-wide">
          Question {index + 1}: {question.question}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors duration-200 hover:scale-105"
          >
            <EditIcon className="text-sm" />
          </button>
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors duration-200 hover:scale-105"
          >
            <DeleteIcon className="text-sm" />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-cyan-100 font-medium">
          <strong>Type:</strong>{" "}
          {questionTypes.find((t) => t.value === question.type)?.label}
        </p>
        {question.content?.map((content: Content, contentIndex: number) => (
          <div key={contentIndex} className="mt-2">
            {content.type === "image" && content.url && (
              <div className="bg-black/30 rounded-lg p-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <ImageIcon className="text-sm" />
                  <span>Image</span>
                </div>
                <img
                  src={content.url}
                  alt={`Question ${index + 1} Image`}
                  className="mt-1 w-full h-32 object-cover rounded-lg border border-cyan-500/30"
                />
              </div>
            )}
            {content.type === "video" && content.value && (
              <div className="bg-black/30 rounded-lg p-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <VideoIcon className="text-sm" />
                  <span>Video</span>
                </div>
                <iframe
                  src={content.value}
                  title={`Question ${index + 1} Video`}
                  className="mt-1 w-full h-32 rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {content.type === "audio" && content.url && (
              <div className="bg-black/30 rounded-lg p-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <AudioIcon className="text-sm" />
                  <span>Audio</span>
                </div>
                <audio src={content.url} controls className="mt-1 w-full" />
              </div>
            )}
            {content.type === "text" && content.value && (
              <div className="bg-black/30 rounded-lg p-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <TextIcon className="text-sm" />
                  <span>Text</span>
                </div>
                <pre className="text-gray-300 text-xs mt-1 whitespace-pre-wrap">
                  {content.value}
                </pre>
              </div>
            )}
          </div>
        ))}
        {question.type === "multiple-choice" && (
          <div className="space-y-3">
            {question.options?.map((option, optIndex) => (
              <div
                key={optIndex}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  optIndex === question.correctAnswer
                    ? "text-green-400 bg-green-500/10"
                    : "text-gray-200 bg-gray-800/30"
                } transition-colors duration-200`}
              >
                {typeof option === "string" ? (
                  <span className="text-sm">{option}</span>
                ) : (
                  <div className="flex items-center gap-3">
                    <img
                      src={option.url}
                      alt={`Option ${optIndex + 1}`}
                      className="w-12 h-12 object-cover rounded-lg border border-cyan-500/30 shadow-sm"
                    />
                    <span className="text-sm">{option.description}</span>
                  </div>
                )}
                {optIndex === question.correctAnswer && (
                  <span className="text-xs font-semibold">(Correct)</span>
                )}
              </div>
            ))}
          </div>
        )}
        {question.type === "true-false" && (
          <p className="text-green-400 font-medium text-sm">
            <strong>Answer:</strong> {question.correctAnswer ? "True" : "False"}
          </p>
        )}
        {question.type === "short-answer" && (
          <p className="text-green-400 font-medium text-sm">
            <strong>Answer:</strong> {question.correctAnswer}
          </p>
        )}
        {question.type === "fill-in-the-blank" && (
          <p className="text-green-400 font-medium text-sm">
            <strong>Answer:</strong> {question.correctAnswer}
          </p>
        )}
        {question.explanation && (
          <p className="text-gray-200 text-sm italic">
            <strong>Explanation:</strong> {question.explanation}
          </p>
        )}
      </div>
    </motion.div>
  );

  const renderEditMode = () => (
    <motion.div
      className="bg-gradient-to-b from-gray-900 to-black border border-cyan-500/50 rounded-2xl p-4 sm:p-6 mb-6 transition-all hover:shadow-[0_10px_30px_rgba(0,255,255,0.2)] hover:-translate-y-1"
      variants={itemVariants}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-cyan-300">
            Question {index + 1}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveQuestion(question.id)}
              className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors duration-200"
            >
              <SaveIcon className="text-sm" />
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors duration-200"
            >
              <DeleteIcon className="text-sm" />
            </button>
          </div>
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-cyan-100 mb-2">
            Question Type
          </label>
          <select
            value={question.type}
            onChange={(e) => updateQuestion(index, "type", e.target.value)}
            className="w-full p-3 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-cyan-300 text-sm focus:border-cyan-500 focus:outline-none transition-colors duration-200"
          >
            {questionTypes.map((type) => (
              <option
                key={type.value}
                value={type.value}
                className="text-cyan-300 bg-gray-900"
              >
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-cyan-100 mb-2">
            Question
          </label>
          <textarea
            value={question.question}
            onChange={(e) => updateQuestion(index, "question", e.target.value)}
            className="w-full p-3 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
            rows={2}
            placeholder="Enter your question..."
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-cyan-100 mb-2">
            Add Content
          </label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleContentAdd(type.value)}
                className={`p-2 rounded-lg flex items-center gap-1 text-sm ${
                  question.content?.some(
                    (content) => content.type === type.value
                  )
                    ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                    : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
                }`}
                disabled={question.content?.some(
                  (content) => content.type === type.value
                )}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {question.content?.map((content: Content, contentIndex: number) => (
              <motion.div
                key={contentIndex}
                className="mt-2 bg-black/30 rounded-lg p-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-cyan-100">
                    {content.type.charAt(0).toUpperCase() +
                      content.type.slice(1)}
                  </span>
                  <button
                    onClick={() => handleContentRemove(contentIndex)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs"
                  >
                    <DeleteIcon className="text-sm" />
                  </button>
                </div>
                {content.type === "text" && (
                  <textarea
                    value={content.value || ""}
                    onChange={(e) =>
                      handleContentChange(contentIndex, e.target.value)
                    }
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-100 text-sm placeholder-cyan-300 focus:border-cyan-500 focus:outline-none resize-none"
                    rows={4}
                    placeholder="Enter text content..."
                  />
                )}
                {content.type === "video" && (
                  <input
                    type="text"
                    value={content.value || ""}
                    onChange={(e) =>
                      handleContentChange(contentIndex, e.target.value)
                    }
                    className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-100 text-sm placeholder-cyan-300 focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter video URL (e.g., YouTube embed URL)..."
                  />
                )}
                {(content.type === "image" || content.type === "audio") && (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept={content.type === "image" ? "image/*" : "audio/*"}
                      ref={(el) => {
                        if (!fileInputRefs.current[index])
                          fileInputRefs.current[index] = [];
                        fileInputRefs.current[index][contentIndex] = el;
                      }}
                      onChange={(e) =>
                        e.target.files &&
                        handleContentChange(contentIndex, e.target.files[0])
                      }
                      className="hidden"
                    />
                    <button
                      onClick={() =>
                        fileInputRefs.current[index]?.[contentIndex]?.click()
                      }
                      className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg flex items-center gap-1 text-sm"
                    >
                      {content.type === "image" ? (
                        <ImageIcon className="text-sm" />
                      ) : (
                        <AudioIcon className="text-sm" />
                      )}
                      Upload {content.type}
                    </button>
                    {content.url && (
                      <button
                        onClick={() => handleContentRemove(contentIndex)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg flex items-center gap-1 text-sm"
                      >
                        <DeleteIcon className="text-sm" />
                        Remove
                      </button>
                    )}
                  </div>
                )}
                {content.type === "image" && content.url && (
                  <img
                    src={content.url}
                    alt={`Question ${index + 1} Image`}
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-cyan-500/30"
                  />
                )}
                {content.type === "audio" && content.url && (
                  <audio src={content.url} controls className="mt-2 w-full" />
                )}
                {content.type === "video" && content.value && (
                  <div className="mt-2">
                    <iframe
                      src={content.value}
                      title={`Question ${index + 1} Video`}
                      className="w-full h-32 rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="md:col-span-3">
          {question.type === "multiple-choice" && (
            <div className="space-y-3">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct_${index}`}
                    checked={optIndex === question.correctAnswer}
                    onChange={() =>
                      updateQuestion(index, "correctAnswer", optIndex)
                    }
                    className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    {typeof option === "string" ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateQuestionOption(
                              index,
                              optIndex,
                              e.target.value
                            )
                          }
                          className="flex-1 p-2 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <button
                          onClick={() => handleOpenDialog(optIndex)}
                          className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg flex items-center gap-1 text-sm"
                          title="Upload image"
                        >
                          <ImageIcon className="text-sm" />
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => {
                            if (!fileInputRefs.current[index])
                              fileInputRefs.current[index] = [];
                            fileInputRefs.current[index][optIndex] = el;
                          }}
                          onChange={(e) => handleImageUpload(e, optIndex)}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={option.url}
                            alt={`Option ${optIndex + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-cyan-500/30"
                          />
                          <button
                            onClick={() => handleRemoveImage(optIndex)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg flex items-center gap-1 text-sm"
                            title="Remove image"
                          >
                            <DeleteIcon className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleOpenDialog(optIndex)}
                            className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg flex items-center gap-1 text-sm"
                            title="Replace image"
                          >
                            <ImageIcon className="text-sm" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={option.description}
                          onChange={(e) =>
                            handleOptionDescriptionChange(
                              optIndex,
                              e.target.value
                            )
                          }
                          className="flex-1 p-2 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                          placeholder={`Description for option ${optIndex + 1}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {question.type === "true-false" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-cyan-100 mb-2">
                Correct Answer
              </label>
              <select
                value={question.correctAnswer ? "true" : "false"}
                onChange={(e) =>
                  updateQuestion(
                    index,
                    "correctAnswer",
                    e.target.value === "true"
                  )
                }
                className="w-full p-3 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}
          {question.type === "short-answer" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-cyan-100 mb-2">
                Sample Answer
              </label>
              <input
                type="text"
                value={question.correctAnswer || ""}
                onChange={(e) =>
                  updateQuestion(index, "correctAnswer", e.target.value)
                }
                className="w-full p-3 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                placeholder="Enter sample answer..."
              />
            </div>
          )}
          {question.type === "fill-in-the-blank" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-cyan-100 mb-2">
                Sample Answer
              </label>
              <input
                type="text"
                value={question.correctAnswer || ""}
                onChange={(e) =>
                  updateQuestion(index, "correctAnswer", e.target.value)
                }
                className="w-full p-3 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                placeholder="Enter sample answer..."
              />
            </div>
          )}
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-cyan-100 mb-2">
            Explanation (Optional)
          </label>
          <textarea
            value={question.explanation}
            onChange={(e) =>
              updateQuestion(index, "explanation", e.target.value)
            }
            className="w-full p-3 bg-gray-800/50 border border-cyan-300/30 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
            rows={2}
            placeholder="Enter explanation..."
          />
        </div>
      </div>
      <ImageDialog
        openDialog={openDialog}
        unsplashImages={unsplashImages}
        gifsImages={gifsImages}
        loadMoreImages={loadMoreImages}
        loadMoreGifs={loadMoreGifs}
        isLoading={isLoading}
        fetchUnsplashImages={fetchUnsplashImages}
        fetchGifsImages={fetchGifsImages}
        updateQuestionOption={updateQuestionOption}
        selectedOptionIndex={selectedOptionIndex}
        index={index}
        setUploadedContent={setUploadedContent}
        handleImageUpload={handleImageUpload}
        uploadedContent={uploadedContent}
        setOpenDialog={setOpenDialog}
        setSelectedOptionIndex={setSelectedOptionIndex}
      />
    </motion.div>
  );

  return (
    <>
      {isEditing ? renderEditMode() : renderDisplayMode()}
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
            Are you sure you want to delete this question? This action cannot be
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
    </>
  );
};

export default QuestionEditor;
