# PMSyst - Poultry Management System

A comprehensive full-stack application for managing poultry farms, flocks, and growth tracking. PMSyst provides both a robust backend API and a mobile-first frontend for farmers to monitor their operations.

## 📋 Project Overview

**PMSyst** enables users to:

- Register and authenticate securely (email/password or Google OAuth)
- Create and manage poultry batches with breed information
- Track growth logs including weight, feed consumption, and mortality
- Manage orders and tasks related to their operations
- Communicate with other users via chat functionality
- Real-time notifications and updates

## 🏗️ Architecture

```
PMSyst (Full Stack)
├── pm-backend/        # Express.js REST API
│   ├── Controllers    # Business logic
│   ├── Models         # Mongoose schemas (MongoDB)
│   ├── Routes         # API endpoints with Swagger docs
│   ├── Middlewares    # Auth, validation, security
│   ├── Utils          # Database, sockets, auth strategies
│   └── Validations    # Joi schema validation
│
└── pms-frontend/      # React Native + Expo
    ├── app/           # File-based routing (Expo Router)
    ├── components/    # Reusable UI components
    ├── context/       # Auth context management
    ├── hooks/         # Custom React hooks
    └── constants/     # Theme, colors, configuration
```

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: Passport.js (Local + Google OAuth 2.0)
- **API Documentation**: Swagger/OpenAPI
- **Real-time Communication**: Socket.io
- **Email**: Nodemailer
- **Validation**: Joi
- **Security**: bcrypt, JWT, Arcjet middleware

### Frontend

- **Framework**: React Native with Expo
- **Language**: TypeScript/JSX
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native built-ins + Expo Vector Icons
- **State Management**: React Context API
- **Date Picker**: React Native Community DateTimePicker
- **Build Tool**: Expo CLI

## 📦 Project Structure

### Backend (`pm-backend/`)

| File/Folder    | Purpose                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `index.js`     | Express app entry point, middleware setup, route mounting                       |
| `controllers/` | Business logic for auth, batches, breeds, chats, growth logs                    |
| `models/`      | Mongoose schemas: User, Batch, Breed, Chat, Message, Order, Task, GrowthLog     |
| `routes/`      | API endpoint definitions with Swagger annotations                               |
| `middlewares/` | Auth verification, Arcjet rate limiting                                         |
| `utils/`       | Database connection, Passport strategies, Socket.io helpers, push notifications |
| `helpers/`     | Email utilities, environment variable helpers                                   |
| `validations/` | Joi validation schemas for input sanitization                                   |
| `swagger.json` | Swagger/OpenAPI specification                                                   |

### Frontend (`pms-frontend/`)

| File/Folder      | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `app/`           | Main application structure with file-based routing                    |
| `app/(auth)/`    | Login and signup screens                                              |
| `app/(screens)/` | Feature screens: batches, breeds, growth logs, orders, tasks, chat    |
| `app/(tabs)/`    | Bottom tab navigation: home, breeds, chat, growth logs, orders, tasks |
| `components/`    | Navbar, SafeScreen wrapper, auth toggle, user menu                    |
| `context/`       | AuthContext for global auth state management                          |
| `hooks/`         | Custom hooks for color scheme, theme management                       |
| `constants/`     | Color palettes, theme configuration                                   |

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Expo Go** app (for frontend testing on mobile)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd pm-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with required variables:

   ```env
   PORT=9000
   MONGODB_URI=mongodb://localhost:27017/pmsyst
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRY=7d

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:9000/auth/google/callback

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@pmsyst.com

   # Frontend URL
   FRONTEND_URL=http://localhost:8081

   # Arcjet (optional security)
   ARCJET_KEY=your_arcjet_key
   ```

4. Start the server:

   ```bash
   npm start
   ```

   Server runs on `http://localhost:9000`

5. Access API documentation:
   - Visit `http://localhost:9000/api-docs` in your browser

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd pms-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file or `.env.local` if needed:

   ```env
   EXPO_PUBLIC_API_URL=http://localhost:9000
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start the development server:

   ```bash
   npm start
   # or
   npx expo start
   ```

5. Run on your platform:
   - **Android**: Press `a` or `npx expo start --android`
   - **iOS**: Press `i` or `npx expo start --ios`
   - **Web**: Press `w` or `npx expo start --web`
   - **Expo Go**: Scan QR code with Expo Go app

## 📡 API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/logout` - Logout user
- `POST /auth/verify-email` - Verify email token

### Breeds

- `GET /breeds` - List all breeds
- `POST /breeds` - Create new breed
- `GET /breeds/:id` - Get breed details
- `PUT /breeds/:id` - Update breed
- `DELETE /breeds/:id` - Delete breed

### Batches

- `GET /batches` - List all batches
- `POST /batches` - Create new batch
- `GET /batches/:id` - Get batch with growth logs
- `PUT /batches/:id` - Update batch
- `DELETE /batches/:id` - Delete batch

### Growth Logs

- `GET /growthLog` - List growth logs (paginated)
- `POST /growthLog` - Add new growth log entry
- `GET /growthLog/batch/:batchId` - Get logs for specific batch
- `PUT /growthLog/:id` - Update growth log
- `DELETE /growthLog/:id` - Delete growth log

### Orders

- `GET /orders` - List all orders
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order status
- `DELETE /orders/:id` - Cancel order

### Tasks

- `GET /tasks` - List all tasks
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Chat

- `GET /chats` - List all chats
- `POST /chats` - Create new chat
- `GET /chats/:id/messages` - Get messages in chat
- `POST /chats/:id/message` - Send message

See `http://localhost:9000/api-docs` for complete API documentation with request/response examples.

## 🔐 Authentication Flow

### Email/Password Authentication

1. User signs up with email and password
2. Password is hashed with bcrypt
3. Verification email is sent
4. User verifies email and account is activated
5. User can login and receives JWT token
6. JWT is included in `Authorization: Bearer <token>` header for protected routes

### Google OAuth

1. User initiates Google login
2. Redirected to Google consent screen
3. Upon approval, redirected to callback URL
4. Backend verifies token and creates/updates user
5. JWT is issued for session management

## 🗄️ Database Models

### User

```javascript
{
  (name,
    email,
    password(hashed),
    isEmailVerified,
    emailVerificationToken,
    googleId(optional),
    createdAt,
    updatedAt);
}
```

### Breed

```javascript
{
  name, description,
  expectedWeightPerWeek,
  expectedDaysToMaturity,
  createdBy (User reference),
  createdAt, updatedAt
}
```

### Batch

```javascript
{
  name, breed (Breed reference),
  startDate, expectedSaleDate,
  initialFlockCount, currentFlockCount,
  createdBy (User reference),
  growthLogs (GrowthLog references),
  createdAt, updatedAt
}
```

### GrowthLog

```javascript
{
  batch (Batch reference),
  date, weight,
  feedConsumption, waterConsumption,
  deaths, illness,
  notes, createdAt, updatedAt
}
```

### Chat & Message

```javascript
Chat: {
  (participants, isGroup, name, createdAt, updatedAt);
}
Message: {
  (chat, sender, content, createdAt);
}
```

## 🔌 Real-time Features

The backend supports Socket.io for real-time communication:

- **Online status updates**: Users see who is online
- **Live chat messages**: Messages appear instantly
- **Live notifications**: Push notifications for important events

Socket helpers and event handlers are in `utils/socketHelpers.js`.

## 📧 Email Notifications

The system sends emails for:

- Email verification after signup
- Password reset requests
- Order status updates
- Task reminders

Email configuration is handled in `helpers/email.js` using Nodemailer.

## 🧪 Development

### Backend Development

```bash
cd pm-backend
npm start  # Runs with nodemon for hot-reload
```

### Frontend Development

```bash
cd pms-frontend
npm start  # Expo dev server with hot-reload
```

### Linting

```bash
cd pms-frontend
npm run lint  # ESLint with Expo config
```

## 📝 Environment Variables

### Backend `.env`

- `PORT` - Server port (default: 9000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRY` - JWT expiration time
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_CALLBACK_URL` - Redirect URI after Google auth
- `EMAIL_*` - Email service credentials (Gmail SMTP)
- `FRONTEND_URL` - Frontend URL for CORS
- `ARCJET_KEY` - Optional rate limiting service

### Frontend `.env` / `.env.local`

- `EXPO_PUBLIC_API_URL` - Backend API base URL
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` - Google client ID for OAuth

## 🚢 Deployment

### Backend Deployment (Node.js)

- Deploy to Heroku, Railway, Render, or any Node.js hosting
- Set environment variables on hosting platform
- MongoDB should use cloud instance (MongoDB Atlas recommended)

### Frontend Deployment (React Native/Expo)

- Build APK/IPA for app stores using EAS
- Deploy web version to Vercel, Netlify, or any static host
- Use `expo build` or EAS Build service

## 🐛 Troubleshooting

### Backend Issues

- **MongoDB connection fails**: Check `MONGODB_URI` and network connectivity
- **Email not sending**: Verify SMTP credentials and Gmail app password
- **Swagger docs not loading**: Ensure all routes have proper JSDoc annotations
- **CORS errors**: Check `FRONTEND_URL` matches your frontend origin

### Frontend Issues

- **Can't connect to backend**: Verify `EXPO_PUBLIC_API_URL` matches running server
- **Google login fails**: Check OAuth credentials and redirect URIs
- **Hot-reload not working**: Clear cache with `npm start -- --clear`
- **Emulator issues**: Check Android/iOS simulator is running before `expo start`

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB/Mongoose Guide](https://mongoosejs.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Passport.js Authentication](http://www.passportjs.org/)
- [Swagger/OpenAPI](https://swagger.io/)

## 👥 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Create a pull request with description

## 📄 License

ISC License - See LICENSE file for details

## 📞 Support

For issues or questions:

- Check the API docs at `/api-docs` (backend running)
- Review error logs in console
- Check environment variables are set correctly
- Verify MongoDB and all services are running

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: Active Development
