# ResumeLM - Free AI Resume Builder | Create ATS-Optimized Resumes in Minutes

<div align="center">

![ResumeLM Logo](public/og.webp)

**🚀 The AI-Powered Resume Builder That Gets You Hired**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-resumelm.com-blue?style=for-the-badge)](https://resumelm.com)
[![GitHub Stars](https://img.shields.io/github/stars/olyaiy/resume-lm?style=for-the-badge)](https://github.com/olyaiy/resume-lm/stargazers)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

</div>

## 🚀 Fork Enhancements & New Features

This fork extends the original ResumeLM with powerful new capabilities designed for serious job seekers:

### 1. 📋 Job Application Tracker
Keep track of every application in one place.
- **Kanban-style tracking**: Statuses for Saved, Applied, Interviewing, Offer, and Rejected.
- **Job Details**: Store job descriptions, salary ranges, and application links.
- **Resume Linking**: Automatically link tailored resumes to specific job applications.

### 2. 📝 Automated Cover Letter Generator
Stop writing cover letters from scratch.
- **AI-Generated**: Automatically generates a tailored cover letter when you create a resume.
- **Context-Aware**: Uses your resume and the specific job description to craft a compelling narrative.
- **Native PDF Export**: Robust, server-side PDF generation (using `@react-pdf/renderer`) ensures your cover letter always looks perfect and is never blank.

### 3. 🤖 Robust AI Integration
More reliable and cost-effective AI.
- **OpenRouter Support**: Use any model you want via OpenRouter (DeepSeek, Llama 3, etc.).
- **Free Model Fallbacks**: Automatically falls back to free models if premium keys are missing or exhausted.
- **Smart Error Handling**: Graceful degradation and retry logic for network or API failures.

---

## 🎯 Why Choose ResumeLM?

**ResumeLM** is a free, open-source AI resume builder that helps job seekers create professional, ATS-optimized resumes that increase interview chances by up to **3x**. Our intelligent platform combines cutting-edge AI technology with proven resume best practices to help you land your dream job.

## ✨ Key Features & Screenshots

### 🤖 AI-Powered Resume Assistant
![AI Resume Assistant](public/SS%20Chat.png)

**90% More Effective Bullet Points**
- Smart content suggestions based on your experience
- Real-time feedback on your resume content
- Industry-specific optimization for better results
- ATS-friendly formatting and keyword optimization

### 📊 Beautiful Resume Dashboard
![Resume Dashboard](public/Dashboard%20Image.png)

**Organize Your Entire Job Search**
- Centralized resume management system
- Create base resumes and tailored versions

### 📈 Resume Performance Scoring
![Resume Scoring](public/SS%20Score.png)

**3x Higher Response Rates**
- ATS compatibility scoring and analysis
- Keyword optimization insights
- Detailed improvement recommendations
- Performance metrics and analytics

### 📝 AI Cover Letter Generator
![Cover Letter Generator](public/SS%20Cover%20Letter.png)

**Save 30+ Minutes Per Application**
- Tailored to match specific job requirements
- Professional tone and structure
- Highlights your relevant achievements
- Personalized for each opportunity

## 🚀 Live Demo & Getting Started

**[Try ResumeLM Now - 100% Free](https://resumelm.com)**

No credit card required • No signup fees • Open source

## 🛠️ Complete Tech Stack

### Frontend & UI
- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest React features and optimizations
- **TypeScript** - Type-safe development
- **Shadcn UI** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations

### AI & Intelligence
- **OpenAI GPT** - Advanced content generation
- **Claude AI** - Alternative AI model support
- **Gemini AI** - Google's AI integration
- **DeepSeek** - Cost-effective AI processing (via OpenRouter)
- **Groq** - High-speed AI inference

### Backend & Database
- **PostgreSQL** - Robust relational database
- **Supabase** - Backend-as-a-Service with auth
- **Row Level Security** - Enterprise-grade security

### Additional Features
- **React PDF** - Professional PDF generation (for both Resumes and Cover Letters)
- **Stripe Integration** - Secure payment processing
- **Real-time Updates** - Live preview and editing
- **Mobile Responsive** - Works on all devices

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Supabase account

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/olyaiy/resume-lm.git
cd resume-lm
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment setup**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
```env
# Database
DATABASE_URL=your_postgresql_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Add at least one)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
GOOGLE_AI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key # Recommended for access to DeepSeek etc.

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Payments (Optional)
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public
```

5. **Database setup**
```bash
# Run the schema.sql file in your Supabase SQL editor
# Or use the Supabase CLI:
supabase db push --db-url=your_supabase_db_url schema.sql
```

6. **Start development server**
```bash
pnpm dev
```

Visit `http://localhost:3000` to see your local ResumeLM instance!

### 🐳 Docker Setup (Alternative)

Run the complete stack locally with Docker Compose - includes Supabase, PostgreSQL, Redis, and all services:

```bash
# 1. Copy environment file and add your AI API key
cp .env.example .env.local
# Edit .env.local and add at least one: OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY

# 2. Start Docker services
cd docker
docker compose --env-file ../.env.local up -d

# 3. Wait for services to be healthy (~60 seconds)
docker compose --env-file ../.env.local ps

# 4. Run the app locally (from project root)
cd ..
pnpm dev
```

**Login:** http://localhost:3000 with `admin@admin.com` / `Admin123` (Pro subscription auto-granted)

| Service | URL | Description |
|---------|-----|-------------|
| **App** | http://localhost:3000 | Next.js application |
| **Supabase API** | http://localhost:54321 | API Gateway |
| **Supabase Studio** | http://localhost:54323 | Database dashboard |
| **Redis Commander** | http://localhost:8081 | Redis management UI |

> 📖 See [docker/DOCKER.md](docker/DOCKER.md) for full Docker documentation including full-stack mode.

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Here's how you can help:

### Ways to Contribute
- 🐛 **Bug Reports** - Help us identify and fix issues
- 💡 **Feature Requests** - Suggest new functionality
- 🔧 **Code Contributions** - Submit pull requests
- 📚 **Documentation** - Improve our guides and docs
- 🎨 **Design** - Enhance UI/UX elements

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Community

### Get Help
- 📧 **Email Support** - Contact us for technical issues
- 💬 **GitHub Discussions** - Community Q&A and feature requests
- 🐛 **Issue Tracker** - Report bugs and technical problems
- 📖 **Documentation** - Comprehensive guides and tutorials

### Stay Updated
- ⭐ **Star this repo** - Get notified of new releases
- 👀 **Watch releases** - Stay informed about updates
- 🐦 **Follow on social media** - Latest news and tips

## 📄 License & Legal

**GNU Affero General Public License v3 (AGPL-3.0)**

### License Summary
- ✅ **Commercial Use** - Use in commercial projects
- ✅ **Modification** - Modify and distribute changes
- ✅ **Distribution** - Share the software freely
- ✅ **Patent Use** - Use any patents in the software
- ❗ **Disclose Source** - Must provide source code
- ❗ **License Notice** - Include license and copyright notice
- ❗ **Network Use** - Network use is considered distribution
- ❗ **Same License** - Derivative works must use same license

### Commercial Licensing
For businesses requiring proprietary licenses or commercial support, please contact us for custom licensing arrangements.


---

<div align="center">

**Ready to land your dream job?**

[![Get Started Free](https://img.shields.io/badge/🚀_Get_Started_Free-resumelm.com-blue?style=for-the-badge&color=6366f1)](https://resumelm.com)
[![View Source Code](https://img.shields.io/badge/📚_View_Source-GitHub-black?style=for-the-badge&logo=github)](https://github.com/olyaiy/resume-lm)

**Built with ❤️ using Next.js**

</div>
