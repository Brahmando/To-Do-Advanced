const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Use dev email service if real email not configured
const emailService = process.env.EMAIL_USER && process.env.EMAIL_PASS 
  ? require('../services/emailService')
  : require('../services/devEmailService');

const router = express.Router();

// Submit general feedback
router.post('/submit', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { feedback, rating, type = 'general' } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get user details
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare feedback email content
    const feedbackData = {
      userName: user.name,
      userEmail: user.email,
      rating,
      feedback: feedback.trim(),
      type,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      userId: user._id
    };

    // Send feedback email to development team
    try {
      await emailService.sendFeedbackEmail(feedbackData);
    } catch (emailError) {
      console.error('Failed to send feedback email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: 'Feedback submitted successfully',
      feedbackId: `feedback_${Date.now()}_${user._id}`,
      timestamp: feedbackData.timestamp
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Submit survey responses
router.post('/submit-survey', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { surveyAnswers, questions } = req.body;

    if (!surveyAnswers || typeof surveyAnswers !== 'object') {
      return res.status(400).json({ error: 'Survey answers are required' });
    }

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Survey questions are required' });
    }

    // Validate that all questions are answered
    const questionIds = questions.map(q => q.id);
    const answeredIds = Object.keys(surveyAnswers).map(id => parseInt(id));
    
    const missingAnswers = questionIds.filter(id => !answeredIds.includes(id) || surveyAnswers[id] === null);
    if (missingAnswers.length > 0) {
      return res.status(400).json({ 
        error: `Missing answers for questions: ${missingAnswers.join(', ')}` 
      });
    }

    // Get user details
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare survey data for email
    const surveyData = {
      userName: user.name,
      userEmail: user.email,
      userId: user._id,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      responses: questions.map(question => ({
        id: question.id,
        category: question.category,
        question: question.question,
        answer: surveyAnswers[question.id]
      }))
    };

    // Calculate survey statistics
    const yesCount = Object.values(surveyAnswers).filter(answer => answer === 'yes').length;
    const neutralCount = Object.values(surveyAnswers).filter(answer => answer === 'neutral').length;
    const noCount = Object.values(surveyAnswers).filter(answer => answer === 'no').length;
    
    surveyData.statistics = {
      totalQuestions: questions.length,
      yesAnswers: yesCount,
      neutralAnswers: neutralCount,
      noAnswers: noCount,
      positivePercentage: Math.round((yesCount / questions.length) * 100),
      neutralPercentage: Math.round((neutralCount / questions.length) * 100),
      negativePercentage: Math.round((noCount / questions.length) * 100)
    };

    // Send survey email to development team
    try {
      await emailService.sendSurveyEmail(surveyData);
    } catch (emailError) {
      console.error('Failed to send survey email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: 'Survey submitted successfully',
      surveyId: `survey_${Date.now()}_${user._id}`,
      timestamp: surveyData.timestamp,
      statistics: surveyData.statistics
    });

  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
});

module.exports = router;
