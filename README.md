# LearnSphere – AI Tutor Hub (FYP-I Version)

A comprehensive full-stack Next.js 14 learning management system with AI-powered tutoring, practice questions, and performance analytics.

## Features

### Authentication & Security
- Email-based registration and login
- NextAuth with JWT session strategy
- 6-digit OTP 2FA (expires in 5 minutes)
- Password hashing with bcryptjs
- Role-based access control (STUDENT, ADMIN)

### Admin Dashboard
- User Management CRUD with DataTable
- Pagination, search, create, edit, and soft-delete functionality
- Analytics and settings pages
- User role and status management

### Student Dashboard
- Interactive widgets showing:
  - Course coverage by subject
  - Mock test score trends
  - Topic weaknesses analysis
  - Quick learning metrics
- Quick access buttons to all features

### Q&A Tutor
- Chat-style interface for asking questions
- Three explanation modes:
  - Short Answer: Concise explanations
  - Detailed Answer: Comprehensive explanations with examples
  - Hint Only: Guidance without direct answers
- Chat history storage and retrieval
- Mock responses based on explanation mode

### Practice Questions
- Customizable quiz generation
- Filter by topic (Math, Physics, Chemistry, Biology)
- Filter by difficulty (Easy, Medium, Hard)
- Immediate feedback with explanations
- Score tracking and performance metrics
- Question history storage

### Performance Analytics
- Overall accuracy tracking
- Weekly progress visualization
- Topic-wise performance analysis
- Skill assessment radar chart
- Personalized recommendations

### Past Paper Patterns
- Historical exam pattern analysis
- 5-year trend visualization
- Question distribution by subject
- Difficulty level trends
- Key insights and predictions

## Tech Stack

- **Frontend**: React 19, Next.js 14 (App Router)
- **Styling**: TailwindCSS v4, ShadCN/UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5
- **Charts**: Recharts
- **Icons**: Lucide React
- **Security**: bcryptjs for password hashing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## Installation

### 1. Clone and Setup

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd learnsphere

# Install dependencies
npm install
\`\`\`

### 2. Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/learnsphere"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional - for production OTP sending)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@learnsphere.com"
\`\`\`

### 3. Database Setup

\`\`\`bash
# Run Prisma migrations
npm run db:push

# Seed demo users (admin and student)
npx ts-node scripts/seed-admin.ts
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\` in your browser.

## Demo Credentials

### Admin Account
- **Email**: admin@learnsphere.com
- **Password**: Admin123

### Student Account
- **Email**: student@learnsphere.com
- **Password**: Student123

### OTP for Testing
- **OTP Code**: 123456 (for demo purposes)

## Project Structure

\`\`\`
learnsphere/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── otp/               # OTP verification
│   │   ├── users/             # User management
│   │   ├── chat/              # Q&A tutor
│   │   └── practice/          # Practice questions
│   ├── admin/                 # Admin pages
│   ├── student/               # Student pages
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── verify-otp/            # OTP verification page
├── components/
│   ├── admin/                 # Admin components
│   ├── student/               # Student components
│   └── ui/                    # ShadCN UI components
├── lib/
│   ├── auth.ts                # Auth utilities
│   └── db.ts                  # Prisma client
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── seed-admin.ts          # Seed demo users
└── middleware.ts              # Route protection
\`\`\`

## Database Schema

### User
- id, email, name, password, role, status, createdAt, updatedAt, deletedAt

### OTP
- id, userId, code, expiresAt, createdAt, verified

### ChatHistory
- id, userId, question, mode, answer, createdAt

### PracticeQuestion
- id, userId, question, options, correctAnswer, explanation, topic, difficulty, createdAt

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/auth/register` - User registration
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP

### User Management (Admin only)
- `GET /api/users` - List users with pagination
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Soft delete user

### Q&A Tutor
- `POST /api/chat` - Send question and get answer
- `GET /api/chat` - Get chat history

### Practice Questions
- `POST /api/practice/generate` - Generate practice questions
- `GET /api/practice/history` - Get practice history

## Role-Based Access Control

### Admin Routes
- `/admin` - Dashboard
- `/admin/analytics` - Analytics page
- `/admin/settings` - Settings page

### Student Routes
- `/student/dashboard` - Dashboard
- `/student/tutor` - Q&A Tutor
- `/student/practice` - Practice Questions
- `/student/performance` - Performance Analytics
- `/student/papers` - Past Paper Patterns
- `/student/settings` - Settings

## Middleware Protection

The middleware in `middleware.ts` enforces:
- Authentication requirement for protected routes
- OTP verification before dashboard access
- Role-based route access (admin vs student)
- Automatic redirects based on user role

## Available Scripts

\`\`\`bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio

# Linting
npm run lint
\`\`\`

## Features Implemented

✅ Complete authentication with 2FA
✅ Admin user management CRUD
✅ Student dashboard with analytics
✅ Q&A tutor with multiple explanation modes
✅ Practice question generator
✅ Performance tracking and analytics
✅ Past paper pattern analysis
✅ Role-based access control
✅ Responsive UI with TailwindCSS
✅ Database persistence with Prisma

## Future Enhancements

- Real AI integration for Q&A responses
- Email notifications for OTP
- Advanced analytics and reporting
- File upload for study materials
- Video tutorials integration
- Peer-to-peer learning features
- Mobile app version
- Real-time collaboration features

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env.local
- Check database credentials

### OTP Not Working
- For development, use OTP: 123456
- In production, configure SMTP settings

### Authentication Issues
- Clear browser cookies
- Check NEXTAUTH_SECRET is set
- Verify JWT token expiration

## Support

For issues or questions, please open an issue in the repository.

## License

MIT License - See LICENSE file for details

## Author

Created as FYP-I (Final Year Project - Phase 1) for LearnSphere AI Tutor Hub
