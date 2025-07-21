import React, { useState, useEffect } from 'react';

const FeedbackPage = ({ user }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [showSurvey, setShowSurvey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 10 Important survey questions for the To-Do app
  const surveyQuestions = [
    {
      id: 1,
      question: "Is the app interface easy to navigate and understand?",
      category: "User Experience"
    },
    {
      id: 2,
      question: "Do you find the task creation process intuitive and efficient?",
      category: "Task Management"
    },
    {
      id: 3,
      question: "Are the shared group feature useful for collaboration?",
      category: "Collaboration"
    },
    {
      id: 4,
      question: "Does the app perform well without significant lag or crashes?",
      category: "Performance"
    },
    {
      id: 5,
      question: "Is the login and authentication process smooth and secure?",
      category: "Authentication"
    },
    {
      id: 6,
      question: "Do you find the email notifications helpful and timely?",
      category: "Notifications"
    },
    {
      id: 7,
      question: "Are the app's visual design and colors appealing to you?",
      category: "Design"
    },
    {
      id: 8,
      question: "Would you recommend this app to your friends or colleagues?",
      category: "Overall Satisfaction"
    },
    {
      id: 9,
      question: "Do you feel the app helps improve your productivity?",
      category: "Value Proposition"
    },
    {
      id: 10,
      question: "Are you satisfied with the current feature set of the app?",
      category: "Feature Completeness"
    }
  ];

  useEffect(() => {
    // Initialize survey answers
    const initialAnswers = {};
    surveyQuestions.forEach(q => {
      initialAnswers[q.id] = null;
    });
    setSurveyAnswers(initialAnswers);
  }, []);

  const handleAnswerChange = (questionId, answer) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const canProceedToNext = () => {
    const currentQuestionId = surveyQuestions[currentQuestion].id;
    return surveyAnswers[currentQuestionId] !== null && surveyAnswers[currentQuestionId] !== undefined;
  };

  const handleNext = () => {
    if (currentQuestion < surveyQuestions.length - 1 && canProceedToNext()) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.values(surveyAnswers).filter(answer => answer !== null).length;
    return (answeredQuestions / surveyQuestions.length) * 100;
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      setError('Please provide some feedback before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          rating,
          type: 'general'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Thank you for your feedback! It has been submitted successfully.');
        setFeedback('');
        setRating(5);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSurvey = async () => {
    const unansweredQuestions = Object.values(surveyAnswers).filter(answer => answer === null);
    
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/feedback/submit-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          surveyAnswers,
          questions: surveyQuestions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Thank you for completing our survey! Your responses have been submitted successfully.');
        setShowSurvey(false);
        setCurrentQuestion(0);
        // Reset survey answers
        const resetAnswers = {};
        surveyQuestions.forEach(q => {
          resetAnswers[q.id] = null;
        });
        setSurveyAnswers(resetAnswers);
      } else {
        setError(data.error || 'Failed to submit survey');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAnswerEmoji = (answer) => {
    switch(answer) {
      case 'yes': return '✅';
      case 'neutral': return '😐';
      case 'no': return '❌';
      default: return '';
    }
  };

  const getAnswerColor = (answer, selectedAnswer) => {
    const isSelected = answer === selectedAnswer;
    switch(answer) {
      case 'yes': 
        return isSelected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'neutral': 
        return isSelected ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'no': 
        return isSelected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200';
      default: 
        return 'bg-gray-100 hover:bg-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in to access the feedback page and help us improve the app.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
            <span className="text-3xl text-white">💭</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Feedback Center</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your feedback helps us improve! Share your thoughts and participate in our survey to make the app better for everyone.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Feedback Section */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">General Feedback</h2>
                <p className="text-gray-600 text-sm">Share your overall experience</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                How would you rate your experience? ⭐
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">Rating: {rating}/5</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Your Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                rows="6"
                placeholder="Tell us about your experience, suggestions for improvement, features you'd like to see, or any issues you've encountered..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {feedback.length}/500 characters
              </p>
            </div>

            <button
              onClick={handleSubmitFeedback}
              disabled={loading || !feedback.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : '📤 Submit Feedback'}
            </button>
          </div>

          {/* Survey Section */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">User Survey</h2>
                  <p className="text-gray-600 text-sm">Help us understand your needs</p>
                </div>
              </div>
              {!showSurvey && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">10 Questions</p>
                  <p className="text-xs text-gray-500">~3 minutes</p>
                </div>
              )}
            </div>

            {!showSurvey ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Quick Survey</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Answer 10 quick questions to help us improve your experience.
                    Your responses will be sent directly to our development team.
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-purple-800 text-xs">
                      <span className="font-semibold">📈 Survey Insights:</span> Your answers help us prioritize features and improvements.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSurvey(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  🚀 Start Survey
                </button>
              </div>
            ) : (
              <div>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Question {currentQuestion + 1} of {surveyQuestions.length}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(getProgressPercentage())}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Current Question */}
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6">
                    <p className="text-xs text-purple-600 font-semibold mb-1">
                      {surveyQuestions[currentQuestion].category}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {surveyQuestions[currentQuestion].question}
                    </h3>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {['yes', 'neutral', 'no'].map((answer) => (
                      <button
                        key={answer}
                        onClick={() => handleAnswerChange(surveyQuestions[currentQuestion].id, answer)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                          getAnswerColor(answer, surveyAnswers[surveyQuestions[currentQuestion].id])
                        } border-transparent hover:border-gray-300`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <span className="text-2xl mr-3">{getAnswerEmoji(answer)}</span>
                            <span className="font-medium capitalize">{answer}</span>
                          </span>
                          {surveyAnswers[surveyQuestions[currentQuestion].id] === answer && (
                            <span className="text-xl">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  {currentQuestion === surveyQuestions.length - 1 ? (
                    <button
                      onClick={handleSubmitSurvey}
                      disabled={loading || !canProceedToNext()}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting...' : '✅ Submit Survey'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  )}
                </div>

                {/* Exit Survey */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setShowSurvey(false);
                      setCurrentQuestion(0);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm underline"
                  >
                    Exit Survey
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Thank You! 🙏</h3>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Your feedback is incredibly valuable to us. Every comment and survey response helps us build a better product. 
            We appreciate you taking the time to help us improve!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
