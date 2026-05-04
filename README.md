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
- Node.js
- MongoDB (running locally or via MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/Scanny-1/Smart_Contract_Lifecycle.git
cd Smart_Contract_Lifecycle
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add the necessary environment variables (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`).
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Architecture
This project is built using a modern decoupled architecture. The frontend acts as a single-page application communicating via REST APIs and WebSockets to the Node.js backend. Security best practices such as rate limiting, Helmet for HTTP headers, and input sanitization are implemented at the backend level.

## License
ISC
