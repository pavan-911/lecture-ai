import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

function QuizSession({ lecture, onFinish }) {
  const questions = lecture.quizQuestions || []
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [confirmed, setConfirmed] = useState(false)

  const q = questions[current]
  const isLast = current === questions.length - 1

  function confirm() {
    if (selected === null) return
    setConfirmed(true)
    setAnswers(a => [...a, { selected, correct: q.answer }])
  }

  function next() {
    if (isLast) {
      onFinish([...answers, { selected, correct: q.answer }])
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    }
  }

  function getOptionStyle(i) {
    const base = {
      padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem',
      cursor: confirmed ? 'default' : 'pointer', border: '1px solid',
      marginBottom: '0.6rem', transition: 'all 0.15s',
    }
    if (!confirmed) {
      return {
        ...base,
        background: selected === i ? '#2d1f4e' : '#1a1a1a',
        borderColor: selected === i ? '#7c3aed' : '#2a2a2a',
        color: selected === i ? '#c4b5fd' : '#ccc',
      }
    }
    if (i === q.answer) return { ...base, background: '#14532d', borderColor: '#16a34a', color: '#86efac' }
    if (i === selected && selected !== q.answer) return { ...base, background: '#7f1d1d', borderColor: '#b91c1c', color: '#fca5a5' }
    return { ...base, background: '#1a1a1a', borderColor: '#2a2a2a', color: '#555' }
  }

  if (!q) return <div style={{ padding: '2rem', color: '#666' }}>No questions available.</div>

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>Q {current + 1} of {questions.length}</span>
        <span style={{
          fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
          background: '#2d1f4e', color: '#a78bfa', border: '1px solid #4c1d95'
        }}>
          {lecture.subject} — {lecture.title}
        </span>
      </div>

      <div style={{ height: '4px', background: '#2a2a2a', borderRadius: '2px', marginBottom: '1.5rem' }}>
        <div style={{
          height: '100%', background: '#7c3aed', borderRadius: '2px',
          width: `${((current + 1) / questions.length) * 100}%`, transition: 'width 0.3s'
        }} />
      </div>

      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem',
        fontSize: '1rem', fontWeight: '500', lineHeight: '1.6'
      }}>
        {q.q}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {q.options.map((opt, i) => (
          <div key={i} style={getOptionStyle(i)} onClick={() => !confirmed && setSelected(i)}>
            <span style={{ marginRight: '10px', opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>
            {opt}
            {confirmed && i === q.answer && <CheckCircle size={14} style={{ float: 'right', marginTop: '2px', color: '#4ade80' }} />}
            {confirmed && i === selected && selected !== q.answer && <XCircle size={14} style={{ float: 'right', marginTop: '2px', color: '#f87171' }} />}
          </div>
        ))}
      </div>

      {!confirmed ? (
        <button onClick={confirm} disabled={selected === null} style={{
          width: '100%', padding: '0.7rem', borderRadius: '10px',
          background: selected !== null ? '#6d28d9' : '#2a2a2a',
          color: selected !== null ? '#fff' : '#555',
          border: 'none', fontSize: '0.9rem', fontWeight: '500',
          cursor: selected !== null ? 'pointer' : 'not-allowed',
        }}>
          Confirm Answer
        </button>
      ) : (
        <button onClick={next} style={{
          width: '100%', padding: '0.7rem', borderRadius: '10px',
          background: '#6d28d9', color: '#fff', border: 'none',
          fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer',
        }}>
          {isLast ? 'See Results' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}

function Results({ lecture, answers, onRestart, onBack }) {
  const score = answers.filter(a => a.selected === a.correct).length
  const total = answers.length
  const pct = Math.round((score / total) * 100)

  return (
    <div style={{ maxWidth: '640px', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' }}>
          {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep studying!'}
        </h3>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>{lecture.subject} — {lecture.title}</p>
      </div>

      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '3.5rem', fontWeight: '700', color: pct >= 80 ? '#86efac' : pct >= 50 ? '#fbbf24' : '#fca5a5' }}>
          {pct}%
        </div>
        <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          {score} correct out of {total}
        </div>
      </div>

      <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        {(lecture.quizQuestions || []).map((q, i) => {
          const correct = answers[i]?.selected === answers[i]?.correct
          return (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '0.6rem 0', borderBottom: '1px solid #1f1f1f',
              fontSize: '0.82rem', color: '#aaa'
            }}>
              {correct
                ? <CheckCircle size={15} color="#4ade80" style={{ flexShrink: 0, marginTop: '2px' }} />
                : <XCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
              }
              <span>{q.q}</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '0.7rem', borderRadius: '10px',
          background: 'none', color: '#888', border: '1px solid #2a2a2a',
          fontSize: '0.9rem', cursor: 'pointer'
        }}>
          ← All Quizzes
        </button>
        <button onClick={onRestart} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '0.7rem', borderRadius: '10px',
          background: '#6d28d9', color: '#fff', border: 'none',
          fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500'
        }}>
          <RotateCcw size={14} /> Retry
        </button>
      </div>
    </div>
  )
}

export default function Quiz() {
  const { user } = useAuth()
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'lectures'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.quizQuestions && l.quizQuestions.length > 0)
      setLectures(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  if (loading) return (
    <div style={{ padding: '2rem', color: '#666', fontSize: '0.9rem' }}>Loading quizzes...</div>
  )

  if (active && !finished) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <button onClick={() => setActive(null)} style={{
          background: 'none', border: 'none', color: '#666',
          fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          ← Back
        </button>
        <QuizSession lecture={active} onFinish={a => { setAnswers(a); setFinished(true) }} />
      </div>
    )
  }

  if (finished) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Results
          lecture={active}
          answers={answers}
          onRestart={() => { setFinished(false); setAnswers([]) }}
          onBack={() => { setActive(null); setFinished(false); setAnswers([]) }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Quiz</h2>
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Test your knowledge from your lectures</p>
      </div>

      {lectures.length === 0 ? (
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#555'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>❓</div>
          <div style={{ fontSize: '0.9rem' }}>No quizzes yet — capture a lecture first!</div>
        </div>
      ) : (
        lectures.map(lecture => (
          <div key={lecture.id} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
            padding: '1.25rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '4px' }}>
                {lecture.subject} — {lecture.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#666' }}>
                {lecture.quizQuestions.length} questions
              </div>
            </div>
            <button onClick={() => { setActive(lecture); setFinished(false); setAnswers([]) }} style={{
              padding: '0.5rem 1.25rem', background: '#6d28d9', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '0.85rem',
              fontWeight: '500', cursor: 'pointer'
            }}>
              Start →
            </button>
          </div>
        ))
      )}
    </div>
  )
}