# CivicConnect Backend API

A comprehensive backend API for the CivicConnect civic issue reporting platform built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **Report Management**: CRUD operations for civic issue reports with image uploads
- **Voting System**: Citizens can vote on reports to prioritize issues
- **Admin Dashboard**: Comprehensive admin panel with analytics and management tools
- **Messaging System**: Communication between citizens and administrators
- **Contact Form**: Public contact form with admin response system
- **File Upload**: Image upload for reports with validation
- **Analytics**: Detailed analytics and reporting for administrators
- **Rate Limiting**: Protection against abuse and spam
- **Email Notifications**: Automated email notifications for various events

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `PUT /reset-password` - Reset password
- `POST /logout` - Logout user
- `DELETE /account` - Delete user account

### Reports (`/api/reports`)
- `GET /` - Get all reports (public)
- `GET /:id` - Get single report (public)
- `POST /` - Create new report (authenticated)
- `PUT /:id` - Update report (owner/admin)
- `DELETE /:id` - Delete report (owner/admin)
- `POST /:id/vote` - Vote on report (authenticated)
- `POST /:id/comments` - Add comment to report (authenticated)
- `GET /user/my-reports` - Get user's reports (authenticated)

### Admin (`/api/admin`)
- `GET /dashboard` - Get dashboard statistics
- `GET /reports` - Get all reports with admin filters
- `PUT /reports/:id/status` - Update report status
- `PUT /reports/:id/assign` - Assign report to admin
- `GET /users` - Get all users
- `PUT /users/:id/status` - Update user status
- `GET /analytics` - Get analytics data
- `POST /analytics/generate` - Generate analytics
- `GET /messages` - Get all messages
- `GET /contacts` - Get all contacts
- `POST /contacts/:id/respond` - Respond to contact

### Messages (`/api/messages`)
- `GET /` - Get user's messages
- `GET /:id` - Get single message
- `POST /` - Send message
- `POST /:id/reply` - Reply to message
- `PUT /:id/read` - Mark message as read
- `PUT /:id/archive` - Archive message
- `DELETE /:id` - Delete message
- `GET /conversation/:userId` - Get conversation
- `GET /unread-count` - Get unread count
- `POST /admin` - Send message to admin

### Contact (`/api/contact`)
- `POST /` - Submit contact form (public)
- `GET /stats` - Get contact statistics (admin)
- `GET /admin` - Get all contacts (admin)
- `GET /:id` - Get single contact (admin)
- `PUT /:id/status` - Update contact status (admin)
- `PUT /:id/assign` - Assign contact (admin)
- `POST /:id/respond` - Respond to contact (admin)
- `POST /:id/notes` - Add note to contact (admin)
- `DELETE /:id` - Delete contact (admin)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp config.env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/civicconnect
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Database Models

### User
- Basic user information with authentication
- Role-based access (citizen/admin)
- Report and vote tracking

### Report
- Civic issue reports with location data
- Image attachments and voting system
- Status tracking and assignment

### Message
- Communication between users
- Support for replies and threading
- Admin notifications

### Contact
- Public contact form submissions
- Admin response system
- Status tracking

### Analytics
- System performance metrics
- User engagement statistics
- Report resolution analytics

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Password Hashing**: bcrypt for secure password storage
- **File Upload Security**: File type and size validation

## File Upload

The API supports image uploads for reports with the following features:
- Multiple image support (up to 5 images per report)
- File type validation (JPEG, PNG, GIF)
- Size limits (5MB per image)
- Secure file storage
- Automatic file cleanup

## Email Notifications

Automated email notifications for:
- User registration welcome
- Password reset requests
- Report status updates
- Contact form confirmations
- Admin notifications

## Rate Limiting

Different rate limits for different endpoints:
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Report submission: 10 reports per hour
- Voting: 50 votes per hour
- Contact form: 3 submissions per hour

## Error Handling

Comprehensive error handling with:
- Custom error classes
- Detailed error messages
- Proper HTTP status codes
- Development vs production error details

## API Documentation

The API includes built-in documentation available at:
- Health check: `GET /health`
- API info: `GET /api`

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Code Structure
```
backend/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── utils/          # Utility functions
├── uploads/        # File upload directory
└── server.js       # Main server file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
