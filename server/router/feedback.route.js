import express from "express";
import {
  createFeedback,
  getSessionFeedbacks,
} from "../actions/feedback.actions.js";

const router = express.Router();

router.post("/create", createFeedback);
router.get("/quiz-session", getSessionFeedbacks);

export default router;
