const express = require('express');
const { body, validationResult } = require('express-validator');

// Use dev email service if real email not configured
const emailService = process.env.EMAIL_USER && process.env.EMAIL_PASS 
  ? require('../services/emailService')
  : require('../services/devEmailService');

const router = express.Router();

// Contact form submission
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  body('category').isIn(['general', 'support', 'feature', 'bug', 'business', 'feedback']).withMessage('Invalid category')
], async (req, res) => {
  try {
    // Debug: Log received data
    console.log('📧 Contact form data received:', {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message ? req.body.message.substring(0, 50) + '...' : 'undefined',
      category: req.body.category,
      nameLength: req.body.name ? req.body.name.length : 0,
      subjectLength: req.body.subject ? req.body.subject.length : 0,
      messageLength: req.body.message ? req.body.message.length : 0
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array().map(err => err.msg).join(', '),
        validationErrors: errors.array()
      });
    }

    const { name, email, subject, message, category } = req.body;

    // Prepare contact data for email
    const contactData = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      category,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      contactId: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Send contact email to the team
    try {
      await emailService.sendContactEmail(contactData);
    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send your message. Please try again later or contact us directly via email.' 
      });
    }

    // Send confirmation email to the user
    try {
      await emailService.sendContactConfirmationEmail(contactData);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.json({
      message: 'Your message has been sent successfully! We\'ll get back to you within 24-48 hours.',
      contactId: contactData.contactId,
      timestamp: contactData.timestamp
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again later.' 
    });
  }
});

module.exports = router;