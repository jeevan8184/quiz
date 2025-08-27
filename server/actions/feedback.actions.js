import mongoose from "mongoose";
import Feedback from "../models/feedback.model.js";
import QuizSession from "../models/quizSession.model.js";

export const createFeedback = async (req, res) => {
  const { quizSessionId, userId, rating, comment } = req.body;

  try {
    const existingFeedback = await Feedback.findOne({
      quizSessionId,
      userId,
    });
    const quizSession = await QuizSession.findById(quizSessionId);
    const user = quizSession.participants.find(
      (p) => p.userId.toString() === userId.toString()
    );

    if (existingFeedback) {
      res.status(400).json({ error: "Feedback already submitted" });
      return;
    }
    const feedback = new mongoose.models.Feedback({
      quizSessionId,
      userId,
      rating,
      comment,
      avatar: user.avatar,
      name: user.name,
    });
    await feedback.save();

    res.status(201).json({ feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Failed to fetch quiz",
    });
  }
};

export const getSessionFeedbacks = async (req, res) => {
  const { quizSessionId } = req.params;

  try {
    const feedbacks = await Feedback.find({ quizSessionId });

    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Failed to fetch quiz",
    });
  }
};
