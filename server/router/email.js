import express from "express";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.model.js";

const router = express.Router();

router.post("/email", async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASS,
      },
    });

    const mailOptions = {
      from: `"AI Quiz Builder" <${process.env.MY_EMAIL}>`,
      to: email,
      subject: subject,
      text: `👋 Hello!\n\n${message}\n\nThanks for using AI Quiz Builder.\n\n🧠 Keep building smart!`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>👋 Hello!</h2>
          <p>${message}</p>
          <br/>
          <p>Thanks for using <strong>AI Quiz Builder</strong>.</p>
          <p>🧠 Keep building smart quizzes!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: " Email sent successfully!" });
  } catch (error) {
    console.error(" Error in /email route:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error. Try again later." });
  }
});

router.post("/order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const { amount, currency, receipt, userId, planName } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt,
      notes: {
        userId,
        planName,
      },
    };

    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).json({ message: "error" });

    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error" });
  }
});

router.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");

    if (digest !== razorpay_signature)
      return res.status(400).json({ message: "Transaction is not legit" });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { userId, planName } = order.notes;

    const planExpiresAt = new Date();
    planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          plan: planName,
          subscriptionId: razorpay_payment_id,
          planExpiresAt,
        },
        $inc: {
          credits: 50,
        },
      },
      { new: true }
    );

    res.status(200).json({
      msg: "Payment successful! Your plan has been upgraded.",
      user: updatedUser,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal error" });
  }
});

export default router;
