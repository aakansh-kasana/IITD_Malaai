# DebatePracticeZone 🏆

An AI-powered debate learning platform that helps students master argumentation through interactive practice sessions and real-time feedback.

## ✨ Features

- **🤖 AI-Powered Debates** - Practice with intelligent Gemini AI opponents
- **📊 Real-time Feedback** - Get instant scoring and detailed analysis
- **📚 Learning Modules** - Structured curriculum from beginner to advanced
- **🏅 Progress Tracking** - XP system, achievements, and performance analytics
- **🔍 Fallacy Detection** - Automatic identification of logical errors

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/Darshan0244/DebatePracticeZone.git
   cd DebatePracticeZone
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your Supabase and Gemini AI keys
   ```

3. **Run**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Required
- **Supabase**: Database and authentication ([Get keys](https://supabase.com))
- **Gemini AI**: AI debate responses ([Get API key](https://makersuite.google.com/app/apikey))

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: Google Gemini 1.5 Flash
- **Build**: Vite

## 📱 Demo

Visit the live demo: [DebatePracticeZone](https://eloquent-sorbet-f1de73.netlify.app/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built for the debate community** 🎯