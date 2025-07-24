// Debug script to test task creation
console.log('=== Task Creation Debug ===');

// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user') || 'null');
const token = localStorage.getItem('token');
const guestMode = localStorage.getItem('guestMode');

console.log('User:', user);
console.log('Token exists:', !!token);
console.log('Guest mode:', guestMode);

// Test API endpoint
async function testTaskCreation() {
  const testTask = {
    text: 'Test task from debug script',
    date: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(testTask)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Task created successfully:', result);
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Run the test
testTaskCreation();