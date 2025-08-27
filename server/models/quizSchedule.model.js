import mongoose from "mongoose";
import { Schema } from "mongoose";
import { nanoid } from "nanoid";

const QuizScheduleSchema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    scheduleTime: {
      type: Date,
      required: [true, "Schedule time is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "active", "completed", "canceled"],
        message: "{VALUE} is not a valid status",
      },
      required: true,
    },
    code: {
      type: String,
      required: true,
      default: () => nanoid(6).toUpperCase(),
    },
  },
  {
    timestamps: true,
  }
);

const QuizSchedule =
  mongoose.models.QuizSchedule ||
  mongoose.model("QuizSchedule", QuizScheduleSchema);

export default QuizSchedule;
