# Advanced To-Do Application (Beta)

🚀 **Beta Version** - A comprehensive task management solution with real-time collaboration features and modern authentication. Built with the MERN stack (MongoDB, Express.js, React, Node.js) for seamless personal and team productivity.

## 🌟 Key Features

### 📝 Task Management
- Create, edit, and organize tasks with due dates and priorities
- Mark tasks as complete/incomplete with visual indicators
- Set and track deadlines with calendar integration
- Categorize and filter tasks for better organization

### � Modern Authentication
- **Email Verification**: Secure OTP-based email verification
- **Google Sign-In**: One-click authentication with Google accounts
- **JWT Tokens**: Secure session management
- **Password Security**: Bcrypt encryption for passwords

### �👥 Team Collaboration
- **Public & Private Groups**: Create groups with different visibility settings
- **Role-Based Access Control**:
  - **Owner**: Full administrative control
  - **Collaborator**: Add/edit/delete tasks
  - **Medium Access**: Add and edit own tasks
  - **Observer**: View-only access
- **Activity Feed**: Track all changes in real-time

### � Mobile-Responsive Design
- **Mobile-First UI**: Optimized for smartphones and tablets
- **Hamburger Navigation**: Collapsible menu for mobile devices
- **Touch-Friendly Interface**: Large buttons and easy navigation
- **Responsive Forms**: Adaptive layouts for all screen sizes

### 🔒 Security & Access
- Email verification with OTP system
- Google OAuth 2.0 integration
- Private groups with access key protection
- Role-based permissions system
- Secure API endpoints with JWT authentication

## 🛠️ Tech Stack

### Frontend
- React with Hooks
- Context API for state management
- Tailwind CSS for styling
- Native Fetch API for HTTP requests

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- RESTful API design

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Brahmando/To-Do-Advanced.git
   cd To-Do-Advanced
   ```

2. **Set up the backend**
   ```bash
   cd To-Do-Backend
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../To-Do-Frontend
   npm install
   ```

4. **Environment Setup**
   - Create a `.env` file in the backend directory:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     PORT=5000
     ```

5. **Run the application**
   ```bash
   # Start backend
   cd To-Do-Backend
   npm start

   # Start frontend (in a new terminal)
   cd To-Do-Frontend
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.