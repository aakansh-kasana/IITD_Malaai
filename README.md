<h1 align="center">🧠 DebatePracticeZone: AI-Powered Debate Practice Platform</h1>
<p align="center"><strong>Master the Art of Debate Through Intelligent Simulations, Real-Time Feedback, and Gamified Learning.</strong></p>

<p align="center">
  <a href="https://eloquent-sorbet-f1de73.netlify.app/" target="_blank"><strong>🌐 Live Demo</strong></a> •
  <a href="#-project-overview">📋 Overview</a> •
  <a href="#-key-features">✨ Key Features</a> •
  <a href="#-technical-architecture">🧩 Technical Architecture</a> •
  <a href="#-tech-stack">🛠️ Tech Stack</a> •
  <a href="#-getting-started">🚀 Getting Started</a> •
  <a href="#-future-roadmap">🔭 Future Roadmap</a> •
  <a href="#-contributing">🤝 Contributing</a> •
  <a href="#-license">📄 License</a> •
  <a href="#-about-the-developer">👨‍💻 About the Developer</a>
</p>

---

## 📋 Project Overview

**DebatePracticeZone** is a sophisticated AI-driven platform designed to provide users with an accessible and effective way to practice and improve their debate skills. By simulating realistic debate scenarios with an intelligent AI opponent and offering granular, real-time feedback, the platform empowers individuals to develop critical thinking, argumentation, and public speaking abilities without the constraints of traditional practice methods.

Built with a modern tech stack and a modular architecture, DebateMaster showcases a robust integration of frontend, backend, and advanced AI capabilities.

---

## ✨ Key Features

Leveraging the power of AI and a solid technical foundation:

-   🤖 **Intelligent AI Debate Simulation:** Engage in dynamic and responsive debate rounds against a Google Gemini 1.5 Flash powered AI that generates relevant and contextual arguments.
-   📊 **Real-Time Argument Analysis & Feedback:** Receive instant, objective evaluations of your arguments, including a detailed score based on clarity, logic, structure, and evidence, along with specific strengths and areas for improvement.
-   🧠 **Live Logical Fallacy Detection:** The AI analyzes your arguments in real-time and flags common logical fallacies, providing immediate learning opportunities.
-   📚 **Structured Learning Modules:** Access a curated learning path with modules covering fundamental to advanced debate techniques, reinforced with quizzes and examples.
-   🏅 **Gamified Progression System:** Stay motivated and track your development through an XP system, leveling up, earning achievements, and monitoring your progress and debate streaks.
-   🔐 **Secure User Authentication & Data Management:** User data and progress are securely managed with Supabase Authentication and enforced Row-Level Security (RLS).
-   🗣️ **Flexible Interaction Modes:** Practice debates using text-based input or a direct speech mode for a more natural, spoken interaction.
-   📈 **Personalized Performance Tracking:** Monitor your debate history, scores, and progress over time to identify areas for growth.

---

## 🧩 Technical Architecture

A scalable and maintainable architecture:

```
Client (React + TypeScript + Tailwind + Framer Motion)
    ├── User Interface (Modular Components)
    ├── State Management (React Hooks, Context API - inferred)
    ├── Authentication & User Data Handling (useAuth hook)
    ├── AI Service Interaction (geminiService)
    └── Routing & View Management

Backend (Supabase)
    ├── PostgreSQL Database (Schema defined in migrations)
        ├── user_profiles (User metadata, XP, level, streak)
        ├── user_achievements (Unlocked achievements)
        ├── user_module_progress (Completed learning modules)
        └── debate_sessions (Records of past debates)
    ├── Supabase Auth (User registration, login, session management)
    └── Row-Level Security (Fine-grained access control)

AI Layer (Google Gemini 1.5 Flash)
    ├── Debate Response Generation API
    └── Argument Analysis API

Deployment (Netlify)
    └── Static site hosting for the React application
```
**Architectural Highlights:**

*   **Frontend Modularity:** The application is structured with reusable React components, organized logically by feature (`components/`).
*   **Clear Separation of Concerns:** Custom hooks (`hooks/`) abstract logic (e.g., `useAuth`), services (`services/geminiService.ts`) handle external API calls, and type definitions (`types/`) ensure code reliability.
*   **Robust Backend:** Supabase provides a powerful and secure backend solution with built-in authentication and a flexible PostgreSQL database schema designed for tracking user progress and debate history.
*   **Efficient AI Integration:** The `geminiService` acts as a dedicated layer for interacting with the Gemini API, handling prompts, responses, and error conditions, keeping AI logic separate from UI components.
*   **Data Integrity and Security:** Supabase RLS policies, defined in the SQL migrations, ensure that users can only access and modify their own data, crucial for privacy and security.
*   **Automated Database Management:** Supabase migrations provide version control for the database schema, and triggers automate tasks like user profile creation on signup.

---

## 🛠️ Tech Stack

The technologies and libraries used in the project:

| Category      | Technologies Used                                            |
|---------------|--------------------------------------------------------------|
| Frontend      | React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts (`package.json`) |
| Backend       | Supabase (PostgreSQL, Auth, Row-Level Security)              |
| AI Layer      | Google Gemini 1.5 Flash (`@google/generative-ai`)            |
| Build Tool    | Vite                                                         |
| Development   | ESLint, PostCSS                                              |
| Deployment    | Netlify                                                      |

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Darshan0244/DebatePracticeZone.git
cd DebatePracticeZone
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Environment Configuration

Create a `.env` file in the root directory by copying the example:
```bash
cp .env.example .env
```
You will need to obtain the following API keys:
-   **Supabase URL and Anon Key:** From your Supabase project settings.
-   **Google Gemini API Key:** From Google AI Studio.

Add these keys to your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
```
*Note: The AI debate and feedback features require a valid `VITE_GEMINI_API_KEY`. If not provided, the application will run in a limited demo mode.*

### 4. Run the Development Server
```bash
npm run dev
```
Open your web browser and navigate to `http://localhost:5173`.

---

## 🌐 Live Demo

Explore the deployed version of DebateMaster:

👉 [https://eloquent-sorbet-f1de73.netlify.app/](https://eloquent-sorbet-f1de73.netlify.app/)

---

## 🔭 Future Roadmap

Potential enhancements and future directions:

*   Implement a full voice-to-voice debate mode for a more immersive experience.
*   Develop a feature to export debate transcripts with feedback.
*   Create a dedicated dashboard for educators to manage students and track class progress.
*   Integrate support for additional large language models.
*   Expand localization for multi-language support.
*   Introduce more advanced performance analytics and visual reports.

---

## 🤝 Contributing

We welcome contributions! If you're interested in contributing to DebateMaster, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file (if available, or add basic contribution guidelines here).

---

## 📄 License

This project is open-source and licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

---

## 👨‍💻 About the Developer

[Optional: Add a brief section about yourself or the team, your motivation for the project, etc.]

---

> 💬 *“DebateMaster: Empowering the next generation of critical thinkers and communicators through innovative AI.”*
