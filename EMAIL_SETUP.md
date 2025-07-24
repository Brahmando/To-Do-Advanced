# 🚀 To-Do App (Beta) - Setup Instructions

## Email Configuration for OTP Verification

To enable email OTP verification, you need to configure your email settings in the `.env` file.

### Gmail Setup (Recommended)

1. Open `To-Do-Backend/.env` file
2. Update the following email configuration:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-gmail-address@gmail.com
```

### How to get Gmail App Password:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password in `EMAIL_PASS`

### Alternative Email Providers:

You can also use other email services:

**Outlook/Hotmail:**
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

**Custom SMTP:**
```env
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Running the Application

### Backend:
```bash
cd To-Do-Backend
npm install
npm start
```

### Frontend:
```bash
cd To-Do-Frontend
npm install
npm run dev
```

## Features

✅ **Email OTP Verification** - Users must verify their email before account activation  
✅ **Beta Status Indicators** - App clearly shows it's in beta testing  
✅ **Welcome Emails** - New users receive welcome emails after verification  
✅ **Resend OTP** - Users can request new OTP codes if needed  
✅ **Guest Mode** - Users can still use the app without registration  

## Beta Testing

This application is currently in **Beta** phase. Please report any bugs or issues you encounter!

### Known Limitations:
- Email verification is required for all new accounts
- OTP codes expire after 10 minutes
- Some features may be unstable during beta testing

## Support

If you encounter any issues during setup or testing, please create an issue in the repository.

---

**🧪 Happy Beta Testing!** 🚀
