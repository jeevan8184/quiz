import mongoose from "mongoose";
import { Schema } from "mongoose";

const QuestionSchema = new Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "multiple-choice",
      "true-false",
      "short-answer",
      "fill-in-the-blank",
    ],
    required: true,
  },
  options: [
    {
      type: Schema.Types.Mixed,
    },
  ],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, default: "" },
  content: [
    {
      type: {
        type: String,
        enum: ["text", "image", "audio", "video"],
        required: true,
      },
      value: { type: String, trim: true },
      url: { type: String },
    },
  ],
});

const QuizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true },
    questions: [QuestionSchema],
    enableTimer: { type: Boolean, default: false },
    timeLimit: { type: Number, default: 10 },
    showTimer: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeAnswers: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: false },
    showExplanations: { type: Boolean, default: false },
    allowReview: { type: Boolean, default: false },
    coverImage: {
      type: String,
      default:
        "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg",
    },
    isAICreated: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    isPublic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", QuizSchema);

export default Quiz;
