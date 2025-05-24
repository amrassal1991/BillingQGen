// Basic Express server setup with necessary middleware and CORS
const express = require('express');
const cors = require('cors'); // You'll need to install this: npm install cors
const bodyParser = require('body-parser');
const path = require('path');
 
const app = express();
const PORT = parseInt(process.env.PORT) || 3000;
 
// Middleware setup
app.use(cors()); // Enable CORS for all routes - important for frontend/backend communication
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files if needed
 
// Sample route to serve exam questions
app.get('/api/questions', (req, res) => {
  try {
    // This is where you would load questions from your question_bank.json
    // For example:
    // const questions = require('./question_bank.json');
    
    // For now, returning a sample response
    const sampleQuestions = [
      { id: 1, text: "Sample question 1", options: ["A", "B", "C", "D"], answer: "A" },
      { id: 2, text: "Sample question 2", options: ["A", "B", "C", "D"], answer: "B" }
    ];
    
    res.json({ success: true, questions: sampleQuestions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ success: false, message: 'Failed to load questions' });
  }
});
 
// Route to start an exam
app.post('/api/start-exam', (req, res) => {
  try {
    // Here you would handle exam initialization logic
    // For example, selecting questions, setting up a timer, etc.
    
    res.json({ 
      success: true, 
      message: 'Exam started successfully',
      examId: 'exam-' + Date.now() // Generate a unique exam ID
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ success: false, message: 'Failed to start exam' });
  }
});
 
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});
 
// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on <http://0.0.0.0>:${PORT}`);
  console.log(`API endpoints available at:`);
  console.log(`- GET <http://0.0.0.0>:${PORT}/api/questions`);
  console.log(`- POST <http://0.0.0.0>:${PORT}/api/start-exam`);
});
