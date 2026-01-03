<div align="center">

# 🚛 Truckie Frontend

### Modern Logistics & Fleet Management Web Application

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6.0-0170FE?style=for-the-badge&logo=ant-design&logoColor=white)](https://ant.design/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

*A comprehensive frontend application for truck logistics operations with real-time GPS tracking, intelligent dashboards, and seamless user experience across Admin, Staff, Driver, and Customer roles.*

[Live Demo](https://truckie.vercel.app/) • [Backend API](https://web-production-7b905.up.railway.app/swagger-ui/index.html) • [Report Bug](#-contributing) • [Request Feature](#-contributing)

</div>

---

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About The Project

**Truckie Frontend** is a modern, responsive web application built as part of the Truckie logistics platform - a capstone project at FPT University (Fall 2025). The application provides intuitive interfaces for multiple user roles, enabling efficient fleet management, real-time order tracking, and seamless communication between stakeholders.

### 🎓 Capstone Project Details
- **University:** FPT University
- **Semester:** Fall 2025 (9/2025 - 12/2025)
- **Team Size:** 5 members
- **Development Duration:** 4 months

### 💡 Design Philosophy

- **User-Centric:** Tailored interfaces for different user roles (Admin, Staff, Customer)
- **Real-Time:** WebSocket integration for live updates and tracking
- **Responsive:** Mobile-first design approach with Tailwind CSS
- **Performance:** Optimized with React Query, lazy loading, and code splitting
- **Accessibility:** WCAG 2.1 compliant with keyboard navigation support

---

## ⭐ Key Features

### 👤 Role-Based Dashboards

#### 🔧 Admin Dashboard
- **Comprehensive analytics** - Revenue, orders, fleet performance metrics
- **User management** - CRUD operations for all user roles
- **Vehicle fleet management** - Registration, maintenance tracking, assignments
- **Pricing configuration** - Dynamic pricing rules and category management
- **System monitoring** - Real-time operational insights

#### 📊 Staff Dashboard
- **Order processing** - Create, assign, and track orders
- **Driver management** - Assign drivers, monitor performance
- **Contract generation** - Digital PDF contracts with e-signatures
- **Issue resolution** - Handle customer complaints and damage reports
- **Payment tracking** - Transaction monitoring and validation

#### 🚚 Driver Portal
- **Active assignments** - View assigned orders and routes
- **Real-time navigation** - GPS tracking with turn-by-turn directions
- **Order completion** - Photo verification and digital signatures
- **Seal management** - Container seal tracking
- **Earnings dashboard** - Trip history and payment tracking

#### 👥 Customer Portal
- **Order creation** - Quick booking with intelligent pricing
- **Real-time tracking** - Live GPS updates of shipments
- **Payment integration** - Multiple payment gateways (PayOS)
- **Order history** - Complete shipment records
- **Issue reporting** - Submit and track complaints

### 🗺️ Real-Time Features

- **Live GPS Tracking** - WebSocket-powered vehicle location updates
- **Interactive Maps** - VietMap/MapLibre integration with route visualization
- **Off-Route Alerts** - Automated deviation detection with grace periods
- **Push Notifications** - Real-time order status updates
- **Live Chat** - AI-powered chatbot for customer support

### 🎨 UI/UX Features

- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Dark/Light Mode** - Theme customization (planned)
- **Internationalization** - Multi-language support (Vietnamese/English)
- **Data Visualization** - Interactive charts with Ant Design Charts
- **Print/Export** - PDF generation for contracts and reports

---

## 🛠️ Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1 | UI library with concurrent features |
| TypeScript | 5.8 | Type-safe development |
| Vite | 7.0 | Next-generation build tool |
| React Router | 7.7 | Client-side routing |

### UI & Styling
| Technology | Purpose |
|------------|---------|
| Ant Design | 6.0 - Enterprise UI components |
| Tailwind CSS | 3.4 - Utility-first styling |
| Ant Design Charts | 2.6 - Data visualization |
| Lucide React | Icon library |
| React Icons | Additional icon sets |

### State & Data Management
| Technology | Purpose |
|------------|---------|
| Redux Toolkit | 2.8 - Global state management |
| TanStack Query | 5.87 - Server state & caching |
| React Context | Local state sharing |
| Axios | HTTP client with interceptors |

### Real-Time & Communication
| Technology | Purpose |
|------------|---------|
| STOMP.js | 7.2 - WebSocket protocol |
| Socket.IO Client | 4.8 - Real-time messaging |
| SockJS Client | 1.6 - WebSocket fallback |

### Maps & Geolocation
| Technology | Purpose |
|------------|---------|
| VietMap GL JS | 6.0 - Vietnam map provider |
| MapLibre GL | 5.6 - Open-source mapping |
| TrackAsia GL | 2.0 - Alternative map provider |

### Utilities & Plugins
| Technology | Purpose |
|------------|---------|
| date-fns | 4.1 - Date manipulation |
| Day.js | 1.11 - Lightweight date library |
| UUID | 11.1 - Unique ID generation |
| html2canvas | 1.4 - Screenshot capture |
| jsPDF | 3.0 - PDF generation |
| React Toastify | 11.0 - Toast notifications |

### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| TypeScript ESLint | TS-specific linting |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixes |
| Concurrently | Run multiple scripts |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
├──────────────────┬──────────────────┬──────────────────┬───────────────────┤
│   Admin Portal   │   Staff Portal   │   Driver Portal  │  Customer Portal  │
│   (Dashboard)    │   (Operations)   │   (Mobile-Ready) │   (Tracking)      │
└────────┬─────────┴────────┬─────────┴────────┬─────────┴─────────┬─────────┘
         │                  │                  │                   │
         └──────────────────┴────────┬─────────┴───────────────────┘
                                     │
                           ┌─────────▼─────────┐
                           │   React Router    │
                           │   (Routing)       │
                           └─────────┬─────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
┌────────▼────────┐        ┌─────────▼─────────┐       ┌────────▼────────┐
│  Redux Store    │        │  TanStack Query   │       │  WebSocket      │
│  (Global State) │        │  (Server Cache)   │       │  (Real-time)    │
└────────┬────────┘        └─────────┬─────────┘       └────────┬────────┘
         │                           │                          │
         └───────────────────────────┼──────────────────────────┘
                                     │
                           ┌─────────▼─────────┐
                           │   Axios Client    │
                           │   (HTTP + Auth)   │
                           └─────────┬─────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐        ┌─────────────────┐       ┌─────────────────┐
│   Backend API   │        │   VietMap API   │       │   PayOS API     │
│   (Railway)     │        │   (Mapping)     │       │   (Payment)     │
└─────────────────┘        └─────────────────┘       └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** v16.x or higher
- **npm** v8.x or higher
- **Git**
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Truckie-Logistic-System/truckie-fe
   cd truckie-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the environment template and configure:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration (see [Environment Configuration](#-environment-configuration))

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The application will run at `http://localhost:5173/`

5. **Build for production**
   ```bash
   npm run build
   ```
   
6. **Preview production build**
   ```bash
   npm run preview
   ```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **Module not found** | Run `npm install` to ensure all dependencies are installed |
| **API connection failed** | Check `.env` file and verify backend API is running |
| **Map not loading** | Verify map API keys in `.env` are valid |
| **CORS errors** | Ensure backend allows requests from your domain |
| **Port 5173 in use** | Vite will auto-select another port - check terminal for URL |

---

## 📁 Project Structure

```
truckie-fe/
├── public/
│   ├── index.html              # Landing page
│   └── sounds/                 # Notification sounds
├── src/
│   ├── assets/                 # Static assets (images, fonts)
│   │   └── images/
│   ├── components/             # Reusable UI components
│   │   ├── Admin/              # Admin-specific components
│   │   ├── ai-chatbot/         # AI chat integration
│   │   ├── auth/               # Authentication components
│   │   ├── common/             # Shared components
│   │   ├── features/           # Feature-specific components
│   │   ├── issues/             # Issue tracking components
│   │   ├── layout/             # Layout components (Header, Sidebar)
│   │   ├── map/                # Map components
│   │   ├── modals/             # Modal dialogs
│   │   ├── notifications/      # Notification components
│   │   ├── off-route-warning/  # Route deviation alerts
│   │   ├── shared/             # Shared utilities
│   │   ├── userChat/           # User chat components
│   │   └── websocket/          # WebSocket handlers
│   ├── config/                 # App configuration
│   │   ├── constants.ts        # Global constants
│   │   ├── env.ts              # Environment variables
│   │   └── weightUnits.ts      # Unit configurations
│   ├── constants/              # Additional constants
│   │   ├── enums/              # TypeScript enums
│   │   ├── sealConstants.ts    # Seal-related constants
│   │   └── index.ts
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication context
│   │   ├── IssuesContext.tsx   # Issue management context
│   │   └── index.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAddressOperations.ts
│   │   ├── useAddressSearch.ts
│   │   ├── useCarrierSettings.ts
│   │   ├── useCategoryManagement.ts
│   │   ├── useContractForm.ts
│   │   └── ... (30+ custom hooks)
│   ├── models/                 # TypeScript interfaces/types
│   │   ├── Address.ts
│   │   ├── Contract.ts
│   │   ├── Order.ts
│   │   └── ... (domain models)
│   ├── pages/                  # Page components
│   │   ├── Admin/              # Admin dashboard pages
│   │   ├── Auth/               # Login, register pages
│   │   ├── customer/           # Customer portal pages
│   │   ├── Dashboard/          # Main dashboard
│   │   ├── Orders/             # Order management pages
│   │   ├── Profile/            # User profile pages
│   │   ├── Staff/              # Staff portal pages
│   │   └── RecipientTracking/  # Public tracking page
│   ├── routes/                 # Routing configuration
│   │   └── index.tsx           # Route definitions
│   ├── services/               # API services
│   │   ├── api.ts              # Axios instance
│   │   ├── authService.ts      # Authentication APIs
│   │   ├── orderService.ts     # Order APIs
│   │   └── ... (service modules)
│   ├── styles/                 # Global styles
│   │   └── index.css           # Tailwind imports
│   ├── types/                  # TypeScript type definitions
│   │   └── ... (type files)
│   ├── utils/                  # Utility functions
│   │   ├── dateUtils.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ... (helper functions)
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global CSS
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.ts              # Vite configuration
├── vercel.json                 # Vercel deployment config
└── README.md                   # This file
```

---

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

### API Configuration
```env
# Backend API
VITE_API_URL=https://web-production-7b905.up.railway.app
VITE_API_TIMEOUT=30000

# WebSocket
VITE_WS_URL=https://web-production-7b905.up.railway.app
```

### Authentication
```env
VITE_AUTH_TOKEN_KEY=truckie_auth_token
VITE_AUTH_REFRESH_TOKEN_KEY=truckie_refresh_token
```

### Map Services
```env
# VietMap
VITE_VIET_MAPS_API_KEY=your_vietmap_api_key

# OpenMap
VITE_OPEN_MAP_API_KEY=your_openmap_api_key
VITE_OPEN_MAP_API_BASE_URL=https://mapapis.openmap.vn/v1

# TrackAsia
VITE_TRACKASIA_MAP_API_KEY=your_trackasia_api_key
VITE_TRACKASIA_MAP_API_BASE_URL=https://maps.track-asia.com
```

### App Configuration
```env
VITE_APP_NAME=Truckie
VITE_APP_DESCRIPTION=Transportation Management System with Real-Time GPS Tracking
VITE_SUPPORT_EMAIL=support@truckie.com
VITE_SUPPORT_PHONE=02873005588
```

### Feature Flags
```env
VITE_FEATURE_LIVE_TRACKING=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_CHAT=true
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `http://localhost:5173` |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run start` | Alias for `npm run dev` |

### Development Workflow

```bash
# Start development
npm run dev

# In another terminal, run linting
npm run lint

# Build for production
npm run build

# Test production build locally
npm run preview
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- Use functional components with hooks
- Write meaningful commit messages
- Add TypeScript types for all props and functions
- Ensure components are reusable and well-documented
- Use Tailwind CSS for styling (avoid inline styles)
- Implement proper error handling

### Component Guidelines
```typescript
// Example: Properly typed functional component
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

---

## 📄 License

This project is developed for educational purposes as part of FPT University's Capstone Project program.

---

## 🌐 Deployment

### Production
- **Platform:** Vercel
- **URL:** [https://truckie.vercel.app/](https://truckie.vercel.app/)
- **Auto-Deploy:** Push to `main` branch triggers deployment

### Performance Optimizations
- Code splitting with dynamic imports
- Lazy loading for routes and heavy components
- Image optimization with next-gen formats
- TanStack Query for efficient data caching
- Service Worker for offline capabilities (planned)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ by FPT University Students**

[Report Bug](https://github.com/Truckie-Logistic-System/truckie-fe/issues) • [Request Feature](https://github.com/Truckie-Logistic-System/truckie-fe/issues)

</div>
