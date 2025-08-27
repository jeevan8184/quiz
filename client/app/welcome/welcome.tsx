import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import ArrowForward from "@mui/icons-material/ArrowForward";
import LinkedIn from "@mui/icons-material/LinkedIn";
import Twitter from "@mui/icons-material/Twitter";
import GitHub from "@mui/icons-material/GitHub";
import Star from "@mui/icons-material/Star";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import FlashOn from "@mui/icons-material/FlashOn";
import BarChart from "@mui/icons-material/BarChart";
import Groups from "@mui/icons-material/Groups";
import Edit from "@mui/icons-material/Edit";
import PlayCircle from "@mui/icons-material/PlayCircle";
import Login from "@mui/icons-material/Login";
import Podcasts from "@mui/icons-material/Podcasts";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Lightbulb from "@mui/icons-material/Lightbulb";
import Visibility from "@mui/icons-material/Visibility";

ChartJS.register(ArcElement, Tooltip, Legend);

export function Welcome() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen font-inter text-white bg-gradient-to-br from-[#0b0a23] via-[#1a1841] to-[#14122d]">
      <motion.nav
        className="flex justify-between items-center p-4 sm:px-12 bg-black/30 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-cyan-400/20"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="flex items-center cursor-pointer"
          onClick={() => window.scrollTo(0, 0)}
        >
          <motion.img
            src="/logo1.png"
            alt="Logo"
            className="h-14 w-14 max-sm:h-12 max-sm:w-12 mr-3 rounded-full shadow-lg border-2 border-cyan-400/50"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.5 }}
          />
          <span className="text-xl font-bold text-cyan-300 drop-shadow-[0_0_10px_#0ff] transition-colors duration-300 hover:text-white">
            AI Quiz Builder
          </span>
        </div>
        <div className="space-x-4 flex items-center">
          <Link
            to="/login"
            className="text-cyan-300 hover:text-white font-medium transition duration-200 px-4 py-2 rounded-full hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="bg-cyan-500 text-slate-950 px-6 py-2.5 rounded-full font-semibold hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_#0ff] hover:scale-105"
          >
            Sign up
          </Link>
        </div>
      </motion.nav>

      <main className="overflow-hidden">
        <section
          className="relative py-24 md:py-40 flex items-center justify-center text-center"
          style={{
            backgroundImage: `linear-gradient(rgba(11, 10, 35, 0.85), rgba(26, 24, 65, 0.85)), url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
          }}
        >
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <motion.h1
              className="text-5xl md:text-7xl font-extrabold text-cyan-300 mb-6 drop-shadow-[0_0_12px_#0ff] leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Build Smarter Quizzes with{" "}
              <span className="text-pink-400 drop-shadow-[0_0_12px_#f0f]">
                AI
              </span>
            </motion.h1>
            <motion.p
              className="text-lg text-cyan-100 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              Effortlessly create engaging and intelligent quizzes with our
              cutting-edge AI. Save time, enhance learning, and gain valuable
              insights.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-4 rounded-full text-lg font-bold bg-white text-blue-700 shadow-[0_0_15px_#0ff] hover:bg-blue-100 transition-transform hover:scale-105"
              >
                Let's Get Started <ArrowForward className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        <div className="bg-gradient-to-b from-[#14122d] via-[#1a1841] to-[#0b0a23] py-20">
          <section className="max-w-7xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold text-pink-400 mb-6 drop-shadow-[0_0_8px_#f0f]">
                A Feature-Rich Platform for Modern Learning
              </h2>
              <p className="text-lg text-cyan-100 mb-16 max-w-3xl mx-auto">
                Our platform offers a suite of powerful tools designed to make
                quiz creation, management, and analysis effortless and engaging
                for everyone.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 hover:scale-105 hover:border-cyan-400 transition-all duration-300"
              >
                <AutoAwesome className="text-pink-400 w-16 h-16 mb-4 drop-shadow-[0_0_8px_#f0f]" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  AI-Powered Creation
                </h3>
                <p className="text-cyan-200 text-center">
                  Generate quizzes from any text, topic, or document in seconds.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 hover:scale-105 hover:border-cyan-400 transition-all duration-300"
              >
                <BarChart className="text-cyan-300 w-16 h-16 mb-4 drop-shadow-[0_0_8px_#0ff]" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  In-Depth Analytics
                </h3>
                <p className="text-cyan-200 text-center">
                  Track participant scores, identify knowledge gaps, and view
                  detailed reports.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 hover:scale-105 hover:border-cyan-400 transition-all duration-300"
              >
                <Groups className="text-purple-400 w-16 h-16 mb-4 drop-shadow-[0_0_8px_#9370DB]" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Community & Collaboration
                </h3>
                <p className="text-cyan-200 text-center">
                  Share quizzes, explore content from others, and build a
                  learning community.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 hover:scale-105 hover:border-cyan-400 transition-all duration-300"
              >
                <FlashOn className="text-yellow-400 w-16 h-16 mb-4 drop-shadow-[0_0_8px_#FFD700]" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Live Hosting
                </h3>
                <p className="text-cyan-200 text-center">
                  Host real-time quizzes with a live leaderboard for interactive
                  sessions.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 hover:scale-105 hover:border-cyan-400 transition-all duration-300"
              >
                <Edit className="text-green-400 w-16 h-16 mb-4 drop-shadow-[0_0_8px_#32CD32]" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Full Customization
                </h3>
                <p className="text-cyan-200 text-center">
                  Easily edit and personalize quizzes to perfectly match your
                  learning objectives.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 hover:scale-105 hover:border-cyan-400 transition-all duration-300"
              >
                <PlayCircle className="text-red-400 w-16 h-16 mb-4 drop-shadow-[0_0_8px_#F08080]" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Flexible Participation
                </h3>
                <p className="text-cyan-200 text-center">
                  Join quizzes with a simple code or participate at your own
                  pace.
                </p>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-24 max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold text-cyan-300 mb-6 drop-shadow-[0_0_8px_#0ff]">
                Engage in a Live Quiz Experience
              </h2>
              <p className="text-lg text-cyan-100 mb-16 max-w-3xl mx-auto">
                Transform any session into a vibrant, interactive event. Here’s
                how easy it is to host and join a live quiz.
              </p>
            </motion.div>

            <motion.div
              className="relative grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-400/20 hidden md:block" />
              <motion.div
                variants={itemVariants}
                className="relative flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-cyan-400/30"
              >
                <div className="absolute -top-6 flex items-center justify-center w-12 h-12 rounded-full bg-cyan-400 text-slate-900 font-extrabold text-2xl drop-shadow-[0_0_8px_#0ff]">
                  1
                </div>
                <Podcasts className="text-cyan-300 w-12 h-12 my-4" />
                <h3 className="text-2xl font-semibold text-white mt-4 mb-2">
                  Host & Share
                </h3>
                <p className="text-cyan-200">
                  Start a live session and share the unique join code with your
                  participants.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="relative flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-cyan-400/30"
              >
                <div className="absolute -top-6 flex items-center justify-center w-12 h-12 rounded-full bg-cyan-400 text-slate-900 font-extrabold text-2xl drop-shadow-[0_0_8px_#0ff]">
                  2
                </div>
                <Login className="text-cyan-300 w-12 h-12 my-4" />
                <h3 className="text-2xl font-semibold text-white mt-4 mb-2">
                  Players Join
                </h3>
                <p className="text-cyan-200">
                  Participants enter the code on their devices and wait in the
                  lobby for the quiz to begin.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="relative flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-cyan-400/30"
              >
                <div className="absolute -top-6 flex items-center justify-center w-12 h-12 rounded-full bg-cyan-400 text-slate-900 font-extrabold text-2xl drop-shadow-[0_0_8px_#0ff]">
                  3
                </div>
                <BarChart className="text-cyan-300 w-12 h-12 my-4" />
                <h3 className="text-2xl font-semibold text-white mt-4 mb-2">
                  See Live Results
                </h3>
                <p className="text-cyan-200">
                  Watch the leaderboard update in real-time and review detailed
                  results after the quiz ends.
                </p>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-24 max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold text-pink-400 mb-6 drop-shadow-[0_0_8px_#f0f]">
                Loved by Educators and Professionals
              </h2>
              <p className="text-lg text-cyan-100 mb-16 max-w-2xl mx-auto">
                Hear what our users are saying about the AI Quiz Builder.
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div
                variants={itemVariants}
                className="bg-white/5 p-6 rounded-lg border border-white/20"
              >
                <p className="text-cyan-200 mb-4">
                  "This tool has been a game-changer for my classroom
                  engagement. The AI generation is incredibly fast and
                  accurate!"
                </p>
                <div className="flex items-center">
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                </div>
                <p className="text-white font-bold mt-2">- Sarah J.</p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="bg-white/5 p-6 rounded-lg border border-white/20"
              >
                <p className="text-cyan-200 mb-4">
                  "We use AI Quiz Builder for our corporate training programs.
                  The analytics help us identify areas for improvement. Highly
                  recommended."
                </p>
                <div className="flex items-center">
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                </div>
                <p className="text-white font-bold mt-2">- David L.</p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="bg-white/5 p-6 rounded-lg border border-white/20"
              >
                <p className="text-cyan-200 mb-4">
                  "The community feature is fantastic. I love exploring quizzes
                  made by others and getting inspiration for my own content."
                </p>
                <div className="flex items-center">
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                  <Star className="text-yellow-400 mr-1" />
                </div>
                <p className="text-white font-bold mt-2">- Maria G.</p>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-24 max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold text-pink-400 mb-6 drop-shadow-[0_0_8px_#f0f]">
                Ways to Engage
              </h2>
              <p className="text-lg text-cyan-100 mb-16 max-w-3xl mx-auto">
                Start your journey with our platform. Whether you want to
                create, explore, or play, we have you covered.
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={itemVariants}>
                <Link
                  to="/dashboard/create-quiz"
                  className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 hover:border-pink-400 transition-all duration-300"
                >
                  <Lightbulb className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_8px_#ffd700]" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Create Your Own Quizzes
                  </h3>
                  <p className="text-cyan-200 mb-4">
                    Effortlessly build quizzes on any topic using our powerful
                    AI generation tool.
                  </p>
                  <span className="text-cyan-400 font-bold hover:underline">
                    Get Started <ArrowForward className="inline-block" />
                  </span>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link
                  to="/dashboard/quizzes"
                  className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 hover:border-cyan-400 transition-all duration-300"
                >
                  <Visibility className="w-16 h-16 text-cyan-400 mb-4 drop-shadow-[0_0_8px_#0ff]" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Explore Public Quizzes
                  </h3>
                  <p className="text-cyan-200 mb-4">
                    Discover a vast library of quizzes created by our community.
                    Find your next challenge.
                  </p>
                  <span className="text-cyan-400 font-bold hover:underline">
                    Explore Now <ArrowForward className="inline-block" />
                  </span>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link
                  to="/activity/start-join"
                  className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 hover:border-purple-400 transition-all duration-300"
                >
                  <PlayCircle className="w-16 h-16 text-purple-400 mb-4 drop-shadow-[0_0_8px_#9370DB]" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Join a Live Quiz
                  </h3>
                  <p className="text-cyan-200 mb-4">
                    Enter a quiz code to join a live session and compete with
                    friends or classmates.
                  </p>
                  <span className="text-cyan-400 font-bold hover:underline">
                    Join a Quiz <ArrowForward className="inline-block" />
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-24 bg-transparent">
            <motion.div
              className="max-w-6xl mx-auto px-6 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold text-cyan-300 mb-6 drop-shadow-[0_0_8px_#0ff]">
                Ready to Build Smarter Quizzes?
              </h2>
              <p className="text-lg text-cyan-100 mb-12 max-w-2xl mx-auto">
                Join thousands of creators and educators. Sign up for free and
                start building your first AI-powered quiz today.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center px-10 py-5 rounded-full text-xl font-bold bg-white text-blue-700 shadow-[0_0_15px_#0ff] hover:bg-blue-100 transition-transform hover:scale-105"
              >
                Sign Up for Free <ArrowForward className="ml-3 w-6 h-6" />
              </Link>
            </motion.div>
          </section>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-violet-950 to-indigo-950 backdrop-blur-md py-12 text-center text-white border-t border-cyan-400/20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="flex justify-center items-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src="/logo1.png"
              alt="AI Quiz Builder Logo"
              className="h-16 w-16 max-sm:h-12 max-sm:w-12 rounded-full shadow-lg border border-cyan-400/50"
            />
            <p className="ml-4 text-2xl max-sm:text-lg font-bold text-cyan-300 drop-shadow-[0_0_8px_#0ff]">
              AI Quiz Builder
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Features</h2>
              <div className="flex flex-col items-center gap-3 text-sm">
                <Link
                  to="/features/quiz-creation"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Quiz Creation
                </Link>
                <Link
                  to="/features/collaboration"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Collaboration
                </Link>
                <Link
                  to="/features/analytics"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Analytics
                </Link>
                <Link
                  to="/features/community"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Community
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Company</h2>
              <div className="flex flex-col items-center gap-3 text-sm">
                <Link
                  to="/about"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  About
                </Link>
                <Link
                  to="/careers"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Careers
                </Link>
                <Link
                  to="/blog"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Blog
                </Link>
                <Link
                  to="/contact"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Contact
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Support</h2>
              <div className="flex flex-col items-center gap-3 text-sm">
                <Link
                  to="/help"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Help Center
                </Link>
                <Link
                  to="/faq"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  FAQ
                </Link>
                <Link
                  to="/privacy"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-cyan-300 transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Connect</h2>
              <div className="flex items-center gap-6 text-sm">
                <motion.a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                  className="text-white hover:text-cyan-300"
                >
                  <GitHub className="w-8 h-8" />
                </motion.a>
                <motion.a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                  className="text-white hover:text-cyan-300"
                >
                  <Twitter className="w-8 h-8" />
                </motion.a>
                <motion.a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                  className="text-white hover:text-cyan-300"
                >
                  <LinkedIn className="w-8 h-8" />
                </motion.a>
              </div>
            </motion.div>
          </div>
          <motion.div
            className="text-sm text-cyan-200 pt-10 border-t border-white/10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p>
              © {new Date().getFullYear()} AI Quiz Builder. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
