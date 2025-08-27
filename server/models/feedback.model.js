import mongoose, { Schema } from "mongoose";

const FeedbackSchema = new Schema(
  {
    quizSessionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizSession",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    avatar: { type: String },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);

export default Feedback;
