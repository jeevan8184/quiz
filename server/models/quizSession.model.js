import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";

const ParticipantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    socketId: {
      type: String,
      // required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, required: true },
        selectedAnswer: Schema.Types.Mixed,
        isCorrect: { type: Boolean, required: true },
        answeredAt: { type: Date, default: Date.now },
        timeTaken: { type: Number, min: 0 },
        points: { type: Number, default: 10, min: 0 },
      },
    ],
    disconnected: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

const QuizSessionSchema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hostSocketId: { type: String, default: null },
    code: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(6).toUpperCase(),
    },
    participants: {
      type: [ParticipantSchema],
      validate: {
        validator: (v) => v.length <= 100,
        message: "Exceeds maximum participant limit (100)",
      },
    },
    currentQuestion: {
      index: { type: Number, default: 0, min: 0 },
      startTime: { type: Date },
      locked: { type: Boolean, default: false },
      timeLimit: { type: Number, default: 10 },
    },
    status: {
      type: String,
      enum: [
        "schedule",
        "lobby",
        "in-progress",
        "paused",
        "completed",
        "cancelled",
        "ended",
      ],
      default: "lobby",
      required: true,
    },
    leaderboard: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, trim: true },
        score: { type: Number, default: 0, min: 0 },
        rank: { type: Number, min: 1 },
      },
    ],
    auditLog: [
      {
        action: {
          type: String,
          // enum: ["start", "pause", "resume", "end", "cancel", "join", "leave"],
          required: true,
        },
        performedBy: { type: Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
    maxParticipants: {
      type: Number,
      default: 100,
      min: 1,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    startTime: Date,
    endTime: Date,
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

QuizSessionSchema.index({ quizId: 1, status: 1 });

const QuizSession = mongoose.model("QuizSession", QuizSessionSchema);
export default QuizSession;
