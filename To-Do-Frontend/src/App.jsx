import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import CompletedList from './components/CompletedList';
import DeletedList from './components/DeletedList';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import ProfileModal from './components/ProfileModal';
import OTPVerificationModal from './components/OTPVerificationModal';
import { getTasks, createTask, completeTask, deleteTask, undoTask } from './services/taskService';
import { getGroups, createGroup, completeGroup, deleteGroup, editGroupTask } from './services/groupService';
import { getNotifications } from './services/sharedGroupService';
import GroupTaskModal from './components/GroupTaskModal';
import GroupTaskList from './components/GroupTaskList';
import SharedGroupsPage from './components/SharedGroupsPage';
import SharedGroupDetail from './components/SharedGroupDetail';
import HomePage from './components/HomePage';
import NotificationBell from './components/NotificationBell';
import MyTasksPage from './components/MyTasksPage';
import GroupTasksPage from './components/GroupTasksPage';
import FeedbackPage from './components/FeedbackPage';

// Google OAuth Client ID (you'll need to get this from Google Console)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

// Safe localStorage operations
const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      localStorage.removeItem(key); // Remove corrupted data
      return defaultValue;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }
};

function formatDate(date) {
  return new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [deleted, setDeleted] = useState([]);
  const [input, setInput] = useState('');
  const [date, setDate] = useState('');
  const [user, setUser] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpUserData, setOtpUserData] = useState(null);
  const [pendingTask, setPendingTask] = useState(null);
  const [isGroupTaskMode, setIsGroupTaskMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [showGroupTaskModal, setShowGroupTaskModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Check for saved user on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const guestMode = localStorage.getItem('guestMode');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user'); // Remove corrupted data
      }
    } else if (guestMode) {
      setIsGuestMode(true);
      loadGuestTasks();
    }
  }, []);

  // Fetch notifications periodically for logged-in users
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const notifs = await getNotifications();
          setNotifications(notifs);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotifications();
      // Poll for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadGuestTasks = () => {
    const guestTasks = safeLocalStorage.getItem('guestTasks', []);
    setTasks(guestTasks.filter(task => !task.completed && !task.deleted));
    setCompleted(guestTasks.filter(task => task.completed && !task.deleted));
    setDeleted(guestTasks.filter(task => task.deleted).slice(-3));
  };

  const saveGuestTasks = (allTasks) => {
    safeLocalStorage.setItem('guestTasks', allTasks);
  };

  const handleAdd = async () => {
    if (!input.trim() || !date) {
      alert('Please enter a task and select a date.');
      return;
    }

    if (isGroupTaskMode && !groupName.trim()) {
      alert('Please enter a group name.');
      return;
    }

    if (!user && !isGuestMode) {
      setPendingTask({ text: input, date, groupName: isGroupTaskMode ? groupName : null });
      setShowLoginModal(true);
      return;
    }

    if (isGroupTaskMode) {
      try {
        if (isGuestMode) {
          const guestGroups = safeLocalStorage.getItem('guestGroups', []);
          let existingGroup = guestGroups.find(g => g.name === groupName);

          const newTask = {
            _id: Date.now().toString(),
            text: input,
            date,
            created: new Date().toISOString(),
            completed: false,
            deleted: false
          };

          if (existingGroup) {
            existingGroup.tasks.push(newTask);
          } else {
            existingGroup = {
              _id: Date.now().toString(),
              name: groupName,
              tasks: [newTask],
              completed: false,
              created: new Date().toISOString()
            };
            guestGroups.push(existingGroup);
          }

          safeLocalStorage.setItem('guestGroups', guestGroups);
          setGroups(guestGroups);
        } else {
          await createGroup({ name: groupName, taskText: input, taskDate: date });
          fetchGroups();
        }
        setInput('');
        setDate('');
      } catch (error) {
        console.error('Error creating group task:', error);
        alert('Failed to create group task.');
      }
    } else {
      const newTask = {
        _id: Date.now().toString(),
        text: input,
        date,
        created: new Date().toISOString(),
        completed: false,
        deleted: false
      };

      if (isGuestMode) {
        const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
        const updatedTasks = [...guestTasks, newTask];
        saveGuestTasks(updatedTasks);
        setTasks(prev => [...prev, newTask]);
      } else {
        try {
          console.log('Creating task for logged-in user:', { text: input, date });
          console.log('Current user state:', user);
          console.log('Token in localStorage:', localStorage.getItem('token'));
          const result = await createTask({ text: input, date });
          console.log('Task created successfully:', result);
          fetchTasks();
        } catch (error) {
          console.error('Error creating task:', error);
          alert('Failed to create task. Please check your connection and try again.');
        }
      }
      setInput('');
      setDate('');
    }
  };

  const handleComplete = (id) => {
    if (isGuestMode) {
      const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
      const updatedTasks = guestTasks.map(task =>
        task._id === id
          ? { ...task, completed: true, completedAt: new Date().toISOString() }
          : task
      );
      saveGuestTasks(updatedTasks);
      loadGuestTasks();
    } else {
      completeTask(id)
        .then(data => {
          fetchTasks();
        })
        .catch(error => {
          alert('Failed to complete task.');
        });
    }
  };

  const handleDelete = (id, from = 'tasks') => {
    if (isGuestMode) {
      const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
      const updatedTasks = guestTasks.map(task =>
        task._id === id
          ? { ...task, deleted: true, deletedAt: new Date().toISOString() }
          : task
      );

      const deletedTasks = updatedTasks.filter(task => task.deleted);

      if (deletedTasks.length > 3) {
        const oldestDeletedTask = deletedTasks.sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt))[0];
        const updatedYetAgainTasks = updatedTasks.filter(task => task._id !== oldestDeletedTask._id);
        saveGuestTasks(updatedYetAgainTasks);
      } else {
        saveGuestTasks(updatedTasks);
      }

      loadGuestTasks();
    } else {
      deleteTask(id)
        .then(data => {
          fetchTasks();
        })
        .catch(error => {
          console.error('Error deleting task:', error);
          alert('Failed to delete task.');
        });
    }
  };

  const handleUndo = (id) => {
    if (isGuestMode) {
      const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
      const updatedTasks = guestTasks.map(task =>
        task._id === id
          ? { ...task, completed: false, completedAt: null }
          : task
      );
      saveGuestTasks(updatedTasks);
      loadGuestTasks();
    } else {
      undoTask(id)
        .then(data => {
          fetchTasks();
        })
        .catch(error => {
          console.error('Error undoing task:', error);
          alert('Failed to undo task.');
        });
    }
  };

  const fetchTasks = () => {
    if (user) {
      getTasks()
        .then(data => {
          setTasks(data.filter(task => !task.completed && !task.deleted));
          setCompleted(data.filter(task => task.completed && !task.deleted));
          setDeleted(data.filter(task => task.deleted).slice(-3));
        })
        .catch(error => {
          console.error('Error fetching tasks:', error);
        });
    }
  };

  const fetchGroups = () => {
    if (user) {
      getGroups()
        .then(data => {
          setGroups(data);
        })
        .catch(error => {
          console.error('Error fetching groups:', error);
        });
    } else if (isGuestMode) {
      const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
      setGroups(guestGroups);
    }
  };

  const handleCompleteGroup = async (groupId) => {
    try {
      if (isGuestMode) {
        const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
        const updatedGroups = guestGroups.map(group =>
          group._id === groupId ? { ...group, completed: true } : group
        );
        localStorage.setItem('guestGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
      } else {
        await completeGroup(groupId);
        fetchGroups();
      }
    } catch (error) {
      console.error('Error completing group:', error);
      alert('Failed to complete group.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      if (isGuestMode) {
        const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
        const updatedGroups = guestGroups.filter(group => group._id !== groupId);
        localStorage.setItem('guestGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
      } else {
        await deleteGroup(groupId);
        fetchGroups();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group.');
    }
  };

  const handleCompleteGroupTask = async (taskId) => {
    try {
      if (isGuestMode) {
        const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
        const updatedGroups = guestGroups.map(group => ({
          ...group,
          tasks: group.tasks.map(task =>
            task._id === taskId
              ? { ...task, completed: true, completedAt: new Date().toISOString() }
              : task
          )
        }));
        localStorage.setItem('guestGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
      } else {
        await completeTask(taskId);
        fetchGroups();
      }
    } catch (error) {
      console.error('Error completing group task:', error);
      alert('Failed to complete task.');
    }
  };

  const handleDeleteGroupTask = async (taskId) => {
    try {
      if (isGuestMode) {
        const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
        const updatedGroups = guestGroups.map(group => ({
          ...group,
          tasks: group.tasks.map(task =>
            task._id === taskId
              ? { ...task, deleted: true, deletedAt: new Date().toISOString() }
              : task
          )
        }));
        localStorage.setItem('guestGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
      } else {
        await deleteTask(taskId);
        fetchGroups();
      }
    } catch (error) {
      console.error('Error deleting group task:', error);
      alert('Failed to delete task.');
    }
  };

  const handleUndoGroupTask = async (taskId) => {
    try {
      if (isGuestMode) {
        const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
        const updatedGroups = guestGroups.map(group => ({
          ...group,
          tasks: group.tasks.map(task =>
            task._id === taskId
              ? { ...task, completed: false, completedAt: null }
              : task
          )
        }));
        localStorage.setItem('guestGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
      } else {
        await undoTask(taskId);
        fetchGroups();
      }
    } catch (error) {
      console.error('Error undoing group task:', error);
      alert('Failed to undo task.');
    }
  };

  const handleEditGroupTask = async (taskId, newText, newDate) => {
    try {
      if (isGuestMode) {
        const guestGroups = JSON.parse(localStorage.getItem('guestGroups') || '[]');
        const updatedGroups = guestGroups.map(group => ({
          ...group,
          tasks: group.tasks.map(task =>
            task._id === taskId
              ? { ...task, text: newText, date: newDate }
              : task
          )
        }));
        localStorage.setItem('guestGroups', JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
      } else {
        await editGroupTask(taskId, { text: newText, date: newDate });
        fetchGroups();
      }
    } catch (error) {
      console.error('Error editing group task:', error);
      alert('Failed to edit task.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchGroups();
    } else if (isGuestMode) {
      fetchGroups();
    }
  }, [user, isGuestMode]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsGuestMode(false);
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestTasks');

    if (pendingTask) {
      createTask(pendingTask)
        .then(() => {
          setPendingTask(null);
          fetchTasks();
        })
        .catch(error => {
          console.log('Error creating pending task:', error);
        });
    }
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setIsGuestMode(false);
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestTasks');
  };

  const handleShowOTPModal = (otpData) => {
    setOtpUserData(otpData);
    setShowOTPModal(true);
  };

  const handleOTPVerification = (userData) => {
    setUser(userData);
    setIsGuestMode(false);
    setShowOTPModal(false);
    setOtpUserData(null);
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestTasks');

    if (pendingTask) {
      createTask(pendingTask)
        .then(() => {
          setPendingTask(null);
          fetchTasks();
        })
        .catch(error => {
          console.log('Error creating pending task:', error);
        });
    }
  };

  const handleGuestMode = () => {
    setIsGuestMode(true);
    localStorage.setItem('guestMode', 'true');
    setShowLoginModal(false);

    if (pendingTask) {
      const newTask = {
        _id: Date.now().toString(),
        text: pendingTask.text,
        date: pendingTask.date,
        created: new Date().toISOString(),
        completed: false,
        deleted: false
      };

      const guestTasks = [newTask];
      saveGuestTasks(guestTasks);
      setTasks([newTask]);
      setInput('');
      setDate('');
      setPendingTask(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsGuestMode(false);
    setTasks([]);
    setCompleted([]);
    setDeleted([]);
    setGroups([]);
    setIsGroupTaskMode(false);
    setGroupName('');
    setNotifications([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestTasks');
    localStorage.removeItem('guestGroups');

    // Navigate to home page after logout/exit guest mode
    window.location.href = '/';
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 font-display">
          <Navbar
            user={user}
            isGuestMode={isGuestMode}
            onLoginClick={() => setShowLoginModal(true)}
            onSignupClick={() => setShowSignupModal(true)}
            onLogout={handleLogout}
            onGroupTaskClick={() => setShowGroupTaskModal(true)}
            onProfileClick={handleProfileClick}
            notifications={notifications}
            setNotifications={setNotifications}
          />

          <Routes>
            <Route path="/" element={
              <HomePage
                user={user}
                tasks={tasks}
                completed={completed}
                deleted={deleted}
                input={input}
                setInput={setInput}
                date={date}
                setDate={setDate}
                handleAdd={handleAdd}
                handleComplete={handleComplete}
                handleDelete={handleDelete}
                handleUndo={handleUndo}
                isGroupTaskMode={isGroupTaskMode}
                setIsGroupTaskMode={setIsGroupTaskMode}
                groupName={groupName}
                setGroupName={setGroupName}
                groups={groups}
                handleCompleteGroupTask={handleCompleteGroupTask}
                handleDeleteGroupTask={handleDeleteGroupTask}
                handleUndoGroupTask={handleUndoGroupTask}
                handleEditGroupTask={handleEditGroupTask}
                handleCompleteGroup={handleCompleteGroup}
                handleDeleteGroup={handleDeleteGroup}
                formatDate={formatDate}
                isGuestMode={isGuestMode}
              />
            } />
            <Route path="/my-tasks" element={
              <MyTasksPage
                tasks={tasks}
                completed={completed}
                deleted={deleted}
                input={input}
                setInput={setInput}
                date={date}
                setDate={setDate}
                handleAdd={handleAdd}
                handleComplete={handleComplete}
                handleDelete={handleDelete}
                handleUndo={handleUndo}
                formatDate={formatDate}
                isGuestMode={isGuestMode}
              />
            } />
            <Route path="/group-tasks" element={
              <GroupTasksPage
                groups={groups}
                input={input}
                setInput={setInput}
                date={date}
                setDate={setDate}
                handleAdd={handleAdd}
                handleCompleteGroupTask={handleCompleteGroupTask}
                handleDeleteGroupTask={handleDeleteGroupTask}
                handleUndoGroupTask={handleUndoGroupTask}
                handleEditGroupTask={handleEditGroupTask}
                handleCompleteGroup={handleCompleteGroup}
                handleDeleteGroup={handleDeleteGroup}
                formatDate={formatDate}
                isGuestMode={isGuestMode}
                groupName={groupName}
                setGroupName={setGroupName}
              />
            } />
            <Route path="/shared-groups" element={
              user ? <SharedGroupsPage user={user} /> : <Navigate to="/" />
            } />
            <Route path="/shared-group/:id" element={
              user ? <SharedGroupDetail user={user} /> : <Navigate to="/" />
            } />
            <Route path="/feedback" element={
              <FeedbackPage user={user} />
            } />
          </Routes>

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
            onSwitchToSignup={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
            onGuestMode={handleGuestMode}
            onShowOTPModal={handleShowOTPModal}
          />

          <SignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            onSignup={handleSignup}
            onSwitchToLogin={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            onShowOTPModal={handleShowOTPModal}
          />

          <OTPVerificationModal
            isOpen={showOTPModal}
            onClose={() => {
              setShowOTPModal(false);
              setOtpUserData(null);
            }}
            onVerify={handleOTPVerification}
            userEmail={otpUserData?.email}
            userName={otpUserData?.name}
            userId={otpUserData?.userId}
          />

          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            user={user}
            onUpdateProfile={handleUpdateProfile}
          />

          <GroupTaskModal
            isOpen={showGroupTaskModal}
            onClose={() => setShowGroupTaskModal(false)}
            groups={groups}
            formatDate={formatDate}
            onCompleteGroup={handleCompleteGroup}
            onDeleteGroup={handleDeleteGroup}
            handleUndoGroupTask={handleUndoGroupTask}
            handleEditGroupTask={handleEditGroupTask}
            handleCompleteGroupTask={handleCompleteGroupTask}
            handleDeleteGroupTask={handleDeleteGroupTask}
          />
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;