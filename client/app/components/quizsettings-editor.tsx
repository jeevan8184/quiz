import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  type Quiz,
  type Question,
} from "~/components/constants";
import toast from "react-hot-toast";
import { CircularProgress } from "@mui/material";

// Corrected Material-UI Icon Imports
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PublishIcon from "@mui/icons-material/Publish";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ImageIcon from "@mui/icons-material/Image";

interface QuizSettingsEditorProps {
  quiz: Quiz;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: keyof Quiz
  ) => void;
  handleCheckboxChange: (field: keyof Quiz) => void;
  publishQuiz: () => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  setError: (error: string) => void;
  isCreating: boolean;
}

export default function QuizSettingsEditor({
  quiz,
  handleInputChange,
  handleCheckboxChange,
  publishQuiz,
  nextStep,
  prevStep,
  currentStep,
  setError,
  isCreating,
}: QuizSettingsEditorProps) {
  const [showQuestions, setShowQuestions] = useState(false);

  const toggleQuestions = () => {
    setShowQuestions(!showQuestions);
  };

  const createQuiz = () => {
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
    publishQuiz();
  };

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
        {currentStep === 3 ? "Quiz Settings" : "Review & Publish"}
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div className="space-y-4" variants={itemVariants}>
          {currentStep === 3 ? (
            <>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-3">
                  Timing Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.enableTimer}
                      onChange={() => handleCheckboxChange("enableTimer")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-gray-300 text-sm">
                      Enable time limit
                    </span>
                  </label>
                  {quiz.enableTimer && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-gray-300 mb-2 text-sm">
                          Time limit (minutes)
                        </label>
                        <input
                          type="number"
                          value={quiz.timeLimit}
                          onChange={(e) => handleInputChange(e, "timeLimit")}
                          min="1"
                          max="180"
                          className="w-full p-3 bg-white/10 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quiz.showTimer}
                          onChange={() => handleCheckboxChange("showTimer")}
                          className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                        />
                        <span className="text-gray-300 text-sm">
                          Show timer to students
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-3">
                  Attempt Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">
                      Maximum attempts
                    </label>
                    <select
                      value={quiz.maxAttempts}
                      onChange={(e) => handleInputChange(e, "maxAttempts")}
                      className="w-full p-3 bg-white/10 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="1">1 attempt</option>
                      <option value="2">2 attempts</option>
                      <option value="3">3 attempts</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeQuestions}
                      onChange={() =>
                        handleCheckboxChange("randomizeQuestions")
                      }
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-gray-300 text-sm">
                      Randomize question order
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeAnswers}
                      onChange={() => handleCheckboxChange("randomizeAnswers")}
                      className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-gray-300 text-sm">
                      Randomize answer choices
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
              <h3 className="text-base font-semibold text-cyan-100 mb-3">
                Quiz Preview
              </h3>
              <div className="space-y-4">
                {quiz.previewUrl ? (
                  <img
                    src={quiz.previewUrl}
                    alt="Quiz Cover"
                    className="w-full h-48 object-cover rounded-lg border border-cyan-500/30"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-700/50 rounded-lg flex items-center justify-center border border-cyan-500/30">
                    <ImageIcon className="text-gray-400 text-3xl" />
                    <span className="text-gray-400 text-sm ml-2">
                      No cover image
                    </span>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Title:</span>
                    <span className="text-white font-medium">
                      {quiz.title || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subject:</span>
                    <span className="text-white font-medium">
                      {quiz.subject
                        ? quiz.subject.charAt(0).toUpperCase() +
                          quiz.subject.slice(1)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Difficulty:</span>
                    <span className="text-white font-medium">
                      {quiz.difficulty
                        ? quiz.difficulty.charAt(0).toUpperCase() +
                          quiz.difficulty.slice(1)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Questions:</span>
                    <span className="text-white font-medium">
                      {quiz.questions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        <motion.div className="space-y-4" variants={itemVariants}>
          {currentStep === 3 ? (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-base font-semibold text-white mb-3">
                Feedback Settings
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quiz.showCorrectAnswers}
                    onChange={() => handleCheckboxChange("showCorrectAnswers")}
                    className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-gray-300 text-sm">
                    Show correct answers after completion
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quiz.showExplanations}
                    onChange={() => handleCheckboxChange("showExplanations")}
                    className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-gray-300 text-sm">
                    Show explanations
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quiz.allowReview}
                    onChange={() => handleCheckboxChange("allowReview")}
                    className="w-4 h-4 text-cyan-500 bg-transparent border-2 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-gray-300 text-sm">
                    Allow review before submission
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                <h3 className="text-base font-semibold text-green-100 mb-3">
                  Quiz Settings Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Time Limit:</span>
                    <span className="text-white font-medium">
                      {quiz.enableTimer ? `${quiz.timeLimit} minutes` : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Show Timer:</span>
                    <span className="text-white font-medium">
                      {quiz.showTimer ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Max Attempts:</span>
                    <span className="text-white font-medium">
                      {quiz.maxAttempts === "unlimited"
                        ? "Unlimited"
                        : quiz.maxAttempts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Randomize Questions:</span>
                    <span className="text-white font-medium">
                      {quiz.randomizeQuestions ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Randomize Answers:</span>
                    <span className="text-white font-medium">
                      {quiz.randomizeAnswers ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Show Correct Answers:</span>
                    <span className="text-white font-medium">
                      {quiz.showCorrectAnswers ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Show Explanations:</span>
                    <span className="text-white font-medium">
                      {quiz.showExplanations ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Allow Review:</span>
                    <span className="text-white font-medium">
                      {quiz.allowReview ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                <h3 className="text-base font-semibold text-purple-100 mb-3 flex items-center justify-between">
                  Questions
                  <button
                    onClick={toggleQuestions}
                    className="p-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-full"
                  >
                    {showQuestions ? (
                      <ExpandLessIcon className="text-purple-300" />
                    ) : (
                      <ExpandMoreIcon className="text-purple-300" />
                    )}
                  </button>
                </h3>
                <AnimatePresence>
                  {showQuestions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {quiz.questions.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                          No questions added.
                        </p>
                      ) : (
                        quiz.questions.map(
                          (question: Question, index: number) => (
                            <div
                              key={index}
                              className="bg-white/5 rounded-lg p-3 text-sm"
                            >
                              <p className="text-white font-medium">
                                {index + 1}.{" "}
                                {question.question || "Untitled Question"}
                              </p>
                              {question.type === "multiple-choice" && (
                                <ul className="mt-2 space-y-1 text-gray-300">
                                  {question.options?.map((option, optIndex) => (
                                    <li
                                      key={optIndex}
                                      className="flex items-center gap-2"
                                    >
                                      <span>
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                      <span>
                                        {typeof option === "string"
                                          ? option
                                          : option.description ||
                                            "Image Option"}
                                      </span>
                                      {optIndex === question.correctAnswer && (
                                        <span className="text-green-400 text-xs">
                                          (Correct)
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {question.type === "true-false" && (
                                <p className="text-gray-300 mt-2">
                                  Correct Answer:{" "}
                                  {question.correctAnswer ? "True" : "False"}
                                </p>
                              )}
                              {(question.type === "short-answer" ||
                                question.type === "fill-in-the-blank") && (
                                <p className="text-gray-300 mt-2">
                                  Correct Answer:{" "}
                                  {question.correctAnswer || "Not set"}
                                </p>
                              )}
                              {question.explanation && (
                                <p className="text-gray-400 text-xs mt-2">
                                  Explanation: {question.explanation}
                                </p>
                              )}
                            </div>
                          )
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>
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
        {currentStep === 3 && (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center"
          >
            Continue to Publish
            <ArrowForwardIcon className="ml-2 text-sm" />
          </button>
        )}
        {currentStep === 4 && (
          <button
            onClick={createQuiz}
            disabled={isCreating}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center"
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
        )}
      </motion.div>
    </motion.div>
  );
}
