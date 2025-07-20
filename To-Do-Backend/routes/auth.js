
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Use dev email service if real email not configured
const emailService = process.env.EMAIL_USER && process.env.EMAIL_PASS 
  ? require('../services/emailService')
  : require('../services/devEmailService');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register - Step 1: Send OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = emailService.generateOTP();
    const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    // Create or update user with OTP (not verified yet)
    let user;
    if (existingUser && !existingUser.isEmailVerified) {
      // Update existing unverified user
      user = await User.findByIdAndUpdate(existingUser._id, {
        name,
        password: hashedPassword,
        emailVerificationOTP: otp,
        otpExpiry: otpExpiry
      }, { new: true });
    } else {
      // Create new user
      user = new User({
        name,
        email,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationOTP: otp,
        otpExpiry: otpExpiry
      });
      await user.save();
    }

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, name);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(201).json({
      message: 'Registration initiated. Please check your email for the verification code.',
      userId: user._id,
      email: user.email,
      otpSent: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Sign-In endpoint
router.post('/google-signin', async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Google emails are pre-verified
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        isEmailVerified: true, // Google emails are pre-verified
        picture
      });
      await user.save();

      // Send welcome email for new Google users
      try {
        await emailService.sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
        // Don't fail the signup if email fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(400).json({ error: 'Invalid Google token' });
  }
});

// Verify OTP - Step 2: Complete registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check OTP validity
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Verify user
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.otpExpiry = null;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully! Welcome to To-Do App Beta!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = emailService.generateOTP();
    const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    // Update user with new OTP
    user.emailVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(user.email, otp, user.name);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({
      message: 'Verification code resent successfully. Please check your email.',
      otpSent: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is registered via Google (no password)
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        error: 'This account was created with Google. Please use Google Sign-In instead.' 
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        error: 'Email not verified. Please verify your email first.',
        emailNotVerified: true,
        userId: user._id
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update Profile
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, currentPassword, newPassword } = req.body;

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update password if provided and user is not a Google user
    if (newPassword && !user.googleId) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash and save new password
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Save updated user
    await user.save();

    // Return user without password
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
