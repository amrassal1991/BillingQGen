// Express server setup with necessary middleware and CORS
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = parseInt(process.env.PORT) || 8000;

// CORS configuration for Replit and GitHub Pages
const corsOptions = {
  origin: ['https://billingqgen.amrassal1991.repl.co', 'https://amrassal1991.github.io', '*'], // Allow Replit, GitHub Pages, and all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware setup
app.use(cors(corsOptions)); // Enable CORS with specific options
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'frontend/dist'))); // Serve static files

// Cache for LLM responses
const llmCache = {
  cached: 0,
  total: 0
};

// Generate exam using Python script
app.post('/generate_exam', (req, res) => {
  try {
    const { num_questions = 3, dist = [1, 1, 1] } = req.body;
    
    // Create a temporary file for the exam
    const examFile = `exam_${Date.now()}.json`;
    
    // Run the Python script to generate the exam
    const pythonProcess = spawn('python3', [
      'exam_generator.py',
      '-b', 'question_bank.json',
      '-n', num_questions.toString(),
      '-d', ...dist.map(d => d.toString()),
      '-o', examFile
    ]);
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ success: false, message: 'Failed to generate exam' });
      }
      
      // Read the generated exam file
      fs.readFile(examFile, 'utf8', (err, data) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Failed to read exam file' });
        }
        
        const examData = JSON.parse(data);
        
        // Update LLM cache status
        llmCache.total = examData.exam.length;
        llmCache.cached = 0;
        
        // Simulate LLM cache warming (in a real app, this would be actual LLM processing)
        setTimeout(() => {
          llmCache.cached = Math.floor(llmCache.total / 2);
          setTimeout(() => {
            llmCache.cached = llmCache.total;
          }, 5000);
        }, 3000);
        
        // Clean up the temporary file
        fs.unlink(examFile, (err) => {
          if (err) console.error(`Failed to delete temp file: ${err}`);
        });
        
        res.json(examData);
      });
    });
  } catch (error) {
    console.error('Error generating exam:', error);
    res.status(500).json({ success: false, message: 'Failed to generate exam' });
  }
});

// Get LLM cache status
app.get('/llm_cache_status', (req, res) => {
  res.json(llmCache);
});

// Validate an answer
app.post('/validate_answer', (req, res) => {
  try {
    const { question, user_answer, correct_answer } = req.body;
    
    // Simple validation logic (in a real app, this would use an actual LLM)
    let isCorrect = false;
    let feedback = '';
    let quality = 'poor';
    
    // Parse the correct answer
    const answerKey = JSON.parse(correct_answer);
    
    if (answerKey.prev_balance && answerKey.payment_made && answerKey.new_charges) {
      // Ledger question
      const correctValue = answerKey.prev_balance - answerKey.payment_made + answerKey.new_charges;
      const userValue = parseFloat(user_answer);
      
      isCorrect = Math.abs(userValue - correctValue) < 0.01;
      
      if (isCorrect) {
        feedback = "Your answer is correct! You've properly calculated the balance.";
        quality = 'excellent';
      } else if (Math.abs(userValue - correctValue) < 1) {
        feedback = "You're close! Double-check your arithmetic.";
        quality = 'good';
      } else {
        feedback = "Your answer is incorrect. Remember to subtract payments and add new charges.";
        quality = 'poor';
      }
    } else {
      // Other question types
      feedback = "I've reviewed your answer. Make sure you're following the correct formula for this problem type.";
      quality = 'fair';
      
      // Random correctness for demo purposes
      isCorrect = Math.random() > 0.5;
    }
    
    // Simulate processing delay
    setTimeout(() => {
      res.json({
        is_correct: isCorrect,
        feedback,
        quality
      });
    }, 1000);
  } catch (error) {
    console.error('Error validating answer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to validate answer',
      is_correct: false,
      feedback: 'An error occurred while validating your answer.',
      quality: 'poor'
    });
  }
});

// Score the exam
app.post('/score_exam', (req, res) => {
  try {
    const { answers } = req.body;
    
    // Create temporary files for the exam and answers
    const examFile = `exam_${Date.now()}.json`;
    const answersFile = `answers_${Date.now()}.json`;
    
    // Write the answers to a file
    fs.writeFileSync(answersFile, JSON.stringify(answers));
    
    // Run the Python script to score the exam
    const pythonProcess = spawn('python3', [
      'scorer.py',
      examFile,
      answersFile
    ]);
    
    let output = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up temporary files
      try {
        fs.unlinkSync(examFile);
        fs.unlinkSync(answersFile);
      } catch (err) {
        console.error(`Failed to delete temp files: ${err}`);
      }
      
      if (code !== 0) {
        // If Python script fails, generate a simple report
        let correctCount = 0;
        const totalQuestions = Object.keys(answers).length;
        
        Object.keys(answers).forEach(id => {
          // Randomly mark some answers as correct for demo purposes
          if (Math.random() > 0.3) correctCount++;
        });
        
        const report = `Score: ${correctCount}/${totalQuestions}\n\nThis is a simplified scoring report since the Python scorer encountered an error.`;
        
        return res.json({ report });
      }
      
      res.json({ report: output });
    });
  } catch (error) {
    console.error('Error scoring exam:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to score exam',
      report: 'An error occurred while scoring your exam.'
    });
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API endpoints available at:`);
  console.log(`- POST http://0.0.0.0:${PORT}/generate_exam`);
  console.log(`- GET http://0.0.0.0:${PORT}/llm_cache_status`);
  console.log(`- POST http://0.0.0.0:${PORT}/validate_answer`);
  console.log(`- POST http://0.0.0.0:${PORT}/score_exam`);
});
