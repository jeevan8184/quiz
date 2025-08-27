import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { themes } from "~/components/constants";
import { CircularProgress } from "@mui/material";

// Corrected Material-UI Icon Imports
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PeopleIcon from "@mui/icons-material/People";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandIcon from "@mui/icons-material/Expand";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckIcon from "@mui/icons-material/Check";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrow from "@mui/icons-material/PlayArrow";
import ShareIcon from "@mui/icons-material/Share";
import UsersIcon from "@mui/icons-material/People";
import TrophyIcon from "@mui/icons-material/EmojiEvents";
import PlayIcon from "@mui/icons-material/PlayArrow";
import CopyIcon from "@mui/icons-material/ContentCopy";

const socket = io(`${import.meta.env.VITE_SERVER_URL}`, { autoConnect: false });

const StartQuizSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.reducer.currentUser);
  const [quizSession, setQuizSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoStart, setAutoStart] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(themes.dark);
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [autoStartTimer, setAutoStartTimer] = useState(null);
  const [removeParticipantDialogOpen, setRemoveParticipantDialogOpen] =
    useState(false);
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [isHostControl, setIsHostControl] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [countdown, setCountdown] = useState(null);
  // const [answerFeedback, setAnswerFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [currentQuestionStats, setCurrentQuestionStats] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({
    players: [],
    questionIndex: 0,
    totalQuestions: 0,
    timestamp: null,
  });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteMethod, setInviteMethod] = useState("email");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);

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
        `${import.meta.env.VITE_SERVER_URL}/api/quiz-session/${id}`,
        {
          params: { userId: user._id },
        }
      );
      console.log("Quiz session data:", response.data);
      if (response.data?.ended) {
        toast("Quiz session has ended");
        navigate(-1);
        return;
      }
      setUsers(response.data.users || []);

      if (response.data.quizSession && response.data.quizSession.quizId) {
        setQuizSession(response.data.quizSession);
        setParticipants(
          response.data.quizSession.participants.filter(
            (p) => !p.disconnected
          ) || []
        );
        setQuizQuestions(response.data.quizSession.quizId.questions || []);
        setIsPaused(response.data.quizSession.status === "paused");
        setError("");

        // setCurrentQuestionIndex(
        //   response.data.quizSession.currentQuestion?.index || 0
        // );
      }
    } catch (err) {
      const message =
        err.response?.data?.error || "Failed to fetch quiz session";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (id && user?._id) {
      fetchQuizSession();

      socket.auth = { userId: user._id, sessionId: id };
      socket.connect();

      const onConnect = () => {
        console.log(`Connected to WebSocket server: ${socket.id}`);
        socket.emit("joinSession", id);
      };

      const onParticipantJoined = ({ sessionId, participant }) => {
        if (sessionId === id && isMounted) {
          setParticipants((prev) => {
            if (
              !prev.some(
                (p) => p.userId.toString() === participant.userId.toString()
              )
            ) {
              toast.success(`${participant.name} joined the session!`);
              return [...prev, { ...participant, disconnected: false }];
            }
            return prev;
          });
        }
      };

      const onParticipantLeft = ({ sessionId, userId }) => {
        if (sessionId === id && isMounted) {
          setParticipants((prev) => {
            const participant = prev.find(
              (p) => p.userId.toString() === userId.toString()
            );
            if (participant) {
              toast.success(`${participant.name} left the session`);
            }
            return prev.filter(
              (p) => p.userId.toString() !== userId.toString()
            );
          });
        }
      };

      const onCountdownStarted = ({ countdown }) => {
        setAutoStart(true);
        setAutoStartTimer(countdown);
        // setCountdown(countdown);
        toast.success(`Quiz starting in ${countdown} seconds!`);
      };

      const onCountdownStopped = () => {
        if (isMounted) {
          setAutoStart(false);
          setAutoStartTimer(null);
          // setCountdown(null);
          toast.success("Quiz countdown stopped");
        }
      };

      const onQuizStarted = ({ sessionId, question, index, countdown }) => {
        if (sessionId === id && isMounted) {
          setIsHostControl(true);
          setIsPaused(false);
          setCountdown(countdown);
          setCurrentQuestionIndex(index);
          toast.success(`Quiz started! ${index + 1} question started`);
        }
      };

      const onCountdownUpdated = ({ countdown }) => {
        if (isMounted) setCountdown(countdown);
      };

      const onQuizPaused = ({ sessionId }) => {
        if (sessionId === id && isMounted) {
          setIsPaused(true);
          setCountdown(null);
          toast.success("Quiz paused");
        }
      };

      const onQuizResumed = ({ sessionId }) => {
        if (sessionId === id && isMounted) {
          setIsPaused(false);
          // setCountdown(10);
          toast.success("Quiz resumed");
        }
      };

      const onNextQuestion = ({ sessionId, question, index, countdown }) => {
        // if (sessionId === id && isMounted) {
        setCurrentQuestionStats([]);
        setCurrentQuestionIndex(index);
        setShowCorrectAnswer(false);
        // setAnswerFeedback(null);
        setQuizQuestions((prev) => {
          const updatedQuestions = [...prev];
          updatedQuestions[index] = question;
          return updatedQuestions;
        });
        setCountdown(countdown);

        toast.success(`Question ${index + 1} started! countdown:${countdown}`);
        // }
      };

      const onLeaderboardUpdate = (data) => {
        setLeaderboardData({
          players: Object.values(data.leaderboard),
          questionIndex: data.questionIndex,
          totalQuestions: data.totalQuestions,
          timestamp: data.timestamp,
        });
      };

      const onAllAnswersSubmitted = ({ sessionId, answers }) => {
        if (sessionId === id && isMounted) {
          const answeringParticipants = answers.map((a) => a.userId);
          const answerStats =
            quizQuestions[currentQuestionIndex]?.options?.map((_, idx) => {
              const usersAnswered = answers.filter(
                (a) => a?.selectedAnswer === idx
              ).length;
              return {
                count: usersAnswered,
                percentage:
                  answeringParticipants.length > 0
                    ? Math.round(
                        (usersAnswered / answeringParticipants.length) * 100
                      )
                    : 0,
              };
            }) ||
            (quizQuestions[currentQuestionIndex]?.type === "true-false"
              ? [
                  {
                    count: answers.filter((a) => a?.selectedAnswer === true)
                      .length,
                    percentage:
                      answeringParticipants.length > 0
                        ? Math.round(
                            (answers.filter((a) => a?.selectedAnswer === true)
                              .length /
                              answeringParticipants.length) *
                              100
                          )
                        : 0,
                  },
                  {
                    count: answers.filter((a) => a?.selectedAnswer === false)
                      .length,
                    percentage:
                      answeringParticipants.length > 0
                        ? Math.round(
                            (answers.filter((a) => a?.selectedAnswer === false)
                              .length /
                              answeringParticipants.length) *
                              100
                          )
                        : 0,
                  },
                ]
              : []);

          setCurrentQuestionStats(answerStats);
          setShowCorrectAnswer(true);

          setCountdown(null);
        }
      };

      const onSessionEnded = ({ sessionId, reason }) => {
        if (sessionId === id && isMounted) {
          toast.success(`Quiz ended: ${reason}`);
          navigate(-1);
        }
      };

      const onError = ({ message }) => {
        if (isMounted) {
          toast.error(message);
          if (message.includes("not found") || message.includes("Invalid")) {
            navigate(-1);
          }
        }
      };

      const onAllQuestionsCompleted = ({ sessionId, reason }) => {
        toast.success(reason);
        navigate(`/activity/host-result/${sessionId}`);
      };

      socket.on("connect", onConnect);
      socket.on("participantJoined", onParticipantJoined);
      socket.on("participantLeft", onParticipantLeft);
      socket.on("countdownStarted", onCountdownStarted);
      socket.on("countdownStopped", onCountdownStopped);
      socket.on("quizStarted", onQuizStarted);
      socket.on("countdownUpdated", onCountdownUpdated);
      socket.on("quizPaused", onQuizPaused);
      socket.on("quizResumed", onQuizResumed);
      socket.on("nextQuestion", onNextQuestion);
      socket.on("leaderboardUpdate", onLeaderboardUpdate);
      socket.on("allAnswersSubmitted", onAllAnswersSubmitted);
      socket.on("sessionEnded", onSessionEnded);
      socket.on("error", onError);
      socket.on("allQuestionsCompleted", onAllQuestionsCompleted);

      return () => {
        isMounted = false;
        socket.off("connect");
        socket.off("participantJoined");
        socket.off("participantLeft");
        socket.off("countdownStarted");
        socket.off("countdownStopped");
        socket.off("quizStarted");
        socket.off("countdownUpdated");
        socket.off("quizPaused");
        socket.off("quizResumed");
        socket.off("nextQuestion");
        socket.off("leaderboardUpdate");
        socket.off("allAnswersSubmitted", onAllAnswersSubmitted);
        socket.off("sessionEnded");
        socket.off("error");
        socket.on("allQuestionsCompleted", onAllQuestionsCompleted);
        socket.disconnect();
      };
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (showCorrectAnswer) {
      const timer = setTimeout(() => {
        socket.emit("nextQuestion", {
          sessionId: id,
          adminId: user._id,
          questionIndex: currentQuestionIndex + 1,
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showCorrectAnswer, currentQuestionIndex, id, user]);

  useEffect(() => {
    let timer;
    if (autoStart && autoStartTimer > 0 && participants.length > 0) {
      timer = setTimeout(() => setAutoStartTimer((prev) => prev - 1), 1000);
    } else if (autoStart && autoStartTimer <= 0) {
      handleStartQuiz();
    }
    return () => clearTimeout(timer);
  }, [autoStart, autoStartTimer, participants.length]);

  useEffect(() => {
    let timer;
    if (
      countdown !== null &&
      countdown > 0 &&
      !isPaused &&
      quizQuestions.length > 0 &&
      !showCorrectAnswer
    ) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // socket.emit("collectAnswers", { sessionId: id, adminId: user._id });
            // socket.emit("nextQuestion", {
            //   sessionId: id,
            //   adminId: user._id,
            //   questionIndex: currentQuestionIndex + 1,
            // });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, isPaused, quizQuestions.length, showCorrectAnswer, id, user]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (inviteMethod === "email" && !inviteeEmail) {
      toast.error("Please enter an email address");
      return;
    }
    if (inviteMethod === "userId" && selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    try {
      const inviteLink = `${window.location.origin}/activity/start-join?code=${quizSession?.code}`;
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/schedule/session/invite`,
        {
          sessionId: id,
          inviteeEmail: inviteMethod === "email" ? inviteeEmail : null,
          inviteeIds: inviteMethod === "userId" ? selectedUsers : [],
          inviteLink,
          quizTitle: quizSession?.quizId?.title,
          inviteMethod,
        }
      );
      toast.success(`Invitation sent!`);
      setInviteModalOpen(false);
      setInviteeEmail("");
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send invitation");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSetTimer = (seconds) => {
    socket.emit("startQuizCountdown", {
      sessionId: id,
      countdown: seconds,
      adminId: user._id,
    });
    setIsTimerDialogOpen(false);
  };

  const handleStartQuiz = () => {
    console.log("participants", participants);
    if (participants.length > 0) {
      setAutoStart(false);
      socket.emit("startQuiz", { sessionId: id, adminId: user._id });
      setCountdown(5);
    } else {
      toast(`No participants ${participants.length}`);
    }
  };

  const handleAutoStart = () => {
    if (autoStart) {
      socket.emit("stopQuizCountdown", { sessionId: id, adminId: user._id });
    } else {
      setIsTimerDialogOpen(true);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      socket.emit("resumeQuiz", { sessionId: id, adminId: user._id });
    } else {
      socket.emit("pauseQuiz", { sessionId: id, adminId: user._id });
    }
  };

  const handleEndQuiz = () => {
    setEndDialogOpen(false);
    socket.emit("endQuiz", { sessionId: id, adminId: user._id });
    toast.success("Quiz session ended!");
    navigate(-1);
  };

  const handleRestartQuestion = () => {
    setShowCorrectAnswer(false);
    setCurrentQuestionStats([]);
    socket.emit("restartQuestion", {
      sessionId: id,
      adminId: user._id,
      questionId: quizQuestions[currentQuestionIndex]._id,
    });
    toast.success("Question restarted!");
  };

  const handleSkipQuestion = () => {
    setShowCorrectAnswer(false);
    setCurrentQuestionStats([]);
    socket.emit("skipQuestion", { sessionId: id, adminId: user._id });
    toast.success("Question skipped!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quizSession?.code);
    toast.success("Quiz session code copied to clipboard!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `http://localhost:5173/activity/start-join?code=${quizSession?.code}`
    );
    toast.success("Join link copied to clipboard!");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleRemoveParticipant = (participant) => {
    setParticipantToRemove(participant);
    setRemoveParticipantDialogOpen(true);
  };

  const confirmRemoveParticipant = () => {
    if (participantToRemove) {
      socket.emit("removeParticipant", {
        sessionId: id,
        userId: participantToRemove.userId,
        adminId: user._id,
      });
      toast.success(
        `${participantToRemove.name} has been removed from the session`
      );
      setRemoveParticipantDialogOpen(false);
      setParticipantToRemove(null);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = (content) => {
    if (!content || !Array.isArray(content)) return null;
    return content.map((item, idx) => {
      if (!item || !item.type) return null;
      switch (item.type) {
        case "text":
          return (
            <p key={idx} className="text-sm sm:text-base text-gray-300">
              {item.value}
            </p>
          );
        case "image":
          return (
            <img
              key={idx}
              src={item.url}
              alt="Question content"
              className="max-w-full h-auto rounded-lg my-2"
            />
          );
        case "audio":
          return (
            <audio key={idx} controls className="my-2">
              <source src={item.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          );
        case "video":
          return (
            <video
              key={idx}
              controls
              className="max-w-full h-auto rounded-lg my-2"
            >
              <source src={item.url} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          );
        default:
          return null;
      }
    });
  };

  const renderOptions = (question) => {
    if (!question) return null;
    const answeringParticipants = leaderboardData.players.filter(
      (p) => p?.selectedAnswer !== null && p?.selectedAnswer !== undefined
    ).length;
    const options =
      question.type === "true-false" ? [true, false] : question.options;

    return (
      <div className="space-y-4">
        {options?.map((option, idx) => {
          const isCorrectAnswer =
            question.type === "true-false"
              ? option === question.correctAnswer
              : idx === question.correctAnswer;
          const choseThisOption =
            question.type === "true-false"
              ? leaderboardData.players.filter(
                  (p) => p.selectedAnswer === option
                ).length
              : leaderboardData.players.filter((p) => p.selectedAnswer === idx)
                  .length;
          const percentage =
            answeringParticipants > 0
              ? Math.round((choseThisOption / answeringParticipants) * 100)
              : 0;
          const userSelectedThis =
            question.type === "true-false"
              ? leaderboardData.players.some(
                  (p) => p.userId === user?._id && p.selectedAnswer === option
                )
              : leaderboardData.players.some(
                  (p) => p.userId === user?._id && p.selectedAnswer === idx
                );

          return (
            <div
              key={idx}
              className={`relative p-4 rounded-xl border-2  ${
                showCorrectAnswer
                  ? isCorrectAnswer
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-500/30 bg-gray-700/20"
                  : "border-gray-300/20 hover:border-gray-300/40 bg-white/5"
              } ${userSelectedThis ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex items-start">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold ${
                    showCorrectAnswer && isCorrectAnswer
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {question.type === "true-false"
                    ? option
                      ? "T"
                      : "F"
                    : String.fromCharCode(65 + idx)}
                </div>
                <div className="flex-grow">
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
                    <p className="text-base font-medium">
                      {question.type === "true-false"
                        ? option
                          ? "True"
                          : "False"
                        : option}
                    </p>
                  )}
                  {showCorrectAnswer && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {choseThisOption}{" "}
                          {choseThisOption === 1 ? "person" : "people"}
                        </span>
                        <span className="text-xs font-medium">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isCorrectAnswer ? "bg-emerald-400" : "bg-gray-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {showCorrectAnswer && isCorrectAnswer && (
                  <CheckCircleIcon className="w-6 h-6 text-emerald-500 ml-2" />
                )}
              </div>
              {userSelectedThis && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center">
                  <UsersIcon className="w-3 h-3 mr-1" />
                  You
                </div>
              )}
            </div>
          );
        })}
        {showCorrectAnswer && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total participants</p>
                <p className="text-xl font-bold">
                  {leaderboardData.players.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Answered this question</p>
                <p className="text-xl font-bold">{answeringParticipants}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-400">Correct answer</p>
              <p className="text-lg font-medium text-emerald-400">
                {question.type === "true-false"
                  ? question.correctAnswer
                    ? "True"
                    : "False"
                  : question.options[question.correctAnswer]?.url
                  ? "Image " + String.fromCharCode(65 + question.correctAnswer)
                  : `${String.fromCharCode(65 + question.correctAnswer)}. ${
                      question.options[question.correctAnswer]
                    }`}
              </p>
            </div>
          </div>
        )}
      </div>
    );
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#24243e]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#24243e]">
        <div className="text-red-400 text-xl p-6 bg-white/10 backdrop-blur-md rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  if (!quizSession) return null;

  return (
    <div
      className={`min-h-screen pb-20 sm:pb-40 flex flex-col sm:flex-row ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Sidebar */}
      <div
        className={`max-sm:hidden max-sm:p-0 sm:fixed sm:top-0 sm:left-0 sm:h-full sm:w-64 md:w-72 lg:w-80 ${currentTheme.card} backdrop-blur-md p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl flex flex-col transition-all duration-300 overflow-y-auto sm:z-40 max-sm:mt-4 max-sm:rounded-xl max-sm:border max-sm:border-white/10`}
      >
        <div className="border-b border-white/20 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <UsersIcon className={currentTheme.accent} />
            <span className={currentTheme.accent}>Participants</span>
            <span
              className={`ml-auto ${currentTheme.accent}/20 ${currentTheme.accent} px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm`}
            >
              {participants.length}
            </span>
          </h3>
        </div>
        <div className="flex-grow">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 md:p-3 bg-white/5 rounded-md sm:rounded-lg md:rounded-xl hover:bg-white/10 transition-all duration-200 mb-1.5 sm:mb-2"
            >
              <div className="relative">
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 rounded-full object-cover border-2 border-purple-500/30"
                />
                <div
                  className={`absolute -bottom-0.5 -right-0.5 bg-${
                    participant.disconnected ? "red" : "green"
                  }-400 rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 border-1.5 sm:border-2 border-gray-800`}
                />
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="font-medium truncate text-sm sm:text-base">
                  {participant.name}
                </p>
                <p className="text-xs text-gray-400">
                  Score: {participant.score}
                </p>
              </div>
              <button
                onClick={() => handleRemoveParticipant(participant)}
                className="text-red-400 hover:text-red-600"
              >
                <DeleteIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 sm:mt-4">
          <h4 className="text-sm sm:text-base font-bold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <TrophyIcon className={currentTheme.accent} />
            Quiz Session Info
          </h4>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <div className="font-medium">Title:</div>
            <div className="truncate">
              {quizSession?.quizId?.title || "Loading..."}
            </div>
            <div className="font-medium">Subject:</div>
            <div>{quizSession?.quizId?.subject || "General"}</div>
            <div className="font-medium">Questions:</div>
            <div>{quizSession?.quizId?.questions?.length || 0}</div>
            <div className="font-medium">Duration:</div>
            <div>{quizSession?.quizId?.duration || 30} min</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow mt-64 max-sm:mt-0 sm:mt-0 sm:ml-64 md:ml-72 lg:ml-80">
        {!isHostControl ? (
          <div
            className={`min-h-screen p-3 sm:p-4 md:p-6 flex flex-col ${currentTheme.bg} ${currentTheme.text}`}
          >
            <motion.header
              className="flex items-center sm:flex-row justify-between mb-4 sm:mb-6 md:mb-10"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <TrophyIcon
                    className={`text-3xl sm:text-4xl md:text-5xl ${currentTheme.accent}`}
                  />
                </motion.div>
                <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                  QuizMaster Live
                </h1>
              </div>
              <div className="flex gap-2 sm:gap-4 items-center mt-2 sm:mt-0">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PaletteIcon
                    className={`cursor-pointer ${currentTheme.accent} hover:text-pink-400 w-5 h-5 sm:w-6 sm:h-6`}
                    onClick={() => setThemeSelectorOpen(true)}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ExpandIcon
                    className={`cursor-pointer ${currentTheme.accent} hover:text-pink-400 w-5 h-5 sm:w-6 sm:h-6`}
                    onClick={toggleFullscreen}
                  />
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEndDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 md:p-3 rounded-full font-semibold transition-all flex items-center justify-center"
                >
                  <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </motion.button>
              </div>
            </motion.header>

            <AnimatePresence>
              {themeSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4"
                  onClick={() => setThemeSelectorOpen(false)}
                >
                  <motion.div
                    className={`${currentTheme.card} backdrop-blur-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-md`}
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: 20, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">
                      Select Theme
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {Object.entries(themes).map(([key, theme]) => (
                        <motion.button
                          key={key}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`p-3 sm:p-4 rounded-lg sm:rounded-xl flex flex-col items-center justify-center ${
                            theme.bg
                          } ${
                            currentTheme.name === theme.name
                              ? "ring-2 ring-white"
                              : ""
                          }`}
                          onClick={() => {
                            setCurrentTheme(theme);
                            setThemeSelectorOpen(false);
                          }}
                        >
                          <span className="font-medium text-sm sm:text-base">
                            {theme.name}
                          </span>
                          {currentTheme.name === theme.name && (
                            <CheckIcon className="mt-2 w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setThemeSelectorOpen(false)}
                      className="mt-4 sm:mt-6 w-full bg-red-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-white font-semibold text-sm sm:text-base"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <Dialog
              open={endDialogOpen}
              onClose={() => setEndDialogOpen(false)}
              PaperProps={{
                className: `backdrop-blur-lg rounded-2xl ${currentTheme.card} ${currentTheme.text}`,
                style: {
                  backgroundColor: currentTheme.cssCard,
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: currentTheme.cssText,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <CloseIcon className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
                End Quiz Session?
              </DialogTitle>
              <DialogContent>
                <DialogContentText
                  className={`${currentTheme.text}`}
                  style={{ color: currentTheme.cssText }}
                >
                  Are you sure you want to end this quiz session? All
                  participants will be disconnected and scores will be lost.
                </DialogContentText>
              </DialogContent>
              <DialogActions className="p-3 sm:p-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEndDialogOpen(false)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg ${currentTheme.button} text-white font-medium text-sm sm:text-base shadow-md`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEndQuiz}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm sm:text-base shadow-md"
                  autoFocus
                >
                  End Quiz
                </motion.button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={isTimerDialogOpen}
              onClose={() => setIsTimerDialogOpen(false)}
              PaperProps={{
                className: `backdrop-blur-lg rounded-2xl ${currentTheme.card} ${currentTheme.text}`,
                style: {
                  backgroundColor: currentTheme.cssCard,
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: currentTheme.cssText,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <PlayIcon className={currentTheme.accent} />
                Set Auto Start Timer
              </DialogTitle>
              <DialogContent>
                <DialogContentText
                  className={currentTheme.text}
                  style={{ color: currentTheme.cssText }}
                >
                  Select the countdown duration for auto-starting the quiz.
                </DialogContentText>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4">
                  {[10, 30, 60, 90, 120, 180].map((seconds) => (
                    <motion.button
                      key={seconds}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetTimer(seconds)}
                      className={`relative p-2 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 ${currentTheme.accent} flex items-center justify-center text-xs sm:text-sm md:text-base font-medium`}
                    >
                      <motion.svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 36 36"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: seconds,
                          repeat: 0,
                          ease: "linear",
                        }}
                      >
                        <path
                          className={`fill-none stroke-${
                            currentTheme.accent.split("-")[1]
                          } stroke-[2]`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          strokeDasharray="100, 100"
                        />
                      </motion.svg>
                      {seconds}s
                    </motion.button>
                  ))}
                </div>
              </DialogContent>
              <DialogActions className="p-3 sm:p-4">
                <Button
                  onClick={() => setIsTimerDialogOpen(false)}
                  className={`${currentTheme.button} text-white rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base`}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={removeParticipantDialogOpen}
              onClose={() => setRemoveParticipantDialogOpen(false)}
              PaperProps={{
                className: `backdrop-blur-lg rounded-2xl ${currentTheme.card} ${currentTheme.text}`,
                style: {
                  backgroundColor: currentTheme.cssCard,
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: currentTheme.cssText,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <DeleteIcon className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
                Remove Participant?
              </DialogTitle>
              <DialogContent>
                <DialogContentText
                  className={`${currentTheme.text}`}
                  style={{ color: currentTheme.cssText }}
                >
                  Are you sure you want to remove {participantToRemove?.name}{" "}
                  from the quiz session? They will be disconnected and need to
                  rejoin with the code.
                </DialogContentText>
              </DialogContent>
              <DialogActions className="p-3 sm:p-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRemoveParticipantDialogOpen(false)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg ${currentTheme.button} text-white font-medium text-sm sm:text-base shadow-md`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmRemoveParticipant}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm sm:text-base shadow-md"
                  autoFocus
                >
                  Remove
                </motion.button>
              </DialogActions>
            </Dialog>

            <AnimatePresence>
                         {" "}
              {inviteModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setInviteModalOpen(false)}
                >
                                 {" "}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700/50"
                  >
                                     {" "}
                    <h3 className="text-lg font-semibold text-white mb-4">
                                          Invite to {quizSession?.quizId?.title}
                                       {" "}
                    </h3>
                                     {" "}
                    <div className="flex gap-2 mb-4">
                                         {" "}
                      <button
                        onClick={() => setInviteMethod("email")}
                        className={`flex-1 p-2 rounded-lg ${
                          inviteMethod === "email"
                            ? "bg-cyan-600/50 text-white"
                            : "bg-slate-700/50 text-slate-300"
                        }`}
                      >
                                              Email                    {" "}
                      </button>
                                         {" "}
                      <button
                        onClick={() => setInviteMethod("userId")}
                        className={`flex-1 p-2 rounded-lg ${
                          inviteMethod === "userId"
                            ? "bg-cyan-600/50 text-white"
                            : "bg-slate-700/50 text-slate-300"
                        }`}
                      >
                                              User                    {" "}
                      </button>
                                       {" "}
                    </div>
                                     {" "}
                    {inviteMethod === "email" ? (
                      <input
                        type="email"
                        value={inviteeEmail}
                        onChange={(e) => setInviteeEmail(e.target.value)}
                        placeholder="Enter invitee's email"
                        className="w-full p-2 rounded-lg bg-slate-900/50 text-white border border-slate-600 focus:border-cyan-400 outline-none mb-4"
                      />
                    ) : (
                      <div>
                                             {" "}
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search users by name or email"
                          className="w-full p-2 rounded-lg bg-slate-900/50 text-white border border-slate-600 focus:border-cyan-400 outline-none mb-4"
                        />
                                             {" "}
                        <div className="max-h-60 overflow-y-auto space-y-2">
                                                 {" "}
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => (
                              <div
                                key={u._id}
                                className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg cursor-pointer hover:bg-slate-900/50"
                                onClick={() => toggleUserSelection(u._id)}
                              >
                                                             {" "}
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(u._id)}
                                  readOnly
                                  className="w-4 h-4 text-cyan-400 bg-slate-700 border-slate-600 rounded"
                                />
                                                             {" "}
                                <img
                                  src={
                                    u.picture ||
                                    `https://api.dicebear.com/6.x/initials/svg?seed=${u.name
                                      .charAt(0)
                                      .toUpperCase()}&size=40`
                                  }
                                  alt={u.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                                             {" "}
                                <div>
                                                                 {" "}
                                  <p className="text-sm text-white">{u.name}</p>
                                                                 {" "}
                                  <p className="text-xs text-slate-400">
                                    {u.email}
                                  </p>
                                                               {" "}
                                </div>
                                                           {" "}
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 text-sm">
                              No users found
                            </p>
                          )}
                                             {" "}
                        </div>
                                         {" "}
                      </div>
                    )}
                                   {" "}
                    <div className="flex gap-2 mt-4">
                                       {" "}
                      <motion.button
                        onClick={handleInvite}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 bg-cyan-600/50 hover:bg-cyan-600/70 text-white px-4 py-2 rounded-lg"
                      >
                                            Send Invite                  {" "}
                      </motion.button>
                                       {" "}
                      <motion.button
                        onClick={() => setInviteModalOpen(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 text-white px-4 py-2 rounded-lg"
                      >
                                            Cancel                  {" "}
                      </motion.button>
                                     {" "}
                    </div>
                                 {" "}
                  </motion.div>
                             {" "}
                </motion.div>
              )}
                     {" "}
            </AnimatePresence>

            <motion.div
              className={`${currentTheme.card} backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl flex-grow flex flex-col transition-all duration-300`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
                <div className="text-center lg:text-left w-full">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <p className="text-base sm:text-lg md:text-xl text-gray-300">
                      Join at
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyLink}
                      className="text-xs sm:text-sm bg-white/10 px-2 sm:px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <CopyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      Copy Link
                    </motion.button>
                  </div>
                  <motion.h2
                    className={`text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 md:mb-6 ${currentTheme.accent}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    join.quizmaster.live
                  </motion.h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-2 sm:mb-3">
                    Enter Code
                  </p>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold flex items-center justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                    {quizSession?.code?.split("").map((digit, i) => (
                      <motion.span
                        key={i}
                        className="inline-block bg-white/15 px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg shadow-inner"
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                      >
                        {digit}
                      </motion.span>
                    ))}
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopyCode}
                    >
                      <CopyIcon className="cursor-pointer text-gray-400 hover:text-pink-400 text-xl sm:text-2xl md:text-3xl lg:text-4xl" />
                    </motion.div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 md:gap-6">
                    <div className="bg-white/15 p-2 sm:p-3 md:p-4 rounded-lg shadow-md w-full sm:w-auto">
                      <p className="text-gray-400 text-xs sm:text-sm">Quiz</p>
                      <p
                        className={`text-sm sm:text-base md:text-lg font-semibold ${currentTheme.accent}`}
                      >
                        {quizSession?.quizId?.title || "Loading..."}
                      </p>
                    </div>
                    <div className="bg-white/15 p-2 sm:p-3 md:p-4 rounded-lg shadow-md w-full sm:w-auto">
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Participants
                      </p>
                      <p
                        className={`text-sm sm:text-base md:text-lg font-semibold ${currentTheme.accent}`}
                      >
                        {participants.length}
                      </p>
                    </div>
                  </div>
                </div>
                <motion.div
                  className="bg-white/15 p-3 sm:p-4 md:p-6 rounded-lg shadow-lg mt-3 sm:mt-4 md:mt-0"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://join.quizmaster.live/${quizSession?.code}`}
                    alt="QR Code"
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <p className="text-gray-200 text-xs sm:text-sm md:text-base mt-2 sm:mt-3 md:mt-4">
                    Scan to Join
                  </p>
                </motion.div>
              </div>

              <div className="mt-auto">
                                 {" "}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6 justify-center">
                                     {" "}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAutoStart}
                    className={`flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 ${
                      autoStart
                        ? `${currentTheme.button} border-current text-white shadow-lg shadow-purple-500/30`
                        : "border-gray-600 text-gray-300 hover:border-pink-400 hover:text-white"
                    } transition-all duration-300 w-full sm:w-auto justify-center relative`}
                  >
                                         {" "}
                    {autoStart ? (
                      <StopCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    ) : (
                      <PlayArrow className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    )}
                                         {" "}
                    <span className="text-sm sm:text-base md:text-lg font-medium">
                                             {" "}
                      {autoStart
                        ? `Auto Starts in (${autoStartTimer}s)`
                        : "Auto Start"}
                                           {" "}
                    </span>
                                       {" "}
                  </motion.button>
                                     {" "}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 border-white/20 text-white hover:border-pink-400 transition-all duration-300 w-full sm:w-auto justify-center"
                  >
                                         {" "}
                    <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                         {" "}
                    <span className="text-sm sm:text-base md:text-lg font-medium">
                                              Invite                      {" "}
                    </span>
                                       {" "}
                  </motion.button>
                                     {" "}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartQuiz}
                    className={`${
                      autoStart
                        ? "bg-red-600 hover:bg-red-700"
                        : currentTheme.button
                    } text-white px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base md:text-lg font-bold shadow-md shadow-pink-500/30 flex items-center gap-2 justify-center w-full sm:w-auto`}
                  >
                                          Start Quiz                  {" "}
                  </motion.button>
                                 {" "}
                </div>
                               {" "}
                <motion.div
                  className="mt-3 sm:mt-4 md:mt-6 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-xl text-gray-400 animate-pulse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                                   {" "}
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> 
                                 {" "}
                  <span>
                                        Waiting for {participants.length}{" "}
                    participant                    {" "}
                    {participants.length !== 1 ? "s" : ""}...                  {" "}
                  </span>
                                 {" "}
                </motion.div>
                             {" "}
              </div>
            </motion.div>

            <motion.div
              className="sm:hidden mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="border-b border-white/20 mb-3">
                <h3 className="text-base font-semibold flex items-center gap-1.5">
                  <UsersIcon className={currentTheme.accent} />
                  <span className={currentTheme.accent}>Participants</span>
                  <span
                    className={`ml-auto ${currentTheme.accent}/20 ${currentTheme.accent} px-1.5 py-0.5 rounded-full text-xs`}
                  >
                    {participants.length}
                  </span>
                </h3>
              </div>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-2 p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="relative">
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-purple-500/30"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 bg-${
                          participant.disconnected ? "red" : "green"
                        }-400 rounded-full w-2.5 h-2.5 border-1.5 border-gray-800`}
                      />
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-medium truncate text-sm">
                        {participant.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Score: {participant.score}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(participant)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <DeleteIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div
            className={`min-h-screen p-3 sm:p-4 md:p-6 ${currentTheme.bg} ${
              currentTheme.name === "light" || currentTheme.name === "sky"
                ? "text-gray-900"
                : currentTheme.text
            }`}
          >
            <motion.header
              className="flex flex-col flex-row justify-between items-center mb-4 pb-3 sm:mb-6 md:mb-8 shadow-md"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  animate={{ rotate: [0, 360], scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <TrophyIcon
                    className={`text-2xl sm:text-3xl md:text-4xl ${currentTheme.accent}`}
                  />
                </motion.div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-pink-500">
                  AI QuizMaster
                </h1>
              </div>
              <div className="flex gap-2 sm:gap-3 items-center mt-2 sm:mt-0">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PaletteIcon
                    className={`cursor-pointer ${currentTheme.accent} hover:text-pink-400 transition-colors duration-200 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6`}
                    onClick={() => setThemeSelectorOpen(true)}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FullscreenIcon
                    className={`cursor-pointer ${currentTheme.accent} hover:text-blue-400 transition-colors duration-200 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6`}
                    onClick={toggleFullscreen}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CloseIcon
                    className={`cursor-pointer ${currentTheme.accent} hover:text-red-400 transition-colors duration-200 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6`}
                    onClick={() => setEndDialogOpen(true)}
                  />
                </motion.div>
              </div>
            </motion.header>

            <AnimatePresence>
              {themeSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4"
                  onClick={() => setThemeSelectorOpen(false)}
                >
                  <motion.div
                    className={`${currentTheme.card} backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md border border-white/10`}
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: 20, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">
                      Select Theme
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {Object.entries(themes).map(([key, theme]) => (
                        <motion.button
                          key={key}
                          whileHover={{
                            scale: 1.05,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                          }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center ${
                            theme.bg
                          } ${
                            currentTheme.name === theme.name
                              ? "ring-2 ring-teal-400"
                              : ""
                          } transition-all duration-200`}
                          onClick={() => {
                            setCurrentTheme(theme);
                            setThemeSelectorOpen(false);
                          }}
                        >
                          <span className="font-medium text-sm sm:text-base">
                            {theme.name}
                          </span>
                          {currentTheme.name === theme.name && (
                            <CheckIcon className="mt-2 w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setThemeSelectorOpen(false)}
                      className="mt-4 sm:mt-6 w-full bg-red-600 hover:bg-red-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-semibold text-sm sm:text-base transition-all duration-200"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <Dialog
              open={endDialogOpen}
              onClose={() => setEndDialogOpen(false)}
              PaperProps={{
                className: `backdrop-blur-lg rounded-xl ${currentTheme.card} ${
                  currentTheme.name === "light" || currentTheme.name === "sky"
                    ? "text-gray-900"
                    : currentTheme.text
                }`,
                style: {
                  backgroundColor: currentTheme.cssCard,
                  border: "1px solid rgba(255,255,255,0.1)",
                  color:
                    currentTheme.name === "light" || currentTheme.name === "sky"
                      ? "#1f2937"
                      : currentTheme.cssText,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <CloseIcon className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
                End Quiz Session?
              </DialogTitle>
              <DialogContent>
                <DialogContentText
                  className={`text-sm sm:text-base ${
                    currentTheme.name === "light" || currentTheme.name === "sky"
                      ? "text-gray-900"
                      : currentTheme.text
                  }`}
                  style={{
                    color:
                      currentTheme.name === "light" ||
                      currentTheme.name === "sky"
                        ? "#1f2937"
                        : currentTheme.cssText,
                  }}
                >
                  Are you sure you want to end this quiz session? All
                  participants will be disconnected and scores will be lost.
                </DialogContentText>
              </DialogContent>
              <DialogActions className="p-3 sm:p-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEndDialogOpen(false)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg ${currentTheme.button} text-white font-medium text-sm sm:text-base shadow-md transition-all duration-200`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEndQuiz}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm sm:text-base shadow-md transition-all duration-200"
                  autoFocus
                >
                  End Quiz
                </motion.button>
              </DialogActions>
            </Dialog>

            <main className="flex-grow p-3 sm:p-4 md:p-6 max-w-5xl mx-auto w-full">
              <motion.div
                className="mb-4 sm:mb-6 md:mb-8 fade-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                key={currentQuestionIndex}
              >
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 tracking-tight">
                  {quizSession?.quizId?.title || "AI Quiz"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <span className="badge bg-teal-500/30 text-teal-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                    {quizSession?.quizId?.subject || "AI & Machine Learning"}
                  </span>
                  <span className="badge bg-yellow-500/30 text-yellow-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                    {quizSession?.quizId?.difficulty || "Advanced"}
                  </span>
                  <span className="badge bg-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                    {quizQuestions.length || 0} Questions
                  </span>
                </div>
                <div
                  className={`${currentTheme.card} backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-white/10`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 md:mb-6">
                    <div>
                      <div className="flex items-center mb-2 sm:mb-3">
                        <span className="bg-teal-500/30 text-teal-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full mr-2">
                          Q{currentQuestionIndex + 1}
                        </span>
                        <span className="badge bg-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                          {quizQuestions[currentQuestionIndex]?.type ||
                            "multiple-choice"}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight">
                        {quizQuestions[currentQuestionIndex]?.question ||
                          "Question text not available"}
                      </h3>
                    </div>
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
                        <svg
                          className="absolute w-full h-full"
                          viewBox="0 0 100 100"
                        >
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
                  <div className="mb-3 sm:mb-4">
                    {renderContent(
                      quizQuestions[currentQuestionIndex]?.content
                    )}
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6">
                    {quizQuestions[currentQuestionIndex]?.type ===
                      "short-answer" ||
                    quizQuestions[currentQuestionIndex]?.type ===
                      "fill-in-the-blank"
                      ? "Enter the most accurate answer."
                      : "Select the most accurate answer."}
                  </p>
                  {renderOptions(quizQuestions[currentQuestionIndex])}
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm md:text-base font-medium text-teal-300">
                      Correct Answer:{" "}
                      {renderCorrectAnswer(quizQuestions[currentQuestionIndex])}
                    </p>
                  </div>
                  {quizQuestions[currentQuestionIndex]?.explanation && (
                    <div className="mt-3 sm:mt-4">
                      <p className="text-xs sm:text-sm md:text-base font-medium text-gray-300">
                        Explanation:{" "}
                        {quizQuestions[currentQuestionIndex].explanation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.button
                  className={`${currentTheme.button} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center text-xs sm:text-sm md:text-base shadow-md transition-all duration-200`}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestartQuestion}
                >
                  <ReplayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Restart
                </motion.button>
                {currentQuestionIndex < quizQuestions.length - 1 && (
                  <motion.button
                    className={`${currentTheme.button} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center text-xs sm:text-sm md:text-base shadow-md transition-all duration-200`}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkipQuestion}
                  >
                    <SkipNextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    Skip
                  </motion.button>
                )}
                {/* <motion.button
                  className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center text-xs sm:text-sm md:text-base shadow-md transition-all duration-200"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEndDialogOpen(true)}
                >
                  <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  End
                </motion.button> */}
              </motion.div>

              <div className="flex border-b border-white/30 mb-4 sm:mb-6">
                {["leaderboard", "questions"].map((tab) => (
                  <motion.button
                    key={tab}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium capitalize ${
                      activeTab === tab
                        ? `text-teal-300 border-b-2 ${currentTheme.accent}`
                        : "text-gray-400 hover:text-white transition-colors duration-200"
                    }`}
                    onClick={() => handleTabChange(tab)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "leaderboard" && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-5 sm:space-y-7 p-5 sm:p-8 bg-gradient-to-b from-gray-800/90 to-indigo-900/90 rounded-3xl shadow-xl border border-white/20 backdrop-blur-xl max-w-4xl mx-auto"
                  >
                    <div className="flex justify-between items-center">
                      <motion.h3
                        className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600"
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 0.5,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        Leaderboard
                      </motion.h3>
                      <motion.div
                        className="text-sm sm:text-base font-semibold text-gray-200 bg-gray-700/50 px-3 py-1 rounded-full"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        {leaderboardData.players.length} Participants
                      </motion.div>
                    </div>
                    <div className="space-y-4">
                      {leaderboardData.players
                        .sort((a, b) => b.score - a.score)
                        // .slice(0, 10)
                        .map((player, index) => (
                          <motion.div
                            key={player.userId}
                            className={`relative flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border border-white/20 transition-all duration-300 ${
                              index === 0
                                ? "bg-gradient-to-r from-yellow-500/20 to-yellow-700/20 shadow-lg shadow-yellow-500/20"
                                : index === 1
                                ? "bg-gradient-to-r from-gray-300/20 to-gray-500/20 shadow-lg shadow-gray-300/20"
                                : index === 2
                                ? "bg-gradient-to-r from-amber-600/20 to-amber-800/20 shadow-lg shadow-amber-600/20"
                                : "bg-white/10"
                            } hover:bg-white/20 hover:shadow-xl`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{
                              scale: 1.03,
                              boxShadow: "0 0 20px rgba(255,255,255,0.3)",
                            }}
                            transition={{
                              delay: index * 0.15,
                              duration: 0.5,
                              ease: "easeOut",
                              type: "spring",
                              stiffness: 150,
                            }}
                          >
                            <motion.div
                              className={`absolute -left-3 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-base sm:text-lg ${
                                index === 0
                                  ? "bg-yellow-400 text-gray-900"
                                  : index === 1
                                  ? "bg-gray-300 text-gray-900"
                                  : index === 2
                                  ? "bg-amber-600 text-white"
                                  : "bg-gray-600 text-white"
                              }`}
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: index * 0.2,
                              }}
                            >
                              {index + 1}
                            </motion.div>
                            <motion.img
                              src={player.avatar || "/default-avatar.png"}
                              alt={player.username}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/40"
                              whileHover={{ rotate: 360, scale: 1.1 }}
                              transition={{ duration: 0.6 }}
                            />
                            <div className="flex-grow">
                              <motion.div
                                className="font-bold text-base sm:text-lg text-white"
                                initial={{ y: 5 }}
                                animate={{ y: 0 }}
                                transition={{ duration: 0.4 }}
                              >
                                {player.username}
                              </motion.div>
                              <motion.div
                                className="text-sm text-gray-300"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                              >
                                {player.answersCount > 0 ? (
                                  <span className="font-medium">
                                    Accuracy: {player.accuracy || 0}% (
                                    {player.correctAnswers || 0}/
                                    {player.answersCount} correct)
                                  </span>
                                ) : (
                                  "No answers yet"
                                )}
                              </motion.div>
                            </div>
                            <motion.div
                              className="flex flex-col items-end"
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 200,
                              }}
                            >
                              <span className="font-extrabold text-lg sm:text-xl text-cyan-300">
                                {player.score} pts
                              </span>
                              <span className="text-xs sm:text-sm text-gray-400">
                                Answered: {player.answersCount || 0}/
                                {quizQuestions.length}
                              </span>
                            </motion.div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "questions" && (
                  <motion.div
                    key="questions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold">
                        Questions
                      </h3>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {quizQuestions.length || 0} Total
                      </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {quizQuestions.map((question, index) => (
                        <motion.div
                          key={index}
                          className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, ease: "easeOut" }}
                          // onClick={() => setCurrentQuestionIndex(index)}
                        >
                          <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`bg-${
                                  index === currentQuestionIndex
                                    ? "teal-500"
                                    : "gray-700"
                                }/30 text-${
                                  index === currentQuestionIndex
                                    ? "teal-300"
                                    : "gray-400"
                                } text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full`}
                              >
                                Q{index + 1}
                              </span>
                              <span className="badge bg-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                                {question.type || "multiple-choice"}
                              </span>
                            </div>
                            <div
                              className={`text-xs sm:text-sm ${
                                index === currentQuestionIndex
                                  ? "text-teal-300"
                                  : "text-gray-400"
                              }`}
                            >
                              {index === currentQuestionIndex
                                ? "Current"
                                : "Next"}
                            </div>
                          </div>
                          <p className="text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3">
                            {question.question}
                          </p>
                          {renderContent(question.content)}
                          {renderOptions(question)}
                          <p className="text-xs sm:text-sm md:text-base font-medium text-teal-300 mt-2 sm:mt-3">
                            Correct Answer: {renderCorrectAnswer(question)}
                          </p>
                          {question.explanation && (
                            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-300 mt-2 sm:mt-3">
                              Explanation: {question.explanation}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            <motion.div
              className="fixed bottom-4 sm:bottom-8 left-0 sm:left-64 md:left-72 lg:left-80 right-0 flex justify-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            >
              <motion.button
                onClick={handlePauseResume}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl ${
                  isPaused
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-yellow-500 hover:bg-yellow-600"
                } text-white font-bold relative overflow-hidden text-sm sm:text-base transition-all duration-200`}
              >
                {isPaused && (
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <motion.div
                  animate={{ rotate: isPaused ? 0 : 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {isPaused ? (
                    <PlayIcon className="text-lg sm:text-xl" />
                  ) : (
                    <PauseIcon className="text-lg sm:text-xl" />
                  )}
                </motion.div>
                <span className="font-medium">
                  {isPaused ? "Resume Quiz" : "Pause Quiz"}
                </span>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartQuizSessionPage;
