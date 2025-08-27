import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  faqContentVariants,
  faqItems,
  itemVariants,
  modalVariants,
  pricingPlans,
  testimonials,
  type FAQItem,
  type PricingPlan,
  type Testimonial,
} from "~/components/constants";
import axios from "axios";
import { getUser, updateUser } from "~/redux/actions";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

// Corrected Material-UI Icon Imports
import CreditsIcon from "@mui/icons-material/MonetizationOn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const PricingPage = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [modalType, setModalType] = useState<"payment" | "demo">("payment");
  const user = useSelector((state) => state.reducer.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(getUser(userId));
    } else {
      navigate("/");
    }
  }, [dispatch]);

  const handleChoosePlan = (planName: string) => {
    setSelectedPlan(planName);
    setModalType("demo");
    setShowModal(true);
  };

  const handleToggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const paymentHandler = async (plan) => {
    if (!user) {
      toast.error("Please log in to purchase a plan.");
      return;
    }
    try {
      const { data: order } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/order`,
        {
          amount: parseInt(plan.price.replace("₹", "")),
          currency: "INR",
          receipt: `receipt_#${Math.floor(Math.random() * 1000)}`,
          userId: user._id,
          planName: plan.name,
        }
      );

      const options = {
        key: "rzp_test_NOyYDcDQQX0GaM",
        amount: order.amount,
        currency: "INR",
        name: "AI Quiz Builder",
        description: `${plan.name} Plan Subscription`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const { data } = await axios.post(
              `${import.meta.env.VITE_SERVER_URL}/api/order/validate`,
              response
            );
            if (data) {
              console.log("user", data.user);
              dispatch(updateUser(data.user));
              toast.success(data.msg);
              setSelectedPlan(`${plan.name} Plan Activated`);
              setShowModal(true);
              setTimeout(() => {
                setShowModal(false);
                navigate("/dashboard");
              }, 2000);
            }
          } catch (error) {
            toast.error("Payment validation failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#22d3ee",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      toast.error("Failed to initiate payment.");
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-inter text-white bg-slate-900">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <motion.div
        className="max-w-6xl mx-auto relative z-10 w-full"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
        }}
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold text-center text-slate-100 mb-4"
        >
          Flexible Plans for Every Creator
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-slate-400 text-lg md:text-xl mb-16 text-center max-w-3xl mx-auto"
        >
          Choose the perfect plan to elevate your quiz creation experience, from
          basic features to advanced analytics.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {(pricingPlans as PricingPlan[]).map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-slate-800/50 p-8 rounded-2xl flex flex-col border transition-all duration-300 ${
                plan.isPopular
                  ? "border-cyan-500/50"
                  : "border-slate-700/80 hover:border-slate-600"
              }`}
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-semibold text-white">
                  {plan.name}
                </h2>
              </div>
              <p className="text-slate-400 text-sm mb-6 flex-grow">
                {plan.tagline}
              </p>
              <p className="text-white text-4xl font-bold mb-1">{plan.price}</p>
              <p className="text-slate-500 text-sm mb-8">{plan.credits}</p>
              <ul className="space-y-3 mb-10 flex-grow w-full text-left">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="text-slate-300 flex items-start gap-3"
                  >
                    <CheckIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {user?.plan === plan.name ? (
                  <button
                    disabled
                    className="w-full py-3 text-md font-semibold rounded-lg bg-cyan-500/30 text-cyan-300 cursor-not-allowed border border-cyan-500/50"
                  >
                    Current Plan
                  </button>
                ) : (
                  <motion.button
                    className={`w-full py-3 text-md font-semibold rounded-lg shadow-lg transition-all duration-300 ${
                      plan.isPopular
                        ? "bg-cyan-500 text-black hover:bg-cyan-400"
                        : "bg-slate-700/70 text-slate-200 hover:bg-slate-700"
                    }`}
                    onClick={
                      plan.price === "Contact Us"
                        ? () => handleChoosePlan(plan.name)
                        : () => paymentHandler(plan)
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.price === "Contact Us"
                      ? "Request a Demo"
                      : "Upgrade Plan"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-24 max-w-4xl mx-auto px-4 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-center text-slate-100 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {(faqItems as FAQItem[]).map((item, index) => (
              <div
                key={index}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/80"
              >
                <h3
                  className="text-lg font-medium text-slate-200 cursor-pointer flex justify-between items-center"
                  onClick={() => handleToggleFAQ(index)}
                >
                  {item.question}
                  <ExpandMoreIcon
                    className={`transform transition-transform duration-300 ${
                      openFAQ === index ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </h3>
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.p
                      className="mt-3 text-slate-400 pt-3 border-t border-slate-700"
                      variants={faqContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {item.answer}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-24 max-w-5xl mx-auto px-4 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold text-center text-slate-100 mb-12">
            What Our Users Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(testimonials as Testimonial[]).map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-slate-800/50 p-6 rounded-xl flex flex-col text-center border border-slate-700/80"
                variants={itemVariants}
              >
                <p className="text-slate-300 italic text-md mb-6 flex-grow">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 justify-center">
                  <img
                    src={testimonial.profilePic}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-slate-100 font-semibold">
                      {testimonial.name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-24 text-center max-w-3xl mx-auto pb-20 px-4 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-center text-slate-100 mb-4">
            Ready to Elevate Your Quizzes?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join thousands of satisfied creators. Get started today and
            transform your content.
          </p>
          <motion.button
            className="inline-flex items-center gap-3 px-8 py-4 text-xl font-bold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
            onClick={paymentHandler}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Free Trial
            <ArrowForwardIcon />
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700 relative"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalType("payment");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>

              {/* Conditional Content based on modalType */}
              {modalType === "demo" ? (
                <>
                  <CheckIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Demo Requested!
                  </h3>
                  <p className="text-slate-300 mb-6">
                    Thank you for your interest in the{" "}
                    <span className="font-semibold text-cyan-300">
                      {selectedPlan}
                    </span>{" "}
                    plan.
                  </p>
                  <p className="text-sm text-slate-400 mb-8">
                    Our team will contact you shortly to schedule your demo.
                  </p>
                </>
              ) : (
                <>
                  <CheckIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Plan Activated!
                  </h3>
                  <p className="text-slate-300 mb-6">
                    You've successfully upgraded to the{" "}
                    <span className="font-semibold text-cyan-300">
                      {selectedPlan}
                    </span>{" "}
                    plan.
                  </p>
                  <p className="text-sm text-slate-400 mb-8">
                    A confirmation email with your receipt has been sent.
                  </p>
                </>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="bg-cyan-500 text-black px-6 py-2 rounded-lg font-semibold"
              >
                Got It!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default PricingPage;
