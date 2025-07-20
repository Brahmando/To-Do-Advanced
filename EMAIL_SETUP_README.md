# 📋 To-Do App (Beta) - OTP Email Verification Setup

## 🚀 Overview
This To-Do App now includes email OTP verification for user registration. Users must verify their email address before they can sign up and use the application.

## ✉️ Email Configuration Setup

### Step 1: Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the generated password (16 characters)

### Step 2: Update Environment Variables
Edit the `.env` file in the `To-Do-Backend` folder:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-actual-email@gmail.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
```

### Step 3: Alternative Email Providers
If you prefer other email providers, update the `.env` file accordingly:

#### Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=your-email@outlook.com
```

#### Yahoo
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@yahoo.com
```

## 🔧 Installation & Setup

### Backend Setup
```bash
cd To-Do-Backend
npm install
# Make sure your .env file is configured with email settings
npm start
```

### Frontend Setup
```bash
cd To-Do-Frontend
npm install
npm run dev
```

## 🎯 How OTP Verification Works

1. **User Registration**: User enters name, email, and password
2. **OTP Generation**: System generates 6-digit OTP and sends to user's email
3. **Email Verification**: User receives beautifully formatted email with OTP
4. **OTP Input**: User enters OTP in verification modal
5. **Account Activation**: Upon successful verification, account is activated
6. **Welcome Email**: User receives welcome email confirming activation

## 📧 Email Templates
The system sends two types of emails:
- **🔐 OTP Verification Email**: Contains 6-digit verification code
- **🎉 Welcome Email**: Sent after successful verification

## ⚠️ Beta Features & Notes

### 🚧 Current Beta Status
- ✅ Email OTP verification implemented
- ✅ Beta branding and notices added
- ✅ User-friendly error handling
- ✅ Resend OTP functionality
- ✅ OTP expiration (10 minutes)

### 🐛 Known Beta Limitations
- Email delivery may take 1-2 minutes depending on provider
- OTP codes expire after 10 minutes
- Only Gmail, Outlook, and Yahoo tested extensively

### 🔄 Testing the OTP System
1. Use a real email address you have access to
2. Check spam/junk folder if email doesn't arrive
3. OTP codes are 6 digits long
4. Codes expire after 10 minutes

## 🛠️ Troubleshooting

### Email Not Sending
1. **Check .env configuration**: Ensure all email variables are set correctly
2. **Verify app password**: Make sure you're using an app password, not your regular password
3. **Check console logs**: Backend will log email sending success/failure
4. **Test email provider**: Try sending a test email outside the app

### OTP Not Working
1. **Check expiration**: OTP expires after 10 minutes
2. **Case sensitivity**: OTP is numeric only
3. **Resend OTP**: Use the resend functionality if needed
4. **Clear browser cache**: Sometimes helps with modal issues

### Common Errors
- **"Invalid credentials"**: Check email/password in .env
- **"Failed to send email"**: Usually email configuration issue
- **"OTP expired"**: Request a new OTP
- **"Invalid OTP"**: Double-check the 6-digit code

## 🎨 Beta UI Features
- 🏷️ Beta badges in navigation
- 📢 Beta announcement banner
- ⚠️ Beta warnings in forms
- 🎯 Enhanced email templates with beta branding

## 📞 Support & Feedback
Since this is a beta version, please report any issues or suggestions:
- Test different email providers
- Report any bugs in the OTP flow
- Suggest UI/UX improvements
- Test edge cases (expired OTPs, invalid emails, etc.)

## 🔮 Upcoming Features
- [ ] SMS OTP as alternative
- [ ] Social login integration
- [ ] Enhanced email templates
- [ ] Admin dashboard for user management
- [ ] Email template customization

---

**Happy Testing! 🚀**
*Remember: This is a beta version - your feedback helps us improve!*
