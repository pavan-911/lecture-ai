import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Monitor, MonitorOff, Circle, Square } from 'lucide-react'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const EXAM_KEYWORDS = [
  'remember', 'important', 'exam', 'write this',
  'note this', 'formula', 'definition', 'mark this'
]

function checkForFlag(text) {
  return EXAM_KEYWORDS.some(kw => text.toLowerCase().includes(kw))
}

export default function Live() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isRecording, setIsRecording] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [screenActive, setScreenActive] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [flagged, setFlagged] = useState([])
  const [timer, setTimer] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [subject, setSubject] = useState('Biology')
  const [title, setTitle] = useState('New Lecture')
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [status, setStatus] = useState('')

  const timerRef = useRef(null)
  const audioStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef([])
  const flaggedRef = useRef([])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    flaggedRef.current = flagged
  }, [flagged])

  function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition. Please use Google Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const last = event.results.length - 1
      const line = event.results[last][0].transcript.trim()
      if (!line) return

      setTranscript(prev => [...prev, line])
      if (checkForFlag(line)) {
        setFlagged(prev => [...prev, line])
      }
    }

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error)
    }

    recognition.onend = () => {
      // Auto restart if still recording
      if (recognitionRef.current) {
        recognition.start()
      }
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  async function startCapture() {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = audioStream
      setAudioActive(true)

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = screenStream
      setScreenActive(true)

      setIsRecording(true)
      setSaved(false)
      setTranscript([])
      setFlagged([])

      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)

      startSpeechRecognition()

    } catch (err) {
      alert('Please allow microphone and screen access.')
      console.error(err)
    }
  }

  async function stopCapture() {
    // Stop streams
    if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop())
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    clearInterval(timerRef.current)
    setIsRecording(false)
    setAudioActive(false)
    setScreenActive(false)

    const currentTranscript = transcriptRef.current
    const currentFlagged = flaggedRef.current

    if (currentTranscript.length === 0) {
      alert('No transcript captured. Make sure you spoke during the session.')
      return
    }

    // Generate notes with Gemini
    setGeneratingNotes(true)
    setStatus('Generating AI notes...')

    let notes = { strictNotes: [], conceptNotes: [] }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentTranscript.join(' '),
          subject,
          title
        })
      })
      notes = await res.json()
      setStatus('Generating quiz...')
    } catch (err) {
      console.error('Notes generation failed:', err)
      setStatus('Note generation failed, saving transcript only...')
    }

    // Generate quiz
    let quizQuestions = []
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, subject, title })
      })
      const data = await res.json()
      quizQuestions = data.questions || []
      setStatus('Generating flashcards...')
    } catch (err) {
      console.error('Quiz generation failed:', err)
    }

    // Generate flashcards
    let flashcards = []
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, subject })
      })
      const data = await res.json()
      flashcards = data.flashcards || []
      setStatus('Saving to database...')
    } catch (err) {
      console.error('Flashcard generation failed:', err)
    }

    // Save everything to Firestore
    setSaving(true)
    try {
      await addDoc(collection(db, 'lectures'), {
        userId: user.uid,
        subject,
        title,
        transcript: currentTranscript,
        flaggedPoints: currentFlagged,
        strictNotes: notes.strictNotes || [],
        conceptNotes: notes.conceptNotes || [],
        quizQuestions,
        flashcards,
        duration: `${Math.floor(timer / 60)} min`,
        status: 'completed',
        createdAt: serverTimestamp(),
      })
      setSaved(true)
      setStatus('')
    } catch (err) {
      console.error('Firestore save error:', err)
      setStatus('Save failed.')
    }

    setGeneratingNotes(false)
    setSaving(false)
  }

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Subject + Title inputs */}
      {!isRecording && !saved && !generatingNotes && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', color: '#666' }}>Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px',
                padding: '0.45rem 0.75rem', color: '#f0f0f0', fontSize: '0.85rem',
                outline: 'none', width: '160px'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', color: '#666' }}>Lecture title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Photosynthesis"
              style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px',
                padding: '0.45rem 0.75rem', color: '#f0f0f0', fontSize: '0.85rem',
                outline: 'none', width: '220px'
              }}
            />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Live Capture</h2>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
            {isRecording ? `${subject} — ${title}` : 'Set subject and title before starting'}
          </p>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isRecording && (
            <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: '500' }}>
              ● {formatTime(timer)}
            </span>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{
              fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
              background: audioActive ? '#14532d' : '#1a1a1a',
              color: audioActive ? '#86efac' : '#555',
              border: '1px solid ' + (audioActive ? '#166534' : '#333'),
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              {audioActive ? <Mic size={11} /> : <MicOff size={11} />} Audio
            </span>
            <span style={{
              fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
              background: screenActive ? '#1e1b4b' : '#1a1a1a',
              color: screenActive ? '#c4b5fd' : '#555',
              border: '1px solid ' + (screenActive ? '#3730a3' : '#333'),
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              {screenActive ? <Monitor size={11} /> : <MonitorOff size={11} />} Screen
            </span>
          </div>

          {!generatingNotes && (
            <button
              onClick={isRecording ? stopCapture : startCapture}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
                background: saving ? '#2a2a2a' : isRecording ? '#7f1d1d' : '#6d28d9',
                color: saving ? '#555' : '#fff',
                fontSize: '0.85rem', fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {isRecording ? <><Square size={14} /> Stop</> : <><Circle size={14} /> Start Capture</>}
            </button>
          )}
        </div>
      </div>

      {/* Generating notes status */}
      {generatingNotes && (
        <div style={{
          background: '#1e1b4b', border: '1px solid #4338ca',
          borderRadius: '10px', padding: '0.75rem 1rem',
          fontSize: '0.85rem', color: '#c4b5fd',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            border: '2px solid #a78bfa', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          {status}
        </div>
      )}

      {/* Saved banner */}
      {saved && (
        <div style={{
          background: '#14532d', border: '1px solid #16a34a',
          borderRadius: '10px', padding: '0.75rem 1rem',
          fontSize: '0.85rem', color: '#86efac',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>✅ Lecture saved with AI notes, quiz and flashcards!</span>
          <button
            onClick={() => navigate('/notes')}
            style={{
              background: '#16a34a', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '0.3rem 0.75rem',
              fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500'
            }}
          >
            View Notes →
          </button>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Main panels */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{
          flex: 1, background: '#1a1a1a', borderRadius: '12px',
          border: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a2a', fontSize: '0.8rem', color: '#888' }}>
            Live transcript
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {transcript.length === 0 ? (
              <div style={{ color: '#444', fontSize: '0.85rem', marginTop: '1rem' }}>
                {isRecording ? '🎙️ Listening — speak clearly...' : 'Start capture to see transcript here.'}
              </div>
            ) : (
              transcript.map((line, i) => (
                <div key={i} style={{
                  fontSize: '0.85rem', lineHeight: '1.6', color: '#ccc',
                  padding: '0.4rem 0.6rem', borderRadius: '6px',
                  background: checkForFlag(line) ? '#2d1f4e' : 'transparent',
                  borderLeft: checkForFlag(line) ? '2px solid #a78bfa' : '2px solid transparent',
                }}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          width: '220px', background: '#1a1a1a', borderRadius: '12px',
          border: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', flexShrink: 0
        }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a2a', fontSize: '0.8rem', color: '#888' }}>
            ★ Auto-flagged
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {flagged.length === 0 ? (
              <div style={{ color: '#444', fontSize: '0.8rem' }}>Exam points will appear here.</div>
            ) : (
              flagged.map((line, i) => (
                <div key={i} style={{
                  fontSize: '0.75rem', lineHeight: '1.5',
                  background: '#2d1f0e', border: '1px solid #78350f',
                  borderRadius: '6px', padding: '0.5rem 0.6rem', color: '#fbbf24'
                }}>
                  ★ {line.length > 80 ? line.slice(0, 80) + '...' : line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}