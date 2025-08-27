import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  type Quiz,
} from "~/components/constants";
import toast from "react-hot-toast";
import { TextField, Autocomplete } from "@mui/material";

// Corrected Material-UI Icon Imports
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoIcon from "@mui/icons-material/Info";
import ImageIcon from "@mui/icons-material/Image";

interface QuizInfoEditorProps {
  quiz: Quiz;
  setQuiz: React.Dispatch<React.SetStateAction<Quiz>>;
  error: string;
  setError: (error: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function QuizInfoEditor({
  quiz,
  setQuiz,
  error,
  setError,
  currentStep,
  setCurrentStep,
}: QuizInfoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: keyof Quiz
  ) => {
    setQuiz((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        setQuiz((prev) => ({ ...prev, coverImage: file, previewUrl }));
        toast.success("Cover image selected successfully!");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error("Please upload an image file (e.g., PNG, JPEG).");
      }
    }
  };

  const handleRemoveImage = () => {
    setQuiz((prev) => ({ ...prev, coverImage: null, previewUrl: null }));
    toast.success("Cover image removed.");
  };

  const nextStep = () => {
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
    }
    setCurrentStep(currentStep + 1);
    setError("");
  };

  const categories = [
    "Arts & Literature",
    "Film & TV",
    "Food & Drink",
    "General Knowledge",
    "Geography",
    "History",
    "Music",
    "Science",
    "Society & Culture",
    "Sport & Leisure",
    "Mathematics",
    "English",
    "Computer Science",
    "Other",
  ];

  if (currentStep !== 1) {
    return (
      <motion.div
        className="rounded-3xl p-6 sm:p-8 bg-black/20 backdrop-blur-md border border-red-500/30 text-red-300 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-xl font-semibold">Invalid Step</h2>
        <p>
          Current step ({currentStep}) is not valid for QuizInfoPage. Expected
          step: 1.
        </p>
        <button
          onClick={() => setCurrentStep(1)}
          className="mt-4 px-6 py-2 bg-cyan-500/50 hover:bg-cyan-500/70 rounded-lg font-medium text-sm transition-colors"
        >
          Go to Step 1
        </button>
      </motion.div>
    );
  }

  return (
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
        Quiz Basic Information
      </motion.h2>
      {error && (
        <motion.div
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 text-red-300 text-sm"
          variants={itemVariants}
        >
          {error}
        </motion.div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div className="space-y-4" variants={itemVariants}>
          <div>
            <label className="block text-sm font-medium text-cyan-100 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => handleInputChange(e, "title")}
              className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-100 text-sm placeholder-cyan-300 focus:border-cyan-500 focus:outline-none"
              placeholder="Enter quiz title..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-100 mb-2">
              Description *
            </label>
            <textarea
              value={quiz.description}
              onChange={(e) => handleInputChange(e, "description")}
              className="w-full p-3 bg-black/30 border border-cyan-300/30 rounded-lg text-cyan-100 text-sm placeholder-cyan-300 focus:border-cyan-500 focus:outline-none resize-none"
              rows={4}
              placeholder="Describe what this quiz covers..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-100 mb-2">
              Cover Image
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg flex items-center gap-1 text-sm"
                title="Upload cover image"
              >
                <ImageIcon className="text-sm" />
                Upload Image
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              {quiz.previewUrl && (
                <button
                  onClick={handleRemoveImage}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg flex items-center gap-1 text-sm"
                  title="Remove image"
                >
                  <ImageIcon className="text-sm" />
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-100 mb-2">
                Subject *
              </label>
              <Autocomplete
                value={quiz.subject}
                onChange={(event, newValue) => {
                  setQuiz((prev) => ({ ...prev, subject: newValue || "" }));
                  setError("");
                }}
                onInputChange={(event, newInputValue) => {
                  setQuiz((prev) => ({ ...prev, subject: newInputValue }));
                }}
                options={categories}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search or type a subject..."
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        padding: "2px 8px !important",
                        "& fieldset": { borderColor: "rgba(6,182,212,0.3)" },
                        "&:hover fieldset": {
                          borderColor: "rgba(6,182,212,0.7)",
                        },
                        "&.Mui-focused fieldset": { borderColor: "#06b6d4" },
                        "& input": {
                          color: "#cffafe",
                          padding: "10px 4px !important",
                        },
                      },
                      "& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator":
                        {
                          color: "#94a3b8",
                        },
                    }}
                  />
                )}
                PaperComponent={(props) => (
                  <div
                    {...props}
                    style={{
                      backgroundColor: "#020617",
                      color: "white",
                      border: "1px solid rgba(6,182,212,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                )}
              />
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
                <option value="beginner" className="text-cyan-300 bg-black">
                  Beginner
                </option>
                <option value="intermediate" className="text-cyan-300 bg-black">
                  Intermediate
                </option>
                <option value="advanced" className="text-cyan-300 bg-black">
                  Advanced
                </option>
              </select>
            </div>
          </div>
        </motion.div>
        <motion.div className="space-y-4" variants={itemVariants}>
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-100 mb-3 flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-cyan-300 text-sm">
              <li className="flex items-start gap-2">
                <InfoIcon className="text-cyan-400 text-sm mt-0.5" />
                Use clear, descriptive titles.
              </li>
              <li className="flex items-start gap-2">
                <InfoIcon className="text-cyan-400 text-sm mt-0.5" />
                Include learning objectives.
              </li>
              <li className="flex items-start gap-2">
                <InfoIcon className="text-cyan-400 text-sm mt-0.5" />
                Choose appropriate difficulty.
              </li>
              <li className="flex items-start gap-2">
                <InfoIcon className="text-cyan-400 text-sm mt-0.5" />
                Detailed descriptions improve AI generation.
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-100 mb-3">
              Quiz Preview
            </h3>
            <div className="space-y-2">
              {quiz.previewUrl && (
                <img
                  src={quiz.previewUrl}
                  alt="Quiz Cover"
                  className="w-full h-32 object-cover rounded-lg border border-cyan-500/30 mb-2"
                />
              )}
              <p className="text-cyan-100 font-medium text-sm">
                {quiz.title || "Quiz Title"}
              </p>
              <p className="text-cyan-300 text-sm">
                {quiz.description || "Description will appear here..."}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
                  {quiz.subject
                    ? quiz.subject.charAt(0).toUpperCase() +
                      quiz.subject.slice(1)
                    : "Subject"}
                </span>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                  {quiz.difficulty
                    ? quiz.difficulty.charAt(0).toUpperCase() +
                      quiz.difficulty.slice(1)
                    : "Difficulty"}
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
        <button
          onClick={nextStep}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center"
        >
          Continue to Questions
          <ArrowForwardIcon className="ml-2 text-sm" />
        </button>
      </motion.div>
    </motion.div>
  );
}
