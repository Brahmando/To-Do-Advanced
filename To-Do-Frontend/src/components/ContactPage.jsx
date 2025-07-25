import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: '💬' },
    { value: 'support', label: 'Technical Support', icon: '🔧' },
    { value: 'feature', label: 'Feature Request', icon: '💡' },
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'business', label: 'Business Inquiry', icon: '💼' },
    { value: 'feedback', label: 'Feedback', icon: '📝' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Thank you for contacting us! We\'ll get back to you within 24-48 hours.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          category: 'general'
        });
      } else {
        // Show detailed validation errors if available
        if (data.details) {
          setError(data.details);
        } else if (data.validationErrors && data.validationErrors.length > 0) {
          const errorMessages = data.validationErrors.map(err => err.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(data.error || 'Failed to send message. Please try again.');
        }
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: '🔧',
      title: 'Technical Support',
      description: 'Get help with technical issues',
      contact: 'Use the form',
      note: 'Response within 24 hours'
    },
    {
      icon: '💬',
      title: 'General Inquiries',
      description: 'Questions about our app',
      contact: 'Use the form',
      note: 'We\'d love to hear from you'
    },
    {
      icon: '🐛',
      title: 'Bug Reports',
      description: 'Found an issue? Let us know',
      contact: 'Use the form',
      note: 'Help us improve the app',
      clickable: true
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. We\'ll send you a reset link via email.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use industry-standard encryption and security measures to protect your data. Your tasks and personal information are stored securely.'
    },
    {
      question: 'Can I use the app offline?',
      answer: 'Currently, the app requires an internet connection. However, we\'re working on offline functionality for future releases.'
    },
    {
      question: 'How do shared groups work?',
      answer: 'Shared groups allow you to collaborate with team members. You can invite others via email and work together on tasks in real-time.'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'We currently offer a responsive web app that works great on mobile devices. A dedicated mobile app is in our roadmap.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
            <span className="text-4xl">🛠️</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Support
          </h1>
          <p className="text-xl sm:text-2xl text-white opacity-90 max-w-3xl mx-auto">
            Have questions, suggestions, or need help? We're here to assist you!
          </p>
        </div>
      </div>

      <div className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div id="contact-form" className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Send us a Message</h2>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Name * <span className="text-gray-500 font-normal">(2-100 characters)</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Your full name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.name.length}/100 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Subject * <span className="text-gray-500 font-normal">(5-200 characters)</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Brief description of your inquiry"
                    required
                    minLength={5}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.subject.length}/200 characters
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Message * <span className="text-gray-500 font-normal">(10-1000 characters)</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                    placeholder="Please provide as much detail as possible..."
                    required
                    minLength={10}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/1000 characters
                    {formData.message.length < 10 && formData.message.length > 0 && (
                      <span className="text-red-500 ml-2">• Minimum 10 characters required</span>
                    )}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    '📤 Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information & FAQ */}
            <div className="space-y-8">
              {/* Contact Info Cards */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h3>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start space-x-4 ${info.clickable ? 'cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors' : ''}`}
                      onClick={info.clickable ? () => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' }) : undefined}
                    >
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{info.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">{info.title}</h4>
                        <p className="text-gray-600 text-sm mb-1">{info.description}</p>
                        <p className={`font-medium ${info.clickable ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-600'}`}>
                          {info.contact}
                        </p>
                        <p className="text-gray-500 text-xs">{info.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Links</h3>
                <div className="space-y-4">
                  <Link
                    to="/feedback"
                    className="flex items-center space-x-3 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span className="text-xl">📝</span>
                    <span className="font-medium">Submit Feedback</span>
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center space-x-3 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span className="text-xl">ℹ️</span>
                    <span className="font-medium">About Us</span>
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center space-x-3 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span className="text-xl">🏠</span>
                    <span className="font-medium">Back to App</span>
                  </Link>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">⏰</span>
                  <h3 className="text-xl font-bold">Response Time</h3>
                </div>
                <p className="text-green-100 mb-2">
                  We typically respond to inquiries within <strong>24-48 hours</strong>.
                </p>
                <p className="text-green-100 text-sm">
                  For urgent technical issues, please include "URGENT" in your subject line.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Find quick answers to common questions about our To-Do app
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">
                    ❓ {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">
                Don't see your question here?
              </p>
              <button
                onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ask Us Directly
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;