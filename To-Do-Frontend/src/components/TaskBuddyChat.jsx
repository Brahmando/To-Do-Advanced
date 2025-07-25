import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const TaskBuddyChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [quickSuggestions, setQuickSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component opens
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      loadQuickSuggestions();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load quick suggestions
  const loadQuickSuggestions = () => {
    const suggestions = [
      "How many tasks do I have?",
      "Show me my groups",
      "Any notifications?",
      "Productivity insights",
      "Account overview",
      "Help me"
    ];
    setQuickSuggestions(suggestions);
  };

  // Load chat history from API
  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-chatbot/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages || []);
        }
      } else {
        console.error('Failed to load chat history');
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Send message to AI chatbot
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-chatbot/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add AI response to chat
          const aiMessage = {
            role: 'assistant',
            content: data.data.response,
            intent: data.data.intent,
            confidence: data.data.confidence,
            timestamp: data.data.timestamp
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message to AI assistant');
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    // Auto-send the suggestion
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  // Export chat conversation
  const exportChat = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      conversation: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        intent: msg.intent || null
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-buddy-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Chat exported successfully!');
  };

  // Clear chat history
  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-chatbot/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessages([]);
        toast.success('Chat history cleared');
      } else {
        throw new Error('Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear chat history');
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get welcome message
  const getWelcomeMessage = () => ({
    role: 'assistant',
    content: `👋 Hi! I'm your Task Buddy AI Assistant!

I can help you with:
📋 **Tasks** - Status, details, and statistics
👥 **Groups** - Information and activities  
🔔 **Notifications** - Alerts and updates
📈 **Productivity** - Insights and trends
👤 **Account** - Overview and settings

Just ask me anything in natural language! Try "How many tasks do I have?" or "Show me my groups".`,
    timestamp: new Date().toISOString(),
    isWelcome: true
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Task Buddy AI</h3>
              <p className="text-sm text-gray-500">Your personal assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportChat}
              className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Export chat conversation"
              disabled={messages.length === 0}
            >
              Export
            </button>
            <button
              onClick={clearHistory}
              className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Clear chat history"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading chat history...</span>
            </div>
          ) : (
            <>
              {/* Show welcome message if no messages */}
              {messages.length === 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                      <div className="whitespace-pre-line text-sm text-gray-800">
                        {getWelcomeMessage().content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(getWelcomeMessage().timestamp)}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-blue-600'
                        : message.isError
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    <span className="text-white text-xs">
                      {message.role === 'user' ? '👤' : message.isError ? '⚠️' : '🤖'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div
                      className={`rounded-lg p-3 max-w-md ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : message.isError
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-line text-sm">
                        {message.content}
                      </div>
                      {message.intent && message.confidence && (
                        <div className="text-xs opacity-70 mt-1">
                          Intent: {message.intent} ({Math.round(message.confidence * 100)}%)
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          {/* Quick Suggestions */}
          {showSuggestions && (
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-2">
                {messages.length === 0 ? '💡 Quick suggestions:' : '💡 Try asking:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors border border-gray-200 hover:border-blue-300"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                if (e.target.value.trim()) {
                  setShowSuggestions(false);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your tasks, groups, notifications..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              maxLength={1000}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex justify-between">
            <span>Press Enter to send • Shift+Enter for new line</span>
            {messages.length > 0 && (
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBuddyChat;