<h1 align="center">🧠 DebatePracticeZone</h1>
<p align="center"><strong>AI-powered platform to master debate through intelligent simulations and real-time feedback.</strong></p>

<p align="center">
  <a href="https://eloquent-sorbet-f1de73.netlify.app/" target="_blank"><strong>🌐 Live Demo</strong></a> • 
  <a href="#-features">✨ Features</a> • 
  <a href="#-tech-stack">🛠️ Tech Stack</a> • 
  <a href="#-quick-start">🚀 Quick Start</a> • 
  <a href="#-architecture">🧩 Architecture</a> • 
  <a href="#-contributing">🤝 Contributing</a> • 
  <a href="#-about-me">👨‍💻 About Me</a>
</p>

---

## 🧭 Overview

**DebatePracticeZone** is an AI-powered platform that simulates full debate rounds with real-time scoring, fallacy detection, and skill-based learning paths. It empowers students, educators, and institutions to practice debates without needing human partners — enabling 24/7 access to argumentation skill development.

Built using **React**, **Supabase**, and **Gemini AI**, this platform demonstrates modern web engineering with purpose.

> 🔥 This project merges full-stack development with large language model (LLM) integration, real-time systems, and gamified learning — ready for open-source mentoring and production deployment.

---

## 📸 Screenshots

### 🧠 AI-Powered Debate Simulation  
![AI Debate Simulation](https://github.com/Darshan0244/DebatePracticeZone/blob/79b13e6847e40fdda4ca21ab64e7507c46eb1e51/Screenshot%202025-06-15%20174246.png?raw=true)

### 🎯 Performance Feedback  
![Performance Feedback](https://github.com/Darshan0244/DebatePracticeZone/blob/79b13e6847e40fdda4ca21ab64e7507c46eb1e51/Screenshot%202025-06-15%20174327.png?raw=true)

### 📊 Round-wise Scoring  
![Round-wise Scoring](https://github.com/Darshan0244/DebatePracticeZone/blob/79b13e6847e40fdda4ca21ab64e7507c46eb1e51/Screenshot%202025-06-15%20174405.png?raw=true)

### 🔍 Argument Analysis  
![Argument Analysis](https://github.com/Darshan0244/DebatePracticeZone/blob/79b13e6847e40fdda4ca21ab64e7507c46eb1e51/Screenshot%202025-06-15%20174429.png?raw=true)

----

## ✨ Features

- 🤖 **AI-Simulated Debates** – Practice structured debates with Gemini 1.5 Flash  
- 📊 **Real-Time Scoring & Feedback** – Instant evaluation on clarity, logic, structure  
- 🧠 **Fallacy Detection** – Flags common logical fallacies during rebuttals  
- 📚 **Learning Modules** – Skill-based tracks from beginner to expert  
- 🏅 **Gamification** – XP system, achievement badges, and progress analytics  
- 🔐 **Role-based Access** – Secure sessions using Supabase Auth & RLS  
- 🧩 **Modular & Scalable** – Clean architecture and component structure

---

## 🛠️ Tech Stack

| Layer       | Stack Used                                            |
|-------------|-------------------------------------------------------|
| Frontend    | React 18, TypeScript, Tailwind CSS, Framer Motion     |
| Backend     | Supabase (PostgreSQL, Auth, Row-Level Security)       |
| AI Layer    | Google Gemini 1.5 Flash (via Makersuite API)          |
| Build Tool  | Vite                                                  |
| Deployment  | Netlify (CI/CD ready)                                 |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Darshan0244/DebatePracticeZone.git
cd DebatePracticeZone
npm install

````

### 2. Environment Setup

```bash
cp .env.example .env
# Add your Supabase and Gemini API keys
```

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### 3. Run Locally

```bash
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## 🧩 Architecture

```
Client (React + TypeScript + Tailwind)
    ├── Auth & DB → Supabase (PostgreSQL, RLS)
    ├── AI Layer → Gemini 1.5 Flash
    ├── Feedback Engine → Real-time scoring and fallacy detection
    └── Hosting → Netlify
```

> ✅ Modular structure, clean components, extendable AI layer

---

## 🌐 Live Demo

Try the production app:
👉 [https://eloquent-sorbet-f1de73.netlify.app/](https://eloquent-sorbet-f1de73.netlify.app/)

---

## 📦 Use Cases

* 🎓 Students preparing for competitions or MUNs
* 🧑‍🏫 Educators building critical thinking curricula
* 🧪 Hackathon & AI Showcases
* 🧑‍💻 Developers learning LLM + full-stack integration

---

## 🤝 Contributing

We welcome all contributions — from improving documentation to adding new features or integrations (e.g., GPT, Claude, PDF exports, voice debates).

### Steps:

1. Fork the repo
2. Create your branch:

   ```bash
   git checkout -b feature/your-feature
   ```
3. Make your changes
4. Commit & push:

   ```bash
   git commit -m "feat: add new feature"
   git push origin feature/your-feature
   ```
5. Submit a pull request

---

## 🔭 Roadmap Highlights

*  🎙️ Voice-based AI debate rounds
*  📥 Debate transcript export (PDF/JSON)
*  🧑‍🏫 Teacher dashboard with class tracking
*  🔌 Support GPT-4 and Claude models
*  🌍 Multi-language debate support

---

## 📄 License

This project is licensed under the **MIT License**.
See [LICENSE](LICENSE) for details.

---

> 💬 *“DebatePracticeZone isn’t just code — it’s a mission to democratize debate education using AI.”*
> — Darshan
