# Voxe - AI-First Customer Support Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-purple)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com/)

> **Self-hosted AI customer support platform with unlimited resolutions, no per-seat fees, and complete data ownership.**

## 🚀 Features

- **🤖 AI-Powered Support** - 95%+ automation with RAG-powered knowledge bases
- **📱 Multi-Channel** - Web chat, email, SMS, WhatsApp integration
- **🏠 Self-Hosted** - Complete data ownership and privacy control
- **💰 One-Time Cost** - No recurring per-seat or per-resolution fees
- **🔧 Fully Customizable** - White-label ready with custom branding
- **📊 Advanced Analytics** - Comprehensive reporting and insights
- **🔗 Extensive Integrations** - CRM, n8n workflows, Fusion API

## 🏗️ Architecture

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM, PostgreSQL
- **AI**: OpenAI GPT-4o-mini with RAG implementation
- **Integrations**: n8n workflows, Chatwoot, Fusion API
- **Deployment**: Docker-ready, Vercel, or self-hosted

## 🐳 Quick Start with Docker

### Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- OpenAI API key
- Chatwoot instance (optional)

### 1. Clone and Setup

```bash
git clone https://github.com/your-username/Voxe.git
cd Voxe
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/Voxe"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3200"

# OpenAI
OPENAI_API_KEY="your-openai-key"

# Chatwoot (optional)
CHATWOOT_BASE_URL="https://your-chatwoot-instance.com"
CHATWOOT_ACCOUNT_ID="your-account-id"
CHATWOOT_API_KEY="your-api-key"

# Fusion API (optional)
FUSION_API_KEY="your-fusion-key"
FUSION_BASE_URL="https://api.mcp4.ai"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 4. Build and Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Docker
docker-compose up -d
```

## 📋 Production Deployment

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | Your application URL |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI features |
| `CHATWOOT_BASE_URL` | ❌ | Chatwoot instance URL |
| `CHATWOOT_ACCOUNT_ID` | ❌ | Chatwoot account ID |
| `CHATWOOT_API_KEY` | ❌ | Chatwoot API key |
| `FUSION_API_KEY` | ❌ | Fusion API key for AI orchestration |
| `SMTP_HOST` | ❌ | SMTP server for email notifications |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |

### Security Checklist

- [ ] Change default `NEXTAUTH_SECRET`
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable email verification
- [ ] Configure 2FA (optional)

### Performance Optimization

- [ ] Enable Next.js production optimizations
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling
- [ ] Enable Redis for caching (optional)
- [ ] Configure monitoring and logging

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run test         # Run tests
```

## 📚 Documentation

- [Database Setup](docs/DATABASE_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Integration Guide](docs/CRM_INTEGRATION_GUIDE.md)
- [Troubleshooting](docs/N8N_TROUBLESHOOTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@mcp4.ai
- 📖 Documentation: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/Voxe/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/Voxe/discussions)

## 🎯 Roadmap

- [ ] Mobile app for agents
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enterprise SSO integration
- [ ] Advanced workflow automation
- [ ] Voice support integration

---

**Built with ❤️ for businesses that value data ownership and cost efficiency.**