import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GroupChat = ({ groupId, user, groupMembers }) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineMembers, setOnlineMembers] = useState([]);
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
  const typingTimeoutRef = useRef(null);
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
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'] // Allow fallback to polling
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionStatus('connected');
      socket.emit('join-group', groupId);
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
      
      // Scroll to bottom after a short delay
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    socket.on('user-typing', (data) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          const exists = prev.some(u => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, data];
        });
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert('Chat error: ' + error.message);
    });

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave-group', groupId);
        socket.disconnect();
      }
    };
  }, [groupId, user]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Track if user is actively replying to prevent auto-scroll
  const [isActivelyReplying, setIsActivelyReplying] = useState(false);

  // Auto-scroll when messages change (but not when replying)
  useEffect(() => {
    if (isOpen && messages.length > 0 && !replyingTo && !isActivelyReplying) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen, replyingTo, isActivelyReplying, scrollToBottom]);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!groupId || !user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chat/group/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user, scrollToBottom]);

  // Send message via Socket.IO
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim() || !groupId || !user || sending || !socketRef.current) return;

    setSending(true);
    
    const messageText = newMessage.trim();
    const replyToId = replyingTo?._id;
    
    // Clear input immediately for better UX
    setNewMessage('');
    setReplyingTo(null);

    // Send via Socket.IO
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
      fetchMessages();
      setTimeout(() => chatInputRef.current?.focus(), 100);
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
  const MessageComponent = ({ message, isOwn }) => (
    <div 
      ref={el => messageRefs.current[message._id] = el}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group hover:bg-gray-50 px-2 py-1 rounded transition-colors`}
    >
      <div className={`max-w-xs lg:max-w-md relative ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Reply indicator */}
        {message.replyTo && (
          <div 
            className="text-xs text-gray-500 mb-1 pl-3 border-l-2 border-gray-300 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
            onClick={() => scrollToMessage(message.replyTo._id || message.replyTo)}
            title="Click to jump to original message"
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Replying to: {message.replyTo.message?.substring(0, 50)}...</span>
            </div>
          </div>
        )}
        
        <div className={`px-4 py-2 rounded-2xl text-sm relative ${
          isOwn
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
        } ${message.isTemp ? 'opacity-70' : ''}`}>
          {!isOwn && (
            <p className="text-xs font-semibold mb-1 text-gray-600">
              {message.sender?.name || message.senderName || 'Unknown User'}
            </p>
          )}
          
          <p className="break-words leading-relaxed">{message.message}</p>
          
          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp || message.createdAt)}
              {message.isTemp && <span className="ml-1">⏳</span>}
              {message.edited && <span className="ml-1">(edited)</span>}
            </p>
          </div>
        </div>
        
        {/* Message actions */}
        <div className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
          <div className="flex space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
            <button
              onClick={() => {
                // Prevent auto-scroll immediately
                setIsActivelyReplying(true);
                
                // Store current scroll position
                const messagesContainer = messagesContainerRef.current;
                const currentScrollTop = messagesContainer?.scrollTop;
                const currentScrollHeight = messagesContainer?.scrollHeight;
                
                // Set the reply
                setReplyingTo(message);
                
                // Use requestAnimationFrame to ensure DOM has updated
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    if (messagesContainer && currentScrollTop !== undefined) {
                      // Calculate if we need to adjust for height changes
                      const newScrollHeight = messagesContainer.scrollHeight;
                      const heightDifference = newScrollHeight - (currentScrollHeight || 0);
                      
                      // Restore position, accounting for any height changes
                      messagesContainer.scrollTop = currentScrollTop + (heightDifference > 0 ? 0 : heightDifference);
                    }
                    
                    // Reset the flag after everything is settled
                    setTimeout(() => setIsActivelyReplying(false), 300);
                  });
                });
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
              title="Reply"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!groupId || !user) return null;

  return (
    <div className="fixed left-4 bottom-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className={`mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
        }`}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getConnectionStatusColor()}`}></div>
                <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping bg-green-400 opacity-75"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Group Chat</h3>
                <div className="flex items-center space-x-2 text-xs text-white/80">
                  <span>{onlineCount} online</span>
                  <span>•</span>
                  <span>{groupMembers?.length || 0} members</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Minimize button */}
              <button
                onClick={toggleMinimize}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" : "M20 12H4"} />
                </svg>
              </button>
              
              {/* Close button */}
              <button
                onClick={toggleChat}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white"
                style={{ height: '20rem' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">No messages yet</h3>
                      <p className="text-sm text-gray-500">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageComponent
                        key={message._id}
                        message={message}
                        isOwn={message.sender?._id === user.id || message.sender === user.id}
                      />
                    ))}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 rounded-2xl px-4 py-2 rounded-bl-md">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply indicator */}
              {replyingTo && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-sm text-blue-700">
                      Replying to {replyingTo.sender?.name || replyingTo.senderName || 'Unknown User'}: {replyingTo.message.substring(0, 30)}...
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
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
                        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 hover:bg-white transition-colors"
                        rows="1"
                        maxLength={1000}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      
                      {/* Character count */}
                      <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                        {newMessage.length}/1000
                      </div>
                    </div>
                    
                    {/* Emoji picker button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Add emoji"
                    >
                      <span className="text-lg">😊</span>
                    </button>
                    
                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        newMessage.trim() && !sending
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Quick emoji reactions */}
                  {showEmojiPicker && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                            chatInputRef.current?.focus();
                          }}
                          className="text-lg hover:bg-white hover:shadow-sm rounded-lg p-2 transition-all duration-200 transform hover:scale-110"
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
        className={`relative w-14 h-14 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center group ${
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
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {/* Online members indicator */}
        {onlineCount > 0 && !isOpen && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white">
            {onlineCount > 9 ? '9+' : onlineCount}
          </div>
        )}
        
        {/* Animated chat icon */}
        <div className="relative">
          <svg 
            className={`w-7 h-7 text-white transition-all duration-300 ${isOpen ? 'scale-90' : 'group-hover:scale-110'}`}
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
            <div className="absolute inset-0 w-7 h-7 border-2 border-white rounded-full animate-ping opacity-75"></div>
          )}
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>
    </div>
  );
};

export default GroupChat;