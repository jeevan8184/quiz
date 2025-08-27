import express from "express";
import {
  cancelQuizSchedule,
  InviteParticipant,
  InviteParticipantSession,
  scheduleQuiz,
} from "../actions/quizSchedule.actions.js";

const router = express.Router();

router.post("/create/:id", scheduleQuiz);
router.post("/invite", InviteParticipant);
router.post("/session/invite", InviteParticipantSession);
router.post("/:id/cancel", cancelQuizSchedule);

export default router;
