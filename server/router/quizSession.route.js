import express from "express";
import {
  createQuizSession,
  getHostResults,
  getQuizSessionById,
  getUserAllQuizSessions,
  getUserHostedQuizSessions,
  getUserParticipatedQuizSessions,
  getUserResults,
  joinQuizSession,
  verifyQuizSession,
} from "../actions/quizSession.actions.js";

const router = express.Router();

router.post("/create/:quizId", createQuizSession);

router.get("/all", getUserAllQuizSessions);

router.get("/:id", getQuizSessionById);
router.post("/verify", verifyQuizSession);
router.post("/join", joinQuizSession);

router.get("/host-results/:id", getHostResults);
router.get("/user-results/:id", getUserResults);

export default router;
