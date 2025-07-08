
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import CompletedList from './components/CompletedList';
import DeletedList from './components/DeletedList';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import { getTasks, createTask, completeTask, deleteTask, undoTask } from './services/taskService';

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
  const [pendingTask, setPendingTask] = useState(null);

  // Check for saved user on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const guestMode = localStorage.getItem('guestMode');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (guestMode) {
      setIsGuestMode(true);
      loadGuestTasks();
    }
  }, []);

  const loadGuestTasks = () => {
    const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
    setTasks(guestTasks.filter(task => !task.completed && !task.deleted));
    setCompleted(guestTasks.filter(task => task.completed && !task.deleted));
    setDeleted(guestTasks.filter(task => task.deleted).slice(-3)); // Always keep the last 3 deleted
  };

  const saveGuestTasks = (allTasks) => {
    localStorage.setItem('guestTasks', JSON.stringify(allTasks));
  };

  const handleAdd = () => {
    if (!input.trim() || !date) {
      alert('Please enter a task and select a date.');
      return;
    }

    if (!user && !isGuestMode) {
      setPendingTask({ text: input, date });
      setShowLoginModal(true);
      return;
    }

    if (isGuestMode) {
      const newTask = {
        _id: Date.now().toString(),
        text: input,
        date,
        created: new Date().toISOString(),
        completed: false,
        deleted: false
      };

      const guestTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
      const updatedTasks = [...guestTasks, newTask];
      saveGuestTasks(updatedTasks);
      setTasks(prev => [...prev, newTask]);
      setInput('');
      setDate('');
    } else {
      createTask({ text: input, date })
        .then(data => {
          setInput('');
          setDate('');
          fetchTasks();
        })
        .catch(error => {
          console.log('Error creating task:', error);
        });
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

      // After marking the task as deleted, explicitly manage deleted tasks
      const deletedTasks = updatedTasks.filter(task => task.deleted);

      // If there are more than 3 deleted tasks, remove the oldest
      if (deletedTasks.length > 3) {
        const oldestDeletedTask = deletedTasks.sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt))[0];
        // Remove the oldest deleted task from the updated tasks
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
          setDeleted(data.filter(task => task.deleted).slice(-3)); // Last 3 deleted
        })
        .catch(error => {
          console.error('Error fetching tasks:', error);
        });
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestTasks');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 font-display">
      <Navbar 
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowSignupModal(true)}
        onLogout={handleLogout}
      />
      
      <div className="flex flex-col items-center py-10 px-2">
        <div className="w-full max-w-2xl bg-white/80 rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-blue-100">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400 mb-2 text-center drop-shadow-lg">
            Stunning To-Do App
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Organize your day with style ✨
            {isGuestMode && <span className="text-orange-500"> (Guest Mode)</span>}
          </p>

          <TaskInput input={input} setInput={setInput} date={date} setDate={setDate} handleAdd={handleAdd} />
          
          {tasks.length > 0 && (
            <TaskList tasks={tasks} handleComplete={handleComplete} handleDelete={handleDelete} formatDate={formatDate} />
          )}
          
          {completed.length > 0 && (
            <CompletedList completed={completed} handleDelete={handleDelete} handleUndo={handleUndo} formatDate={formatDate} />
          )}
          
          {deleted.length > 0 && (
            <DeletedList deleted={deleted} formatDate={formatDate} />
          )}

          <div className="mt-10 text-center text-gray-400 text-xs">Made by Avengers with ❤</div>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
        onGuestMode={handleGuestMode}
      />

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSignup={handleSignup}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}

export default App;
