# DebatePracticeZone 🏆

An AI-powered debate learning platform that helps students master the art of argumentation through interactive practice sessions, structured learning modules, and real-time feedback.

## 🌟 Features

### 🤖 AI-Powered Learning
- **Real-time AI Debates**: Practice with intelligent Gemini AI opponents that adapt to your arguments
- **Live Feedback Analysis**: Get instant scoring and detailed feedback on every argument you make
- **Contextual Responses**: AI provides relevant counterarguments based on your specific points
- **Logical Fallacy Detection**: Automatic identification and explanation of reasoning errors

### 📚 Structured Learning Path
- **Progressive Modules**: Learn from beginner to advanced debate techniques
- **Interactive Quizzes**: Test your knowledge with engaging questions and explanations
- **Prerequisite System**: Unlock advanced content as you master fundamentals
- **Comprehensive Topics**: Cover logical fallacies, argument structure, and advanced techniques

### 🎯 Practice & Assessment
- **Unlimited Debate Mode**: 5-minute sessions with unlimited arguments for maximum practice
- **Multiple Topics**: Choose from diverse debate subjects across various domains
- **Position Selection**: Argue for or against any topic to develop versatility
- **Performance Tracking**: Detailed analytics on your debate performance and improvement areas

### 🏅 Gamification & Progress
- **Achievement System**: Earn badges for milestones and exceptional performance
- **XP & Leveling**: Gain experience points and level up as you improve
- **Streak Tracking**: Maintain learning streaks for consistent practice
- **Progress Dashboard**: Visual overview of your learning journey and statistics

### 🔐 User Management
- **Secure Authentication**: Email/password signup with Supabase backend
- **Profile Management**: Track personal progress and preferences
- **Data Persistence**: All progress saved across devices and sessions
- **Privacy Focused**: Your data remains secure and private

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Gemini AI API key (for AI features)
- Supabase account (for user data)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/debatepracticezone.git
   cd debatepracticezone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Gemini AI Configuration (Optional)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Database Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the provided migrations in the `supabase/migrations` folder
   - Enable Row Level Security (RLS) policies

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open in Browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Gemini AI Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file or use the in-app "Setup AI" button
3. The app works without AI but provides enhanced features with it

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Run the database migrations to set up tables and policies
4. Enable email authentication in Authentication settings

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and dev server

### Backend & Services
- **Supabase** - Backend-as-a-Service for auth and database
- **PostgreSQL** - Robust relational database
- **Google Gemini AI** - Advanced language model for debates
- **Row Level Security** - Database-level security policies

### Development Tools
- **ESLint** - Code linting and quality
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📱 Features Overview

### Learning Modules
- **Introduction to Debate**: Basic structure and techniques
- **Logical Fallacies**: Identify and avoid common reasoning errors
- **Advanced Techniques**: Sophisticated argumentation strategies

### Practice Modes
- **AI Debate Challenge**: Real-time debates with AI opponents
- **Unlimited Arguments**: Make as many points as possible in 5 minutes
- **Topic Variety**: 10+ diverse debate topics across multiple domains

### User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Comfortable viewing in any environment
- **Accessibility**: Screen reader friendly and keyboard navigable
- **Progressive Web App**: Install and use offline

## 🎯 Usage Guide

### For Students
1. **Sign Up**: Create your account to track progress
2. **Start Learning**: Begin with introductory modules
3. **Practice Debates**: Challenge the AI with various topics
4. **Review Feedback**: Analyze your performance and improve
5. **Earn Achievements**: Unlock badges as you master skills

### For Educators
1. **Monitor Progress**: Track student advancement through modules
2. **Assign Practice**: Recommend specific topics for practice
3. **Review Analytics**: Understand common areas for improvement
4. **Customize Learning**: Adapt content to curriculum needs

## 🔒 Security & Privacy

- **Data Encryption**: All data encrypted in transit and at rest
- **Row Level Security**: Database policies ensure users only access their data
- **API Key Security**: Gemini keys stored locally, never transmitted to servers
- **GDPR Compliant**: Respect user privacy and data rights
- **Secure Authentication**: Industry-standard auth with Supabase

## 🚀 Deployment

### Netlify (Recommended)
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Vercel
```bash
npm run build
vercel --prod
```

### Self-Hosted
```bash
npm run build
# Serve dist/ folder with any static file server
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add tests for new features
- Ensure responsive design

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized for fast loading
- **Mobile First**: Responsive design for all devices
- **Accessibility**: WCAG 2.1 AA compliant
- **SEO Optimized**: Meta tags and structured data

## 🐛 Troubleshooting

### Common Issues

**AI not responding?**
- Check your Gemini API key is valid
- Ensure you have API quota remaining
- Verify internet connection

**Database errors?**
- Confirm Supabase URL and keys are correct
- Check if RLS policies are properly set up
- Verify user authentication status

**Build failures?**
- Clear node_modules and reinstall dependencies
- Check Node.js version compatibility
- Verify all environment variables are set

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering intelligent debate responses
- **Supabase** for providing robust backend infrastructure
- **Tailwind CSS** for beautiful, responsive styling
- **React Community** for excellent development tools
- **Open Source Contributors** who make projects like this possible

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions for questions
- **Email**: Contact us at support@debatepracticezone.com

---

**Built with ❤️ for the debate community**

*Empowering the next generation of critical thinkers and effective communicators through AI-powered learning.*