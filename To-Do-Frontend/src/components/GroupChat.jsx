import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GroupChat = ({ groupId, user, groupMembers: _groupMembers }) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [_onlineMembers, setOnlineMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const socketRef = useRef(null);
  const messageRefs = useRef({});
  const messagesContainerRef = useRef(null);

  // Common emojis for quick reactions
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'];

  // Connect to Socket.IO server
  useEffect(() => {
    if (!user || !groupId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      setConnectionStatus('error');
      return;
    }

    console.log('Connecting to Socket.IO with token:', token.substring(0, 20) + '...');

    // Initialize socket connection
    const socket = io('https://to-do-advanced-production.up.railway.app', {
      auth: { token },
      transports: ['websocket', 'polling'] // Allow fallback to polling
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionStatus('connected');
      socket.emit('join-group', groupId);
      
      // Fetch messages once connected and joined
      setTimeout(() => {
        if (isOpen) fetchMessages();
      }, 500);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnectionStatus('error');
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (socket.disconnected) {
          console.log('Attempting to reconnect...');
          socket.connect();
        }
      }, 3000);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    socket.on('online-users', (data) => {
      if (data.groupId === groupId) {
        setOnlineCount(data.onlineCount);
        setOnlineMembers(data.onlineUsers);
      }
    });

    socket.on('new-message', (message) => {
      console.log('Received new message:', message);
      
      setMessages(prev => {
        // Remove any temporary messages with the same content
        const filteredPrev = prev.filter(m => !m.isTemp || m.message !== message.message);
        
        // Check if message already exists (to avoid duplicates)
        const exists = filteredPrev.some(m => m._id === message._id);
        if (exists) return filteredPrev;
        
        // Add new message
        const newMessages = [...filteredPrev, message];
        
        // Update unread count if chat is not open
        const senderId = message.sender?._id || message.sender;
        if (!isOpen && senderId !== user.id) {
          setUnreadCount(count => count + 1);
        }
        
        return newMessages;
      });
    });

    socket.on('user-typing', (data) => {
      if (data.groupId === groupId && data.userId !== user.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });

        // Clear typing indicator after 3 seconds with cleanup
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
        }, 3000);

        // Store timeout for cleanup
        return () => clearTimeout(timeout);
      }
    });

    // Handle socket errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionStatus('error');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [groupId, user, isOpen]);

  // Fetch messages from server
  const fetchMessages = useCallback(async () => {
    if (!groupId || !user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://to-do-advanced-production.up.railway.app/api/chat/group/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched messages:', data);
        setMessages(data.messages || []);
      } else {
        console.error('Failed to fetch messages:', response.status);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !socketRef.current) return;

    const messageText = newMessage.trim();
    const replyToId = replyingTo?._id || null;
    
    // Clear input and reply state
    setNewMessage('');
    setReplyingTo(null);
    setSending(true);
    setShowEmojiPicker(false);

    // Add temporary message to UI for immediate feedback
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      message: messageText,
      sender: { _id: user.id, name: user.name },
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      replyTo: replyingTo,
      isTemp: true
    };

    setMessages(prev => [...prev, tempMessage]);

    // Send via socket
    socketRef.current.emit('send-message', {
      groupId,
      message: messageText,
      replyTo: replyToId
    });

    setSending(false);
  }, [newMessage, groupId, user, sending, replyingTo]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', groupId);
  }, [groupId]);

  // Format timestamp
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return 'now';
    
    try {
      // Handle both MongoDB createdAt and custom timestamp fields
      const timeValue = timestamp.createdAt || timestamp.timestamp || timestamp;
      const date = new Date(timeValue);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'now';
      }
      
      const now = new Date();
      const diffInMinutes = (now - date) / (1000 * 60);
      const diffInHours = diffInMinutes / 60;
      const diffInDays = diffInHours / 24;

      if (diffInMinutes < 1) return 'now';
      if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
      if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
      if (diffInDays < 7) return `${Math.floor(diffInDays)}d`;
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      console.warn('Error formatting timestamp:', timestamp, error);
      return 'now';
    }
  }, []);

  // Toggle chat
  const toggleChat = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
      setShowEmojiPicker(false);
    } else {
      setIsOpen(true);
      setUnreadCount(0);
      // Always fetch messages when opening chat
      setTimeout(() => {
        fetchMessages();
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, fetchMessages]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [isMinimized]);

  // Get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Scroll to specific message
  const scrollToMessage = useCallback((messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Highlight the message briefly
      messageElement.style.backgroundColor = '#fef3c7';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  }, []);

  // Message component
  const MessageComponent = ({ message, isOwn, showAvatar }) => (
    <div 
      ref={el => messageRefs.current[message._id] = el}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group hover:bg-gray-50 px-2 py-1 rounded transition-colors`}
    >
      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md relative ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Reply indicator */}
        {message.replyTo && (
          <div 
            className="text-xs text-gray-500 mb-1 pl-2 sm:pl-3 border-l-2 border-gray-300 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
            onClick={() => scrollToMessage(message.replyTo._id || message.replyTo)}
            title="Click to jump to original message"
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="truncate">Replying to: {message.replyTo.message?.substring(0, 30)}...</span>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
              : 'bg-white text-gray-800 border border-gray-200'
          } ${message.isTemp ? 'opacity-70' : ''}`}
        >
          {/* Sender name for non-own messages */}
          {!isOwn && showAvatar && (
            <div className="text-xs font-medium text-blue-600 mb-1">
              {message.sender?.name || 'Unknown User'}
            </div>
          )}

          {/* Message content */}
          <div className="break-words text-sm sm:text-base whitespace-pre-wrap">
            {message.message}
          </div>

          {/* Message timestamp */}
          <div className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          } flex items-center justify-between`}>
            <span>{formatTime(message)}</span>
            {message.isTemp && (
              <svg className="w-3 h-3 animate-spin ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>

          {/* Message tail */}
          <div className={`absolute top-2 ${
            isOwn 
              ? 'right-0 transform translate-x-1 border-l-8 border-l-blue-500 border-t-8 border-t-transparent border-b-8 border-b-transparent' 
              : 'left-0 transform -translate-x-1 border-r-8 border-r-white border-t-8 border-t-transparent border-b-8 border-b-transparent'
          } w-0 h-0`}></div>
        </div>

        {/* Reply button */}
        <div className={`mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          <button
            onClick={() => setReplyingTo(message)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            title="Reply to this message"
          >
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className={`mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform ${
          isMinimized ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
        } ${
          // Responsive sizing
          'w-80 sm:w-96 md:w-[400px] lg:w-[450px] max-w-[calc(100vw-2rem)]'
        } ${
          // Mobile-specific adjustments
          'max-h-[calc(100vh-8rem)] sm:max-h-[600px]'
        }`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-2xl">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Connection status indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} pulse-animation`}></div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg">Group Chat</h3>
              </div>
              
              {/* Online count */}
              {onlineCount > 0 && (
                <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs font-medium">{onlineCount} online</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Minimize button */}
              <button
                onClick={toggleMinimize}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={isMinimized ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
                </svg>
              </button>
              
              {/* Close button */}
              <button
                onClick={toggleChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div 
                ref={messagesContainerRef}
                className="h-64 sm:h-80 md:h-96 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
              >
                {loading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-500 text-sm">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                        <svg className="w-6 sm:w-8 h-6 sm:h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                      <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwn = message.sender && (message.sender._id === user.id || message.sender === user.id);
                      const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender?._id !== message.sender?._id);
                      
                      return (
                        <MessageComponent 
                          key={message._id || `temp-${index}`} 
                          message={message} 
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                        />
                      );
                    })}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center space-x-2 text-gray-500 text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs">
                          {typingUsers.length === 1 
                            ? `${typingUsers[0]} is typing...`
                            : `${typingUsers.length} people are typing...`
                          }
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Reply indicator */}
              {replyingTo && (
                <div className="px-3 sm:px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-blue-700 min-w-0">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="font-medium flex-shrink-0">Replying to:</span>
                    <span className="truncate">{replyingTo.message}</span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <form onSubmit={sendMessage} className="space-y-3">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={chatInputRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
                        placeholder="Type a message... (Enter to send)"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 hover:bg-white transition-colors"
                        rows="1"
                        maxLength={1000}
                        style={{ minHeight: '40px', maxHeight: '100px' }}
                      />
                      
                      {/* Character count */}
                      <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                        {newMessage.length}/1000
                      </div>
                    </div>
                    
                    {/* Emoji picker button - hidden on very small screens */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="hidden sm:block p-2 sm:p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                      title="Add emoji"
                    >
                      <span className="text-lg">😊</span>
                    </button>
                    
                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={`p-2 sm:p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
                        newMessage.trim() && !sending
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      {sending ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Quick emoji reactions */}
                  {showEmojiPicker && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                            chatInputRef.current?.focus();
                          }}
                          className="text-base sm:text-lg hover:bg-white hover:shadow-sm rounded-lg p-1 sm:p-2 transition-all duration-200 transform hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center group ${
          isOpen 
            ? 'bg-gradient-to-r from-gray-600 to-gray-700 opacity-80 scale-95 rotate-3' 
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90 hover:opacity-100 hover:scale-110 hover:rotate-6 hover:shadow-3xl'
        }`}
        style={{
          background: !isOpen ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
          boxShadow: !isOpen ? '0 20px 40px rgba(102, 126, 234, 0.4)' : undefined
        }}
      >
        {/* Unread messages badge */}
        {unreadCount > 0 && !isOpen && (
          <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold animate-pulse border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {/* Online members indicator */}
        {onlineCount > 0 && !isOpen && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold border-2 border-white">
            {onlineCount > 9 ? '9+' : onlineCount}
          </div>
        )}
        
        {/* Animated chat icon */}
        <div className="relative">
          <svg 
            className={`w-6 h-6 sm:w-7 sm:h-7 text-white transition-all duration-300 ${isOpen ? 'scale-90' : 'group-hover:scale-110'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          
          {/* Pulse animation for new messages */}
          {unreadCount > 0 && !isOpen && (
            <div className="absolute inset-0 w-6 h-6 sm:w-7 sm:h-7 border-2 border-white rounded-full animate-ping opacity-75"></div>
          )}
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>
    </div>
  );
};

export default GroupChat;
        
       