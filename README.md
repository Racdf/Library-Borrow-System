# MyLib - Library Borrowing System

A modern, institutional-style library management system inspired by the aesthetics of the Internet Archive. Featuring a Node.js backend with Prisma & MySQL, and a React/Vite frontend.

## 🚀 Features

- **Institution-grade UI**: Clean, professional design with a navy blue palette.
- **Library Catalog**: Search and browse available books with real-time inventory tracking.
- **Physical Copy Management**: Each book tracks multiple specific physical copies (Borrow/Return/Reserve).
- **Borrowing Limits**: Users are limited to 10 active loans to ensure fair distribution.
- **Idempotency**: All critical transactions (Borrow/Return) use idempotency keys to prevent duplicate operations.
- **Lending History**: Complete record of active and past loans with due date tracking.
- **Waitlisting**: Automated reservation system for books currently in high demand.

## 🛠️ Tech Stack

### Backend
- **Node.js & Express**: Core API server.
- **Prisma ORM**: Type-safe database access and migrations.
- **MySQL (Aiven Hosted)**: Production-ready relational database.
- **JWT & Bcrypt**: Secure authentication and password hashing.
- **Zod**: Robust request validation.

### Frontend
- **React 19 & Vite 8**: Modern, high-performance web framework.
- **Tailwind CSS 4**: Utility-first styling with high-fidelity institutional design tokens.
- **Framer Motion & GSAP**: Smooth micro-animations and stagger interactions.
- **Lucide React**: Minimalist icon system.

## 💻 Local Setup

### Prerequisites
- Node.js (v18+)
- MySQL instance (local or remote)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/Library-Borrow-System.git
cd "Library Borrow System"

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="mysql://your_user:your_pass@your_host:your_port/your_db"
JWT_SECRET="your_jwt_secret"
```

### 3. Database Initialization
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Run Development Servers
**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📄 License
This project is open-source and free to use.
