import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from "@mui/material";
import { themes } from "~/components/constants";

// Corrected Material-UI Icon Imports
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CheckIcon from "@mui/icons-material/Check";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import PauseIcon from "@mui/icons-material/Pause";
import LockClockIcon from "@mui/icons-material/LockClock";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ReadyIcon from "@mui/icons-material/HowToReg";
import TimerIcon from "@mui/icons-material/Timer";
import TrophyIcon from "@mui/icons-material/EmojiEvents";

const socket = io(`${import.meta.env.VITE_SERVER_URL}`, { autoConnect: false });

const QuizWaitingRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";
  const { username, theme, sessionId } = location.state || {};
  const user = useSelector((state) => state.reducer.currentUser);

  const [currentTheme, setCurrentTheme] = useState(theme || themes.ocean);
  const [participants, setParticipants] = useState([]);
  const [quizSession, setQuizSession] = useState(null);
  const [userReady, setUserReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [autoStartTimer, setAutoStartTimer] = useState(null);

  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const [isFeedback, setIsFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchQuizSession = async () => {
    if (!user?._id) {
      setError("User not authenticated");
      toast.error("Please log in to view quiz session details");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/${sessionId}`,
        { params: { userId: user._id } }
      );
      if (response.data.quizSession) {
        setQuizSession(response.data.quizSession);
        setParticipants(
          response.data.quizSession.participants.filter(
            (p) => !p.disconnected && p.userId !== user?._id
          ) || []
        );
        const question =
          response.data.quizSession.quizId.questions[
            response.data.quizSession.currentQuestion.index
          ];

        setCurrentQuestion(question || null);
        setIsQuizStarted(response.data.quizSession.status !== "lobby");
        setError("");
      }
    } catch (err) {
      const message =
        err.response?.data?.error || "Failed to fetch quiz session";
      setError(message);
      console.error("Fetch quiz session error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!code || !sessionId || !username || !user?._id) {
      toast.error("Invalid quiz session or missing details");
      navigate("/activity/start-join");
      return;
    }
    fetchQuizSession();
    socket.auth = { userId: user._id, sessionId };
    socket.connect();

    let hasJoined = false;
    const onConnect = () => {
      if (!hasJoined) {
        console.log(`Connected to WebSocket server: ${socket.id}`);
        socket.emit("joinSession", sessionId);
        hasJoined = true;
      }
    };

    const onParticipantJoined = ({ sessionId: joinedId, participant }) => {
      if (sessionId === joinedId) {
        setParticipants((prev) =>
          prev.some(
            (p) => p.userId.toString() === participant.userId.toString()
          )
            ? prev
            : [...prev, participant]
        );
        toast.success(`${participant.name} joined the session!`);
      }
    };

    const onParticipantLeft = ({ sessionId: leftId, userId }) => {
      if (sessionId === leftId) {
        setParticipants((prev) => {
          const participant = prev.find(
            (p) => p.userId.toString() === userId.toString()
          );
          if (participant) {
            toast.success(`${participant.name} left the session`);
          }
          return prev.filter((p) => p.userId.toString() !== userId.toString());
        });
      }
    };

    const onCountdownStarted = ({ countdown }) => {
      // setCountdown(countdown);
      setAutoStartTimer(countdown);
    };

    const onCountdownStopped = () => {
      // setCountdown(null);
      setAutoStartTimer(null);
      toast.success("Countdown stopped");
    };

    const onQuizStarted = ({ sessionId, question, index, countdown }) => {
      setIsQuizStarted(true);
      // console.log("question ", quizSession?.quizId?.questions[0]);
      // setCurrentQuestion(quizSession?.quizId?.questions[0] || null);
      // setCountdown(quizSession?.currentQuestion.timeLimit);
      setCurrentQuestion(question);
      setCountdown(countdown);
      toast.success(`Quiz started! ${index + 1} question started`);
    };

    const onNextQuestion = ({ sessionId, question, index, countdown }) => {
      // if (sessionId === id && isMounted) {
      console.log("question", question, countdown);
      setCurrentQuestion(question);
      setCountdown(countdown);
      setFeedback(null);
      setAnswerFeedback(null);
      setShowCorrectAnswer(false);
      setSelectedAnswer(null);
      toast.success(`Question ${index + 1} started!`);
      // }
    };

    const onAnswerFeedback = ({
      isCorrect,
      correctAnswer,
      explanation,
      points,
      timeTaken,
      selectedOption,
    }) => {
      setFeedback({
        isCorrect,
        correctAnswer,
        explanation,
        points,
        timeTaken,
        selectedOption,
      });
      setShowCorrectAnswer(true);
    };

    const onQuizPaused = ({ sessionId }) => {
      // if (sessionId === sessionId) {
      setIsPaused(true);
      setCountdown(null);
      setShowCorrectAnswer(false);
      setSelectedAnswer(null);
      toast.success("Quiz paused by host");
      // }
    };

    const onQuizResumed = ({ sessionId, question, index, countdown }) => {
      // if (sessionId === sessionId) {
      setIsPaused(false);
      setCurrentQuestion(question);
      setCountdown(countdown);
      setShowCorrectAnswer(false);
      setSelectedAnswer(null);
      toast.success(`Quiz resumed! Question ${index + 1} started`);
      // }
    };

    const onSessionEnded = ({ sessionId: endedId, reason }) => {
      toast.success(`Quiz ended: ${reason}`);
      navigate("/activity/start-join");
    };

    const onRemoved = ({ message }) => {
      toast.error(message);
      navigate("/activity/start-join");
    };
    const onAllQuestionsCompleted = ({ sessionId, reason }) => {
      toast.success(reason);
      setIsFeedback(true);
      socket.disconnect();
      // toast.success(reason);
      // navigate(`/activity/user-result/${sessionId}`);
    };

    const onError = ({ message }) => {
      console.error("Socket error:", message);
      toast.error(message);
      setError(message);
      if (message.includes("not found") || message.includes("Invalid")) {
        navigate("/activity/start-join");
      }
      if (message.includes("Conflict") || message.includes("version")) {
        toast.error("Your answer wasn't saved. Please try again.");
      }
      toast.error(message);
    };

    socket.on("connect", onConnect);
    socket.on("participantJoined", onParticipantJoined);
    socket.on("participantLeft", onParticipantLeft);
    socket.on("countdownStarted", onCountdownStarted);
    socket.on("countdownStopped", onCountdownStopped);
    socket.on("quizStarted", onQuizStarted);
    socket.on("nextQuestion", onNextQuestion);
    socket.on("answerFeedback", onAnswerFeedback);
    socket.on("quizPaused", onQuizPaused);
    socket.on("quizResumed", onQuizResumed);
    socket.on("sessionEnded", onSessionEnded);
    socket.on("removed", onRemoved);
    socket.on("allQuestionsCompleted", onAllQuestionsCompleted);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("participantJoined", onParticipantJoined);
      socket.off("participantLeft", onParticipantLeft);
      socket.off("countdownStarted", onCountdownStarted);
      socket.off("countdownStopped", onCountdownStopped);
      socket.off("quizStarted", onQuizStarted);
      socket.off("nextQuestion", onNextQuestion);
      socket.off("answerFeedback", onAnswerFeedback);
      socket.off("quizPaused", onQuizPaused);
      socket.off("quizResumed", onQuizResumed);
      socket.off("sessionEnded", onSessionEnded);
      socket.off("removed", onRemoved);
      socket.off("allQuestionsCompleted", onAllQuestionsCompleted);
      socket.off("error", onError);
      socket.disconnect();
      hasJoined = false;
    };
  }, [code, sessionId, username, user, navigate, currentTheme, user]);

  useEffect(() => {
    let timer;
    if (autoStartTimer > 0) {
      timer = setTimeout(() => setAutoStartTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [autoStartTimer]);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (selectedAnswer !== null && currentQuestion) {
              socket.emit("submitAnswer", {
                sessionId,
                userId: user._id,
                questionId: currentQuestion._id,
                selectedOption: selectedAnswer,
              });
            } else {
              setFeedback({
                status: "timeout",
                message: "Time expired! No answer submitted.",
              });
              socket.emit("submitAnswer", {
                sessionId,
                userId: user._id,
                questionId: currentQuestion?._id,
                selectedOption: null,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, selectedAnswer, currentQuestion, sessionId, user]);

  // const handleReady = () => {
  //   const newReadyState = !userReady;
  //   setUserReady(newReadyState);
  //   socket.emit("participantReady", {
  //     sessionId,
  //     userId: user._id,
  //     ready: newReadyState,
  //   });
  // };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please provide a rating before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/feedback/create`,
        {
          quizSessionId: sessionId,
          userId: user._id,
          rating,
          comment: feedbackText,
        }
      );
      if (response.data) {
        setIsSubmitted(true);
        toast.success("Thank you for your feedback!");
        setTimeout(() => {
          setIsFeedback(false);
          navigate(`/activity/user-result/${sessionId}`);
        }, 2000);
      }
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = () => {
    socket.emit("leave-quiz");
    setShowLeaveDialog(false);
    toast.success("Left the quiz session");
    navigate("/activity/start-join");
  };

  const handleAnswerSubmit = (selectedOption) => {
    setSelectedAnswer(selectedOption);
    socket.emit("submitAnswer", {
      sessionId,
      userId: user._id,
      questionId: currentQuestion?._id,
      selectedOption,
    });
    setCountdown(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen error:", err));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error("Exit fullscreen error:", err));
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 p-4 sm:p-6 rounded-lg border border-white/5"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 md:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            {currentQuestion.question}
          </h3>
          {countdown !== null && (
            <motion.div
              className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.4,
                type: "spring",
                stiffness: 150,
              }}
            >
              <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#2dd4bf"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (276 * countdown) / 10}
                  animate={{
                    strokeDashoffset: 276 - (276 * countdown) / 10,
                  }}
                  transition={{ duration: 1, ease: "linear" }}
                  key={countdown}
                />
              </svg>
              <motion.div
                className="text-center"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <p className="text-xs sm:text-sm font-bold text-teal-300">
                  {countdown}
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>

        {renderContent(currentQuestion.content)}
        {renderOptions(currentQuestion)}
        {showCorrectAnswer && (
          <motion.div
            className="mt-4 p-4 bg-gradient-to-r from-gray-800 via-slate-800 to-gray-800 rounded-xl border border-blue-500/30 flex items-center justify-center space-x-3 shadow-lg"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <LockClockIcon
              className="w-6 h-6 text-blue-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <p className="text-sm sm:text-base text-gray-300 font-medium">
              Waiting for other participants
            </p>
            {/* Animated ellipsis for a dynamic waiting feel */}
            <div className="flex items-center space-x-1">
              <motion.span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.1,
                }}
              />
              <motion.span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              />
              <motion.span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
            </div>
          </motion.div>
        )}
        {isPaused && (
          <motion.div
            className="mt-4 p-4 bg-gradient-to-r from-gray-800 via-slate-800 to-gray-800 rounded-xl border border-yellow-500/30 flex items-center justify-center space-x-3 shadow-lg"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <PauseIcon className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <p className="text-sm sm:text-base text-gray-300 font-medium">
              Quiz is paused by the host...
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderOptions = (question) => {
    if (!question) return null;

    const getOptionClass = (idx) => {
      if (!showCorrectAnswer) {
        return selectedAnswer === idx
          ? "bg-purple-500/40 border-purple-400 shadow-lg ring-2 ring-purple-300/50"
          : "bg-white/10 hover:bg-white/20";
      }

      if (question.correctAnswer === idx)
        return "bg-green-500/40 border-green-400";
      if (selectedAnswer === idx && selectedAnswer !== question.correctAnswer)
        return "bg-red-500/40 border-red-400";
      return "bg-white/10";
    };

    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {question.options?.map((option, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  disabled={showCorrectAnswer}
                  className={`p-3 sm:p-4 rounded-lg transition-colors duration-200 border relative ${getOptionClass(
                    idx
                  )}`}
                  whileHover={{ scale: showCorrectAnswer ? 1 : 1.03 }}
                  whileTap={{ scale: showCorrectAnswer ? 1 : 0.97 }}
                >
                  <div className="flex items-start">
                    <div className="bg-white/20 text-white h-6 w-6 rounded flex items-center justify-center font-medium mr-2 sm:mr-3 mt-0.5 text-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    {typeof option === "object" && option.type === "image" ? (
                      <div>
                        <img
                          src={option.url}
                          alt="Option image"
                          className="max-w-full h-auto rounded-lg my-2"
                        />
                        {option.description && (
                          <p className="text-sm text-gray-300 mt-2">
                            {option.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base">{option}</p>
                    )}
                  </div>
                  {selectedAnswer === idx && !showCorrectAnswer && (
                    <motion.div
                      className="absolute top-2 right-2 h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckIcon className="text-white w-3 h-3" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            {!showCorrectAnswer && selectedAnswer !== null && !isPaused && (
              <motion.button
                onClick={() => handleAnswerSubmit(selectedAnswer)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Submit Answer
              </motion.button>
            )}
          </div>
        );
      case "true-false":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {["True", "False"].map((option, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx === 0 ? true : false)}
                  disabled={showCorrectAnswer}
                  className={`p-3 sm:p-4 rounded-lg transition-colors duration-200 border relative ${getOptionClass(
                    idx === 0 ? true : false
                  )}`}
                  whileHover={{ scale: showCorrectAnswer ? 1 : 1.03 }}
                  whileTap={{ scale: showCorrectAnswer ? 1 : 0.97 }}
                >
                  <div className="flex items-start">
                    <div className="bg-white/20 text-white h-6 w-6 rounded flex items-center justify-center font-medium mr-2 sm:mr-3 mt-0.5 text-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <p className="text-sm sm:text-base">{option}</p>
                  </div>
                  {selectedAnswer === (idx === 0 ? true : false) &&
                    !showCorrectAnswer && (
                      <motion.div
                        className="absolute top-2 right-2 h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckIcon className="text-white w-3 h-3" />
                      </motion.div>
                    )}
                </motion.button>
              ))}
            </div>
            {!showCorrectAnswer && selectedAnswer !== null && (
              <motion.button
                onClick={() => handleAnswerSubmit(selectedAnswer)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Submit Answer
              </motion.button>
            )}
            {showCorrectAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border ${
                  selectedAnswer === question.correctAnswer
                    ? "bg-green-900/30 border-green-400/30"
                    : "bg-red-900/30 border-red-400/30"
                }`}
              >
                <p
                  className={`${
                    selectedAnswer === question.correctAnswer
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  Correct answer: {question.correctAnswer ? "True" : "False"}
                </p>
                {question.explanation && (
                  <p className="text-sm text-gray-300 mt-1">
                    {question.explanation}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        );

      case "short-answer":
      case "fill-in-the-blank":
        return (
          <div className="space-y-3">
            <motion.div
              className="bg-white/10 p-3 sm:p-4 rounded-lg border border-white/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <input
                type="text"
                value={selectedAnswer ?? ""}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={showCorrectAnswer}
                placeholder="Type your answer..."
                className="w-full p-2 rounded bg-gray-800/50 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </motion.div>

            {!showCorrectAnswer && selectedAnswer && (
              <motion.button
                onClick={() => handleAnswerSubmit(selectedAnswer)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Submit Answer
              </motion.button>
            )}

            {showCorrectAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900/30 p-3 rounded-lg border border-green-400/30"
              >
                <p className="text-green-400">
                  Correct answer: {question.correctAnswer}
                </p>
                {question.explanation && (
                  <p className="text-sm text-green-300 mt-1">
                    {question.explanation}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderCorrectAnswer = (question) => {
    if (!question) return "N/A";
    switch (question.type) {
      case "multiple-choice":
        const correctIdx = question.correctAnswer;
        return question.options && question.options[correctIdx]
          ? `${String.fromCharCode(65 + question.correctAnswer)}. ${
              question.options[question.correctAnswer]
            }`
          : "N/A";
      case "true-false":
        return question.correctAnswer ? "True" : "False";
      case "short-answer":
      case "fill-in-the-blank":
        return question.correctAnswer || "N/A";
      default:
        return "N/A";
    }
  };

  const renderContent = (content) => {
    if (!content || !Array.isArray(content)) return null;
    return content.map((item, idx) => {
      switch (item.type) {
        case "text":
          return (
            <motion.p
              key={idx}
              className="text-sm sm:text-base text-gray-200 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              {item.value}
            </motion.p>
          );
        case "image":
          return (
            <motion.img
              key={idx}
              src={item.url}
              alt="Question content"
              className="max-w-full w-full sm:w-3/4 mx-auto h-auto rounded-xl shadow-lg my-3 sm:my-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
          );
        case "audio":
          return (
            <motion.audio
              key={idx}
              controls
              className="my-3 sm:my-4 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <source src={item.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </motion.audio>
          );
        case "video":
          return (
            <motion.video
              key={idx}
              controls
              className="max-w-full w-full sm:w-3/4 mx-auto h-auto rounded-xl shadow-lg my-3 sm:my-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <source src={item.url} type="video/mp4" />
              Your browser does not support the video element.
            </motion.video>
          );
        default:
          return null;
      }
    });
  };
  if (loading) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${currentTheme.bg}`}
      >
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-teal-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${currentTheme.bg}`}
      >
        <motion.div
          className={`text-red-400 text-lg sm:text-xl p-4 sm:p-6 ${currentTheme.card} backdrop-blur-md rounded-xl shadow-2xl border border-red-500/30`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error}
        </motion.div>
      </div>
    );
  }

  // ... (all imports, state, useEffect, and other functions remain unchanged)

  // Updated return statement
  return (
    <div
      className={`min-h-screen flex flex-col ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Header */}
      <motion.header
        className="p-4 sm:p-6 flex justify-between items-center bg-gradient-to-r from-teal-900/50 to-purple-900/50 backdrop-blur-lg sticky top-0 z-20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrophyIcon
              className={`text-3xl sm:text-4xl ${currentTheme.accent}`}
            />
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-pink-500">
            QuizMaster Live
          </h1>
        </div>
        <div className="flex gap-2 sm:gap-3 items-center">
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setThemeSelectorOpen(true)}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <PaletteIcon
              className={`text-2xl sm:text-3xl ${currentTheme.accent}`}
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10"
          >
            {isFullscreen ? (
              <FullscreenExitIcon
                className={`text-2xl sm:text-3xl ${currentTheme.accent}`}
              />
            ) : (
              <FullscreenIcon
                className={`text-2xl sm:text-3xl ${currentTheme.accent}`}
              />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm sm:text-base"
          >
            <CloseIcon fontSize="small" />
            Leave
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {isQuizStarted && currentQuestion ? (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
            key={currentQuestion._id}
          >
            {renderQuestion()}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quiz Info */}
            <motion.div
              className={`lg:col-span-2 ${currentTheme.card} backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10 shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${currentTheme.accent}`}
                  >
                    {quizSession?.quizId.title || "Quiz"}
                  </h2>
                  <p className="text-sm opacity-70 mt-1">
                    Hosted by: {quizSession?.hostId.name || "Unknown"}
                  </p>
                </div>
                <Chip
                  label={quizSession?.status || "Lobby"}
                  color={
                    quizSession?.status === "lobby" ? "primary" : "success"
                  }
                  size="small"
                  className="font-medium capitalize"
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <PeopleIcon fontSize="small" />
                  <span>
                    {participants.length + 1} /{" "}
                    {quizSession?.maxParticipants || 50}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TimerIcon fontSize="small" />
                  <span>
                    {quizSession?.quizId?.timeLimit || 30}s per question
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <EmojiEvents fontSize="small" />
                  <span>
                    Questions: {quizSession?.quizId?.questions.length || 0}
                  </span>
                </div>
              </div>
              <motion.div
                className="flex justify-center items-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {autoStartTimer !== null ? (
                  <motion.div
                    className="relative flex items-center justify-center w-40 h-40"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      type: "spring",
                      stiffness: 150,
                    }}
                  >
                    <svg className="absolute w-full h-full">
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={
                          currentTheme.accent.split("-")[1] === "teal"
                            ? "#2dd4bf"
                            : "#ec4899"
                        }
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="440"
                        strokeDashoffset={
                          440 - (440 * autoStartTimer) / (autoStartTimer + 1)
                        }
                        animate={{
                          strokeDashoffset:
                            440 - (440 * autoStartTimer) / (autoStartTimer + 1),
                        }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </svg>
                    <motion.div
                      className="text-center"
                      animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <p
                        className={`text-4xl font-bold ${currentTheme.accent}`}
                      >
                        {autoStartTimer}
                      </p>
                      <p className="text-sm font-medium text-gray-300">
                        {autoStartTimer > 0 ? "Seconds to Start" : "Starting!"}
                      </p>
                    </motion.div>
                  </motion.div>
                ) : (
                  <p className="text-center text-sm opacity-80">
                    Waiting for host to start the quiz...
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Participants */}
            <motion.div
              className={`${currentTheme.card} backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl lg:row-span-2`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-6 text-white">
                <PeopleIcon />
                Participants ({participants.length})
              </h3>
              <div className="overflow-y-auto flex-grow p-3 md:p-4 max-h-96">
                <AnimatePresence>
                  {participants.map((participant) => (
                    <motion.div
                      key={participant.userId}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className="flex items-center gap-3 p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl hover:bg-white/10 transition-all duration-200 mb-2"
                    >
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring" }}
                      >
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-purple-500/30"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 bg-${
                            participant.disconnected ? "red" : "green"
                          }-400 rounded-full w-3 h-3 md:w-4 md:h-4 border-2 border-gray-800`}
                        />
                      </motion.div>
                      <div className="flex-grow overflow-hidden">
                        <p className="font-medium truncate">
                          {participant.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Score: {participant.score}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              className={`${currentTheme.card} backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10 shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4">
                Quiz Details
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Join Code:</span> {code}
                </p>
                <p>
                  <span className="font-medium">Created At:</span>{" "}
                  {quizSession?.createdAt
                    ? new Date(quizSession.createdAt).toLocaleString()
                    : "N/A"}
                </p>
                <p>
                  <span className="font-medium">Ready Players:</span>{" "}
                  {participants.filter((p) => p.ready).length}/
                  {participants.length}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Ready Button */}
      {!isQuizStarted && (
        <motion.div
          className="fixed bottom-6 left-0 right-0 flex justify-center"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
        >
          <motion.button
            onClick={() => setUserReady((prev) => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${
              userReady ? "bg-green-500" : currentTheme.button
            } text-white px-8 py-4 rounded-full shadow-xl flex items-center gap-3 relative overflow-hidden text-sm sm:text-base`}
          >
            {userReady && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            <motion.div
              animate={{ rotate: userReady ? 0 : 360 }}
              transition={{ duration: 0.5 }}
            >
              <ReadyIcon className="text-lg sm:text-xl" />
            </motion.div>
            <span className="font-medium">
              {userReady ? "Ready!" : "Mark as Ready"}
            </span>
            {userReady && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Connection Status */}
      <motion.div
        className="fixed bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`w-2 h-2 rounded-full ${
            socket.connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {socket.connected ? "Connected" : "Connecting..."}
      </motion.div>

      {/* Theme Selector */}
      <AnimatePresence>
        {themeSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-6"
            onClick={() => setThemeSelectorOpen(false)}
          >
            <motion.div
              className={`${currentTheme.card} backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border border-white/20 bg-gradient-to-br from-teal-900/30 to-purple-900/30`}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center text-white">
                Select Theme
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    whileHover={{
                      scale: 1.1,
                      boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center ${
                      theme.bg
                    } ${
                      currentTheme.name === theme.name
                        ? "ring-2 ring-teal-400 shadow-lg"
                        : ""
                    } transition-all duration-300 border border-white/20`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentTheme(theme);
                      setThemeSelectorOpen(false);
                    }}
                  >
                    <span className="font-semibold text-sm sm:text-base text-white">
                      {theme.name}
                    </span>
                    {currentTheme.name === theme.name && (
                      <CheckIcon className="mt-2 w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                    )}
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setThemeSelectorOpen(false)}
                className="mt-4 sm:mt-6 w-full bg-red-600 hover:bg-red-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-white font-semibold text-sm sm:text-base transition-all duration-300 shadow-md"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Dialog */}
      <Dialog
        open={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        PaperProps={{
          className: `backdrop-blur-lg rounded-xl ${currentTheme.card} ${currentTheme.text} bg-gradient-to-br from-teal-900/30 to-purple-900/30`,
          style: {
            backgroundColor: currentTheme.cssCard,
            border: "1px solid rgba(255,255,255,0.2)",
            color: currentTheme.cssText,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <CloseIcon className="text-red-400 w-5 h-5 sm:w-6 sm:h-6" />
          Leave Quiz?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            className={`text-sm sm:text-base ${currentTheme.text}`}
            style={{ color: currentTheme.cssText }}
          >
            Are you sure you want to leave the quiz? Your progress will not be
            saved.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-3 sm:p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLeaveDialog(false)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg ${currentTheme.button} text-white font-semibold text-sm sm:text-base shadow-md transition-all duration-300`}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeave}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm sm:text-base shadow-md transition-all duration-300"
            autoFocus
          >
            Leave
          </motion.button>
        </DialogActions>
      </Dialog>

      {feedback && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setFeedback(null)}
        >
          <motion.div
            className={`relative shadow-2xl ${
              feedback?.isCorrect ? "bg-emerald-800/90" : "bg-rose-800/90"
            } p-6 rounded-2xl max-w-md w-full border border-white/10`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={`text-3xl font-bold mb-4 text-center ${
                feedback?.isCorrect ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {feedback?.isCorrect ? "✅ Correct!" : "❌ Incorrect"}
            </h2>

            <div className="mb-4 text-white space-y-1 text-sm sm:text-base">
              <p>
                <span className="font-semibold text-gray-200">
                  Your answer:
                </span>{" "}
                {feedback?.selectedOption}
              </p>
              <p>
                <span className="font-semibold text-gray-200">
                  Correct answer:
                </span>{" "}
                {feedback?.correctAnswer}
              </p>
            </div>

            {feedback?.explanation && (
              <motion.div
                className="bg-white/10 p-4 rounded-lg text-yellow-100 text-sm border border-yellow-300/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                💡 {feedback.explanation}
              </motion.div>
            )}

            <button
              onClick={() => setFeedback(null)}
              className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all font-medium tracking-wide"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}

      {isFeedback && !isSubmitted && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-gray-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl max-w-lg w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
            >
              Share Your Feedback
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 mb-6"
            >
              How was your experience with the quiz?
            </motion.p>
            <form onSubmit={handleSubmitFeedback}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center items-center mb-6"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    whileHover={{ scale: 1.2, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    className="cursor-pointer"
                  >
                    {(hoverRating || rating) >= star ? (
                      <StarIcon
                        className="text-yellow-400"
                        style={{ fontSize: "2.5rem" }}
                      />
                    ) : (
                      <StarBorderIcon
                        className="text-gray-500"
                        style={{ fontSize: "2.5rem" }}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us more about your experience (optional)..."
                  className="w-full h-32 p-4 bg-gray-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-none transition-all duration-300 placeholder-gray-500"
                />
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <SendIcon />
                    Submit Feedback
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
      {isFeedback && isSubmitted && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-gray-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl max-w-lg w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-400"
            >
              <CheckCircle
                className="text-green-400"
                style={{ fontSize: "3rem" }}
              />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-400">
              Your feedback has been received. We appreciate you taking the time
              to help us improve.
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default QuizWaitingRoom;
