import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI("AIzaSyDJBf_Nr50E4UocL1v61nUTNZHgYZ118IU");
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

async function extractTextFromUrl(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    $("script, style, nav, footer, header").remove();
    const mainContent = $("article, main").length
      ? $("article, main")
      : $("body");
    const text = mainContent.text().replace(/\s+/g, " ").trim();
    if (!text) throw new Error("No text extracted from URL");
    return text;
  } catch (error) {
    throw new Error(`URL text extraction failed: ${error.message}`);
  }
}

async function generateQuizQuestions(
  content,
  questionCount,
  questionTypes,
  subject,
  difficulty
) {
  const prompt = `
    Given the following content: "${content.slice(0, 10000)}"
    Generate ${questionCount} quiz questions for a ${difficulty} level quiz on ${subject}.
    Include the following question types: ${questionTypes.join(
      ", "
    )} and give them equally.
    For each question, provide:
    - question: The question text (string)
    - type: The question type (one of: multiple-choice, true-false, short-answer, fill-in-the-blank)
    - options: A list of 4 strings for multiple-choice questions; null for other types
    - correctAnswer: For multiple-choice, an integer (0-3) indicating the correct option index; for true-false, a boolean (true or false); for short-answer and fill-in-the-blank, a string
    - explanation: A brief explanation (string)
    Return the response in JSON format, ensuring all fields are provided and correctAnswer matches the type requirements.
  `;
  try {
    const result = await model.generateContent(prompt);
    const json = result.response
      .text()
      .replace(/```json\n([\s\S]*)\n```/, "$1")
      .trim();
    const questions = JSON.parse(json);
    return questions.map((q, idx) => ({
      id: idx + 1,
      type: q.type || "multiple-choice",
      question: q.question || "Unnamed Question",
      options:
        q.type === "multiple-choice" ? q.options || ["A", "B", "C", "D"] : null,
      correctAnswer:
        q.type === "multiple-choice"
          ? Number.isInteger(q.correctAnswer) &&
            q.correctAnswer >= 0 &&
            q.correctAnswer <= 3
            ? q.correctAnswer
            : 0
          : q.type === "true-false"
          ? typeof q.correctAnswer === "boolean"
            ? q.correctAnswer
            : true
          : typeof q.correctAnswer === "string"
          ? q.correctAnswer
          : "",
      explanation: q.explanation || "No explanation.",
    }));
  } catch (error) {
    throw new Error(`Question generation failed: ${error.message}`);
  }
}

export const generateQuizUrl = async (req, res) => {
  try {
    const { url, questionCount, questionTypes, subject, difficulty } = req.body;

    if (!url.match(/^(https?:\/\/|www\.)/)) {
      return res
        .status(400)
        .json({ error: "URL must start with http://, https://, or www." });
    }

    const urlText = await extractTextFromUrl(url);
    const questions = await generateQuizQuestions(
      urlText,
      parseInt(questionCount),
      JSON.parse(questionTypes),
      subject,
      difficulty
    );

    if (!questions.length)
      return res.status(500).json({ error: "No questions generated" });
    res.json({ questions });
  } catch (error) {
    console.error("Error in /api/generate-quiz/url:", error.message);
    res.status(500).json({ error: error.message });
  }
};
