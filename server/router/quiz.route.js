import express from "express";
import {
  createQuiz,
  deleteQuiz,
  getDashboardData,
  getPublicQuizzes,
  getQuizById,
  getQuizzes,
  getSinglePublicQuiz,
  saveExploredQuiz,
  toggleQuizPublicStatus,
  updateQuiz,
  VerifyQuizCode,
} from "../actions/quiz.actions.js";

const router = express.Router();

router.post("/create", createQuiz);
router.get("/dashboard/data", getDashboardData);
router.get("/public", getPublicQuizzes);
router.get("/public/:id", getSinglePublicQuiz);
router.get("/", getQuizzes);
router.get("/:id", getQuizById);
router.delete("/:id", deleteQuiz);
router.put("/edit/:id", updateQuiz);
router.get("/verify/:code", VerifyQuizCode);
router.post("/save-explored", saveExploredQuiz);
router.patch("/:id/publish", toggleQuizPublicStatus);

export default router;
