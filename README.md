Markdown
# 🧠 AI Quiz Builder

![Live App Demo](https://img.shields.io/badge/Live_App-Visit_Now-000000?style=for-the-badge&logo=vercel&logoColor=white)

**AI Quiz Builder** is a powerful full-stack platform designed to revolutionize the way quizzes are created and conducted. By leveraging the Gemini API, it instantly generates high-quality quizzes from multiple sources (PDFs, images, text, or web links). Beyond generation, it serves as a robust real-time multiplayer engine for hosting live quizzes with instant scoring and dynamic leaderboards.

🌐 **Live Application:** [https://quiz-client-mauve.vercel.app](https://quiz-client-mauve.vercel.app)

---

## ✨ Core Features

### 🤖 AI-Powered Quiz Generation
* **Multi-Format Input:** Seamlessly generate fully formatted quizzes by uploading a **PDF, Image, Text, or Web Link**.
* **Gemini API Integration:** Utilizes advanced LLMs to extract context and create relevant, challenging multiple-choice questions automatically.

### 🔴 Live Quiz Hosting & Multiplayer Engine
* **Real-Time Gameplay:** Host live quizzes where participants join and compete simultaneously.
* **Instant Feedback & Scoring:** Powered by Socket.IO for zero-latency question delivery and answer validation.
* **Dynamic Leaderboards:** Watch the standings change in real-time as the quiz progresses, culminating in a final winner's podium.

### 📊 Comprehensive Dashboard & User Experience
* **Quizzes Tab:** Manage, edit, and schedule your upcoming quizzes.
* **Analytics Tab:** Deep dive into participant performance, average scores, and question difficulty metrics.
* **Community Tab:** Connect with other users, share quizzes, and build a learning network.
* **Personalized Profiles:** Track your personal statistics, history, and achievements.

### 🛡️ Enterprise-Grade Integrations
* **Authentication:** Secure and fast login using **Google OAuth**.
* **Payments:** Seamless premium features and transactions powered by **Razorpay**.
* **Live Notifications:** Real-time system alerts, invites, and updates powered by **Firebase**.

---

## 🛠️ Technology Stack

**Frontend:**
* React.js
* Tailwind CSS (for highly responsive, modern UI)
* Vite (Bundler)

**Backend:**
* Node.js
* Express.js
* Socket.IO (for real-time bidirectional event-based communication)

**Database:**
* MongoDB & Mongoose

**Third-Party Services & APIs:**
* Gemini AI API (Content generation)
* Firebase (Real-time notifications)
* Razorpay (Payment gateway)
* Google OAuth 2.0 (Authentication)

---

## 🚀 Getting Started (Run Locally)

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas account)
* [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone [https://github.com/jeevan8184/quiz.git](https://github.com/jeevan8184/quiz.git)
cd quiz
2. Environment Variables Setup
You will need to create .env files in both the client and server directories.

Backend (server/.env)
Create a .env file in the server folder and add the following keys:

Code snippet
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
Frontend (client/.env)
Create a .env file in the client folder and add the necessary client-side keys (e.g., Firebase config, API base URLs):

Code snippet
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
3. Install Dependencies
Install the required packages for both the backend and frontend.

For Backend:

Bash
cd server
npm install
For Frontend:

Bash
cd ../client
npm install
4. Run the Application
You need to start both the server and the client in separate terminal windows.

Start the Backend Server:

Bash
cd server
npm run dev
Start the Frontend Client:

Bash
cd client
npm run dev
The application should now be running locally. The client is typically accessible at http://localhost:5173 (if using Vite) and the server at http://localhost:5000.

👨‍💻 Author
Jatavath Jeevan

GitHub: @jeevan8184

LinkedIn: [Add your LinkedIn URL here]

🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request
