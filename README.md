# Smart Contract Lifecycle Management System

A robust MERN stack application designed to manage the end-to-end lifecycle of smart contracts. This platform provides secure role-based access control, real-time dashboard analytics, and automated contract state management.

## Features

- **Role-Based Access Control (RBAC):** Secure authentication and authorization with dedicated access levels (e.g., SuperAdmin, Company Admin, Employee).
- **Contract State Machine:** Efficiently manage contract statuses (Draft, Pending, Active, Expired, Rejected).
- **Automated Expiry Management:** Client-side and server-side algorithms to handle contract expirations automatically.
- **Real-Time Analytics:** Interactive dashboard statistics and charts visualizing contract metrics (powered by Chart.js).
- **Secure File Handling:** Secure contract document uploads and management.
- **RESTful API:** Robust Node.js/Express backend with MongoDB integration.

## Technology Stack

### Frontend
- React (Vite)
- React Router DOM
- Chart.js & React-Chartjs-2
- Socket.io-client
- Axios

### Backend
- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcryptjs for authentication
- Socket.io for real-time features
- Multer for file uploads
- Node-cron for scheduled tasks

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via MongoDB Atlas)
- **Docker & Docker Compose** (highly recommended for production-like local setup)

### Method A: Running with Docker (Recommended)
This launches the frontend (Nginx SPA proxy), backend, and database in containerized isolation.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Scanny-1/Smart_Contract_Lifecycle.git
   cd Smart_Contract_Lifecycle
   ```
2. **Configure environment files**:
   Copy `.env.example` to `.env` in the root folder, and set values if needed:
   ```bash
   cp .env.example .env
   ```
3. **Build and start services**:
   ```bash
   docker compose up --build -d
   ```
4. **Access the application**:
   - Frontend SPA: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

### Method B: Manual / Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Scanny-1/Smart_Contract_Lifecycle.git
cd Smart_Contract_Lifecycle
```

#### 2. Backend Setup
```bash
cd backend
npm install
```
Configure environment settings. Copy `backend/.env.example` to `backend/.env` and configure credentials:
```bash
cp .env.example .env
```
Start development backend:
```bash
npm run dev
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Configure environment settings. Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp .env.example .env
```
Start development frontend (Vite):
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

---

## Environment Configuration

### Root / Docker Config
- `PORT`: Port exposed by the Backend server (default `5000`).
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key used for signing JWT login tokens.
- `CORS_ORIGIN`: Comma-separated list of domains allowed to request API data.
- `VITE_API_URL`: Backend api URL consumed by React.
- `VITE_SERVER_URL`: Base server URL consumed for downloading static contract uploads.

---

## Architecture & Production Best Practices
This project is built using a modern decoupled architecture:
- **Frontend SPA**: Vite builds assets optimized for production, served by Nginx with client-side SPA routing fallback enabled.
- **Backend API**: Node.js/Express service containerized with dynamic CORS controls, request rate limiting, Helmet security headers, and an automatic directory setup for multipart uploads.
- **CI/CD Validation**: Implemented via GitHub Actions to validate code compile and syntactical syntax checks on every main integration.



