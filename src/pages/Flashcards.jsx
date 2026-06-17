import { useState, useEffect } from 'react'
import { RotateCcw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

export default function Flashcards() {
  const { user } = useAuth()
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDeck, setActiveDeck] = useState(null)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState({})
  const [finished, setFinished] = useState(false)

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
        .filter(l => l.flashcards && l.flashcards.length > 0)
      setLectures(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  function startDeck(lecture) {
    setActiveDeck(lecture)
    setCurrent(0)
    setFlipped(false)
    setResults({})
    setFinished(false)
  }

  function flip() { setFlipped(f => !f) }

  function answer(result) {
    const cards = activeDeck.flashcards
    setResults(r => ({ ...r, [current]: result }))
    setFlipped(false)
    if (current + 1 >= cards.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
    }
  }

  function restart() {
    setCurrent(0)
    setFlipped(false)
    setResults({})
    setFinished(false)
  }

  if (loading) return (
    <div style={{ padding: '2rem', color: '#666', fontSize: '0.9rem' }}>Loading flashcards...</div>
  )

  // Deck selection screen
  if (!activeDeck) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: '700px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Flashcards</h2>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Pick a lecture to study</p>
        </div>

        {lectures.length === 0 ? (
          <div style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#555'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🃏</div>
            <div style={{ fontSize: '0.9rem' }}>No flashcards yet — capture a lecture first!</div>
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
                  {lecture.flashcards.length} cards
                </div>
              </div>
              <button onClick={() => startDeck(lecture)} style={{
                padding: '0.5rem 1.25rem', background: '#6d28d9', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}>
                Study →
              </button>
            </div>
          ))
        )}
      </div>
    )
  }

  const cards = activeDeck.flashcards
  const card = cards[current]
  const got   = Object.values(results).filter(r => r === 'got').length
  const again = Object.values(results).filter(r => r === 'again').length

  if (finished) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginTop: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Session Complete!</h2>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '2rem' }}>
            {activeDeck.subject} — {activeDeck.title}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ background: '#14532d', border: '1px solid #16a34a', borderRadius: '12px', padding: '1.25rem 2rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#86efac' }}>{got}</div>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '4px' }}>Got it</div>
            </div>
            <div style={{ background: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: '12px', padding: '1.25rem 2rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fca5a5' }}>{again}</div>
              <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '4px' }}>Study again</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => setActiveDeck(null)} style={{
              padding: '0.6rem 1.25rem', background: 'none', color: '#888',
              border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer'
            }}>
              ← All Decks
            </button>
            <button onClick={restart} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0.6rem 1.5rem', background: '#6d28d9', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500'
            }}>
              <RotateCcw size={15} /> Restart
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '640px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Flashcards</h2>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
            {activeDeck.subject} — {activeDeck.title}
          </p>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>{current + 1} / {cards.length}</div>
      </div>

      <div style={{ height: '4px', background: '#2a2a2a', borderRadius: '2px', marginBottom: '1.5rem' }}>
        <div style={{
          height: '100%', borderRadius: '2px', background: '#7c3aed',
          width: `${((current + 1) / cards.length) * 100}%`, transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
          background: '#2d1f4e', color: '#a78bfa', border: '1px solid #4c1d95'
        }}>
          {activeDeck.subject}
        </span>
      </div>

      <div onClick={flip} style={{
        background: flipped ? '#1e1b4b' : '#1a1a1a',
        border: `1px solid ${flipped ? '#4338ca' : '#2a2a2a'}`,
        borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center',
        cursor: 'pointer', minHeight: '200px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
        transition: 'all 0.2s ease', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {flipped ? 'Answer' : 'Question'}
        </div>
        <div style={{ fontSize: '1rem', lineHeight: '1.7', color: flipped ? '#c4b5fd' : '#f0f0f0', fontWeight: flipped ? '400' : '500' }}>
          {flipped ? card.back : card.front}
        </div>
        {!flipped && <div style={{ fontSize: '0.75rem', color: '#444', marginTop: '0.5rem' }}>tap to flip</div>}
      </div>

      {flipped && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => answer('again')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '0.7rem', background: '#7f1d1d', color: '#fca5a5',
            border: '1px solid #b91c1c', borderRadius: '10px', fontSize: '0.9rem',
            cursor: 'pointer', fontWeight: '500'
          }}>
            <X size={16} /> Again
          </button>
          <button onClick={() => answer('got')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '0.7rem', background: '#14532d', color: '#86efac',
            border: '1px solid #16a34a', borderRadius: '10px', fontSize: '0.9rem',
            cursor: 'pointer', fontWeight: '500'
          }}>
            <Check size={16} /> Got it
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => { if(current > 0){ setCurrent(c=>c-1); setFlipped(false) } }} disabled={current === 0} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
          padding: '0.45rem 1rem', color: current === 0 ? '#333' : '#888',
          fontSize: '0.8rem', cursor: current === 0 ? 'not-allowed' : 'pointer'
        }}>
          <ChevronLeft size={14} /> Prev
        </button>
        <button onClick={() => setActiveDeck(null)} style={{
          background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
          padding: '0.45rem 1rem', color: '#666', fontSize: '0.8rem', cursor: 'pointer'
        }}>
          ← All Decks
        </button>
        <button onClick={() => { if(current < cards.length-1){ setCurrent(c=>c+1); setFlipped(false) } }} disabled={current === cards.length-1} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
          padding: '0.45rem 1rem', color: current === cards.length-1 ? '#333' : '#888',
          fontSize: '0.8rem', cursor: current === cards.length-1 ? 'not-allowed' : 'pointer'
        }}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}