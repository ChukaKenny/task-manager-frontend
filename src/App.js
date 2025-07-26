
import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, LogOut, User, Lock } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";


const TaskManager = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });


  // Fetch tasks from backend after login
  const fetchTasks = async (token) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks);
      } else {
        setTasks([]);
        setNotification({ message: data.message || 'Failed to fetch tasks', type: 'error' });
      }
    } catch (err) {
      setTasks([]);
      setNotification({ message: 'Network error while fetching tasks', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.data.user.username);
        localStorage.setItem('token', data.data.token);
        setLoginForm({ username: '', password: '' });
        fetchTasks(data.data.token);
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (err) {
      setLoginError('Network error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setTasks([]);
    setEditingTask(null);
    setShowAddForm(false);
    setFormData({ title: '', description: '', priority: 'medium' });
    localStorage.removeItem('token');
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks(token);
        setFormData({ title: '', description: '', priority: 'medium' });
        setShowAddForm(false);
        setNotification({ message: 'Task added successfully!', type: 'success' });
      } else {
        setNotification({ message: data.message || 'Failed to add task', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Network error while adding task', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/items/${editingTask}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks(token);
        setEditingTask(null);
        setFormData({ title: '', description: '', priority: 'medium' });
        setNotification({ message: 'Task updated successfully!', type: 'success' });
      } else {
        setNotification({ message: data.message || 'Failed to update task', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Network error while updating task', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/items/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks(token);
        setNotification({ message: 'Task deleted successfully!', type: 'success' });
      } else {
        setNotification({ message: data.message || 'Failed to delete task', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Network error while deleting task', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (taskId) => {
    const token = localStorage.getItem('token');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/items/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          completed: !task.completed
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks(token);
        setNotification({ message: 'Task status updated!', type: 'success' });
      } else {
        setNotification({ message: data.message || 'Failed to update task', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Network error while updating task', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Manager</h1>
            <p className="text-gray-600">Please login to continue</p>
          </div>

          {notification.message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {notification.message}
            </div>
          )}

          <div className="space-y-6">
            {loginError && (
              <div data-testid="login-error" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Username
              </label>
              <input
                type="text"
                data-testid="username-input"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Password
              </label>
              <input
                type="password"
                data-testid="password-input"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  data-testid="login-button"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>admin / password123</div>
              <div>testuser / test123</div>
              <div>demo / demo</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Application
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Task Manager</h1>
          <div className="flex items-center space-x-4">
            <span data-testid="current-user" className="text-gray-600">Welcome, {currentUser}</span>
            <button
              onClick={handleLogout}
              data-testid="logout-button"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Notification */}
        {notification.message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {notification.message}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-600">Loading...</span>
          </div>
        )}

        {/* Add Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            data-testid="add-task-button"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Task</span>
          </button>
        </div>

        {/* Add/Edit Task Form */}
        {(showAddForm || editingTask) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6" data-testid="task-form">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  data-testid="task-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  data-testid="task-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  data-testid="task-priority-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (editingTask) {
                      handleUpdateTask(e);
                    } else {
                      handleAddTask(e);
                    }
                  }}
                  data-testid="save-task-button"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                  disabled={loading}
                >
                  {editingTask ? (loading ? 'Updating...' : 'Update Task') : (loading ? 'Adding...' : 'Add Task')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTask(null);
                    setFormData({ title: '', description: '', priority: 'medium' });
                  }}
                  data-testid="cancel-button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Tasks ({tasks.length})</h2>
          
          {tasks.length === 0 && !loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No tasks yet. Add your first task!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  data-testid={`task-item-${task.id}`}
                  className={`bg-white rounded-lg shadow-md p-4 ${task.completed ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskComplete(task.id)}
                          data-testid={`task-checkbox-${task.id}`}
                          className="w-4 h-4 text-blue-600"
                          disabled={loading}
                        />
                        <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>\
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>\
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'} ml-7`}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditTask(task)}
                        data-testid={`edit-task-${task.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                        title="Edit task"
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        data-testid={`delete-task-${task.id}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                        title="Delete task"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;