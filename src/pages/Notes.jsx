import { useState, useEffect } from 'react'
import { BookOpen, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

const typeColors = {
  definition: { bg: '#1e1b4b', border: '#4338ca', label: 'Definition', color: '#a5b4fc' },
  formula:    { bg: '#14532d', border: '#16a34a', label: 'Formula',    color: '#86efac' },
  flagged:    { bg: '#2d1f0e', border: '#b45309', label: '★ Flagged',  color: '#fbbf24' },
}

function ConceptNote({ note }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #2a2a2a' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '0.65rem 0', background: 'none',
          border: 'none', color: '#ccc', fontSize: '0.85rem', cursor: 'pointer',
          fontWeight: '500',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={14} color="#a78bfa" />
          {note.heading}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{ fontSize: '0.82rem', color: '#888', lineHeight: '1.7', paddingBottom: '0.65rem', paddingLeft: '22px' }}>
          {note.body}
        </div>
      )}
    </div>
  )
}

function LectureCard({ lecture }) {
  const [tab, setTab] = useState('strict')

  const strictNotes = lecture.strictNotes || []
  const conceptNotes = lecture.conceptNotes || []
  const date = lecture.createdAt?.toDate?.()
  const dateStr = date ? date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : 'Just now'

  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: '#2d1f4e', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BookOpen size={16} color="#a78bfa" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            {lecture.subject} — {lecture.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
            {dateStr} · {lecture.duration || '< 1 min'}
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
          background: '#2d1f4e', color: '#a78bfa', border: '1px solid #4c1d95'
        }}>
          {strictNotes.length} notes
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', padding: '0 1rem' }}>
        {['strict', 'concept', 'transcript'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.6rem 1rem', fontSize: '0.8rem', background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid #a78bfa' : '2px solid transparent',
            color: tab === t ? '#a78bfa' : '#666', cursor: 'pointer',
            fontWeight: tab === t ? '500' : '400',
          }}>
            {t === 'strict' ? '📌 Strict Notes' : t === 'concept' ? '💡 Concept Notes' : '📝 Transcript'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tab === 'strict' && (
          strictNotes.length === 0 ? (
            <div style={{ color: '#555', fontSize: '0.85rem' }}>No strict notes generated.</div>
          ) : (
            strictNotes.map((note, i) => {
              const style = typeColors[note.type] || typeColors.definition
              return (
                <div key={i} style={{
                  fontSize: '0.82rem', lineHeight: '1.6',
                  background: style.bg, border: `1px solid ${style.border}`,
                  borderRadius: '6px', padding: '0.5rem 0.75rem',
                  borderLeft: `3px solid ${style.border}`,
                }}>
                  <span style={{ fontSize: '0.7rem', color: style.color, fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                    {style.label}
                  </span>
                  <span style={{ color: '#ddd' }}>{note.text}</span>
                </div>
              )
            })
          )
        )}

        {tab === 'concept' && (
          conceptNotes.length === 0 ? (
            <div style={{ color: '#555', fontSize: '0.85rem' }}>No concept notes generated.</div>
          ) : (
            conceptNotes.map((note, i) => (
              <ConceptNote key={i} note={note} />
            ))
          )
        )}

        {tab === 'transcript' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {(lecture.transcript || []).length === 0 ? (
              <div style={{ color: '#555', fontSize: '0.85rem' }}>No transcript available.</div>
            ) : (
              (lecture.transcript || []).map((line, i) => (
                <div key={i} style={{
                  fontSize: '0.82rem', color: '#888', lineHeight: '1.6',
                  padding: '0.35rem 0', borderBottom: '1px solid #1f1f1f'
                }}>
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Notes() {
  const { user } = useAuth()
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'lectures'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setLectures(data)
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  if (loading) return (
    <div style={{ padding: '2rem', color: '#666', fontSize: '0.9rem' }}>Loading notes...</div>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>My Notes</h2>
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
          {lectures.length} lecture{lectures.length !== 1 ? 's' : ''} captured
        </p>
      </div>

      {lectures.length === 0 ? (
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#555'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
          <div style={{ fontSize: '0.9rem' }}>No lectures yet — go to Live and capture your first class!</div>
        </div>
      ) : (
        lectures.map(lecture => (
          <LectureCard key={lecture.id} lecture={lecture} />
        ))
      )}
    </div>
  )
}