import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true },
    picture: {
      type: String,
    },
    fcmToken: { type: String, default: null },
    plan: {
      type: String,
      enum: ["Free", "Pro", "Enterprise"],
      default: "Free",
    },
    credits: {
      type: Number,
      default: 5,
    },
    subscriptionId: { type: String, default: null },
    planExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema) || mongoose.models(User);

export default User;
