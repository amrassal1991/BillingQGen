import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(null);
  const [timer, setTimer] = useState(60); // 60 seconds per question
  const [showHint, setShowHint] = useState(false);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Timer logic
  useEffect(() => {
    if (exam && current < exam.exam.length && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer, exam, current]);

  // Fetch exam on mount
  useEffect(() => {
    fetch(`${API_URL}/generate_exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_questions: 3, dist: [1, 1, 1] })
    })
      .then(res => res.json())
      .then(setExam);
  }, []);

  // Check LLM cache status on mount
  const [cacheStatus, setCacheStatus] = useState(null);
  useEffect(() => {
    fetch(`${API_URL}/llm_cache_status`).then(res => res.json()).then(setCacheStatus);
    const interval = setInterval(() => {
      fetch(`${API_URL}/llm_cache_status`).then(res => res.json()).then(setCacheStatus);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!exam) return <div>Loading exam...</div>;
  if (loading) return <div style={{textAlign:'center',marginTop:40}}><b>Processing...</b><br/><span>LLM validation or scoring may take up to 30 seconds. Please wait...</span></div>;
  if (cacheStatus && cacheStatus.cached < exam.exam.length) {
    return <div style={{textAlign:'center',marginTop:40}}>
      <b>Preparing exam engine...</b><br/>
      <span>Warming up LLM cache: {cacheStatus.cached} of {exam.exam.length} questions ready.</span><br/>
      <span>This will make your experience much faster. Please wait...</span>
    </div>;
  }
  const q = exam.exam[current];

  const handleAnswer = async () => {
    setLoading(true);
    // Save answer
    const newAnswers = { ...answers, [q.id]: answers[q.id] || '' };
    setAnswers(newAnswers);
    // Validate answer
    const res = await fetch(`${API_URL}/validate_answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q.text,
        user_answer: answers[q.id] || '',
        correct_answer: JSON.stringify(q.answer_key)
      })
    });
    setValidation(await res.json());
    setLoading(false);
  };

  const handleNext = () => {
    setShowHint(false);
    setValidation(null);
    setTimer(60);
    setCurrent(current + 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    // Score all answers
    const res = await fetch(`${API_URL}/score_exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    const data = await res.json();
    setScore(data.report);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1>Telecom Billing Exam</h1>
      <div style={{ marginBottom: 16 }}>
        <b>Question {current + 1} of {exam.exam.length}</b>
        <div style={{ float: 'right' }}>⏰ {timer}s</div>
      </div>
      <div style={{ margin: '16px 0', fontSize: 18 }}>{q.text}</div>
      <input
        type="text"
        value={answers[q.id] || ''}
        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
        disabled={!!validation || loading || timer === 0}
        style={{ width: '100%', fontSize: 16, padding: 8 }}
        placeholder="Your answer"
      />
      <div style={{ margin: '12px 0' }}>
        <button onClick={() => setShowHint(true)} disabled={showHint || !!validation || loading}>Show Hint</button>
        <button onClick={handleAnswer} disabled={!!validation || loading || timer === 0} style={{ marginLeft: 8 }}>Submit</button>
      </div>
      {showHint && <div style={{ background: '#f8f8e0', padding: 8, margin: '8px 0' }}><b>Hint:</b> {q.explanation}</div>}
      {validation && (
        <div style={{ background: '#e0f8e0', padding: 8, margin: '8px 0' }}>
          <b>LLM Feedback:</b> <br />
          <span>{validation.feedback}</span><br />
          <span><b>Quality:</b> {validation.quality}</span><br />
          <span><b>Correct:</b> {String(validation.is_correct)}</span>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {current < exam.exam.length - 1 && (
          <button onClick={handleNext} disabled={!validation && timer > 0}>Next</button>
        )}
        {current === exam.exam.length - 1 && (
          <button onClick={handleFinish} disabled={!validation && timer > 0}>Finish Exam</button>
        )}
      </div>
      {score && (
        <pre style={{ background: '#f0f0f0', padding: 12, marginTop: 24 }}>{score}</pre>
      )}
    </div>
  );
}

export default App;
