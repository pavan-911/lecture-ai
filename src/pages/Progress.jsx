import { useEffect, useState } from 'react'
import { TrendingUp, BookOpen, CreditCard, HelpCircle, Flame } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

function ScoreBar({ value }) {
  const color = value >= 80 ? '#16a34a' : value >= 50 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '5px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color, fontWeight: '500', minWidth: '32px', textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

export default function Progress() {
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
      setLectures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  if (loading) return (
    <div style={{ padding: '2rem', color: '#666', fontSize: '0.9rem' }}>Loading progress...</div>
  )

  // Build stats
  const totalLectures = lectures.length
  const totalFlashcards = lectures.reduce((a, l) => a + (l.flashcards?.length || 0), 0)
  const totalQuizzes = lectures.filter(l => l.quizQuestions?.length > 0).length
  const totalNotes = lectures.reduce((a, l) => a + (l.strictNotes?.length || 0), 0)

  // Group by subject
  const subjectMap = {}
  lectures.forEach(l => {
    if (!subjectMap[l.subject]) subjectMap[l.subject] = []
    subjectMap[l.subject].push(l)
  })

  const stats = [
    { label: 'Lectures captured', value: totalLectures, icon: BookOpen, color: '#7c3aed', bg: '#2d1f4e' },
    { label: 'Flashcards generated', value: totalFlashcards, icon: CreditCard, color: '#0891b2', bg: '#0c2433' },
    { label: 'Quizzes available', value: totalQuizzes, icon: HelpCircle, color: '#d97706', bg: '#2d1f0e' },
    { label: 'Notes generated', value: totalNotes, icon: TrendingUp, color: '#16a34a', bg: '#14532d' },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Progress</h2>
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Your learning overview</p>
      </div>

      {/* Streak banner */}
      <div style={{
        background: '#2d1f0e', border: '1px solid #78350f',
        borderRadius: '12px', padding: '0.9rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem'
      }}>
        <Flame size={22} color="#f97316" />
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fdba74' }}>
            {totalLectures} lecture{totalLectures !== 1 ? 's' : ''} captured total
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '1px' }}>
            Keep going — every lecture gets you closer to exam ready
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem', marginBottom: '1.5rem'
      }}>
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: '12px', padding: '1.1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f0f0f0' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '1px' }}>{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Subject breakdown */}
      {Object.keys(subjectMap).length === 0 ? (
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#555'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
          <div style={{ fontSize: '0.9rem' }}>Capture lectures to see your subject breakdown!</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#888', marginBottom: '0.75rem' }}>
            Subject breakdown
          </div>
          {Object.entries(subjectMap).map(([subject, lects]) => (
            <div key={subject} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{subject}</div>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>{lects.length} lecture{lects.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lects.map((l, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '3px' }}>{l.title}</div>
                    <ScoreBar value={Math.min(100, (l.strictNotes?.length || 0) * 10 + (l.flashcards?.length || 0) * 5)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}