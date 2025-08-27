import express from "express";
import {
  generateQuizPdf,
  uploadPdfMiddleware,
} from "../actions/generate-quiz/pdf.js";
import {
  generateQuizImage,
  uploadImageMiddleware,
} from "../actions/generate-quiz/image.js";
import { generateQuizText } from "../actions/generate-quiz/text.js";
import { generateQuizUrl } from "../actions/generate-quiz/url.js";

const router = express.Router();

router.post("/pdf", uploadPdfMiddleware, generateQuizPdf);
router.post("/image", uploadImageMiddleware, generateQuizImage);
router.post("/text", generateQuizText);
router.post("/url", generateQuizUrl);

export default router;
