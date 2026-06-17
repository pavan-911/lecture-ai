import { useState, useEffect } from 'react'
import { BookMarked, ChevronDown, ChevronUp, Star, Lightbulb, HelpCircle } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

function ProgressBar({ value, color = '#7c3aed' }) {
  return (
    <div style={{ height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: '3px', background: color,
        width: `${value}%`, transition: 'width 0.4s ease'
      }} />
    </div>
  )
}

function RevisionCard({ subject, lectures }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('notes')

  const allStrictNotes = lectures.flatMap(l => l.strictNotes || [])
  const allConceptNotes = lectures.flatMap(l => l.conceptNotes || [])
  const allFlagged = lectures.flatMap(l => l.flaggedPoints || [])
  const coverage = Math.min(100, lectures.length * 20)
  const coverageColor = coverage >= 80 ? '#16a34a' : coverage >= 40 ? '#d97706' : '#dc2626'

  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem'
    }}>
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: '#2d1f4e', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookMarked size={15} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{subject}</div>
              <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '2px' }}>
                {lectures.length} lecture{lectures.length !== 1 ? 's' : ''} captured
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} style={{
            background: 'none', border: 'none', color: '#666', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
          }}>
            {expanded ? <><ChevronUp size={15} /> Less</> : <><ChevronDown size={15} /> Revise</>}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: '#666' }}>Coverage</span>
          <span style={{ fontSize: '0.72rem', color: coverageColor, fontWeight: '500' }}>{coverage}%</span>
        </div>
        <ProgressBar value={coverage} color={coverageColor} />

        {allFlagged.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>★ {allFlagged.length} flagged points</span>
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', padding: '0 1rem', borderBottom: '1px solid #2a2a2a' }}>
            {[
              { key: 'notes', label: '📌 Key Notes' },
              { key: 'concepts', label: '💡 Concepts' },
              { key: 'flagged', label: '★ Flagged' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '0.6rem 0.9rem', fontSize: '0.78rem', background: 'none', border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #a78bfa' : '2px solid transparent',
                color: activeTab === tab.key ? '#a78bfa' : '#666',
                cursor: 'pointer', fontWeight: activeTab === tab.key ? '500' : '400',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1rem' }}>
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allStrictNotes.length === 0 ? (
                  <div style={{ color: '#555', fontSize: '0.85rem' }}>No strict notes yet.</div>
                ) : allStrictNotes.map((note, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '8px', alignItems: 'flex-start',
                    fontSize: '0.83rem', color: '#ccc', lineHeight: '1.6',
                    padding: '0.5rem 0.75rem', background: '#1e1b4b',
                    borderLeft: '3px solid #4338ca', borderRadius: '0 6px 6px 0'
                  }}>
                    <Star size={12} color="#a78bfa" style={{ flexShrink: 0, marginTop: '3px' }} />
                    {note.text}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'concepts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allConceptNotes.length === 0 ? (
                  <div style={{ color: '#555', fontSize: '0.85rem' }}>No concept notes yet.</div>
                ) : allConceptNotes.map((c, i) => (
                  <div key={i} style={{
                    background: '#111', border: '1px solid #2a2a2a',
                    borderRadius: '8px', padding: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a78bfa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lightbulb size={12} /> {c.heading}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: '1.6' }}>{c.body}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'flagged' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allFlagged.length === 0 ? (
                  <div style={{ color: '#555', fontSize: '0.85rem' }}>No flagged points yet.</div>
                ) : allFlagged.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '8px', fontSize: '0.83rem', color: '#fbbf24',
                    padding: '0.5rem 0.75rem', background: '#2d1f0e',
                    border: '1px solid #78350f', borderRadius: '6px'
                  }}>
                    ★ {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Revision() {
  const { user } = useAuth()
  const [subjectMap, setSubjectMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'lectures'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const map = {}
      snap.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() }
        if (!map[data.subject]) map[data.subject] = []
        map[data.subject].push(data)
      })
      setSubjectMap(map)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  if (loading) return (
    <div style={{ padding: '2rem', color: '#666', fontSize: '0.9rem' }}>Loading revision data...</div>
  )

  const subjects = Object.keys(subjectMap)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Revision</h2>
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
          Review your notes before exams
        </p>
      </div>

      {subjects.length === 0 ? (
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#555'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📖</div>
          <div style={{ fontSize: '0.9rem' }}>No revision data yet — capture some lectures first!</div>
        </div>
      ) : (
        subjects.map(subject => (
          <RevisionCard key={subject} subject={subject} lectures={subjectMap[subject]} />
        ))
      )}
    </div>
  )
}