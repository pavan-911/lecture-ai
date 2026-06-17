import { useState } from 'react'
import { auth, provider } from '../firebase'
import { signInWithPopup } from 'firebase/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '16px', padding: '2.5rem 2rem',
        width: '100%', maxWidth: '380px', textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: '#2d1f4e', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.25rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.4rem' }}>
          LectureAI
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
          Your AI-powered study partner.<br />
          Capture lectures. Generate notes. Study smarter.
        </p>

        {/* Features list */}
        <div style={{
          background: '#111', border: '1px solid #222',
          borderRadius: '10px', padding: '1rem', marginBottom: '1.75rem',
          textAlign: 'left'
        }}>
          {[
            '🎙️  Live audio + screen capture',
            '📌  Strict & Concept notes',
            '🃏  Auto flashcards & quizzes',
            '📊  Progress tracking',
          ].map((f, i) => (
            <div key={i} style={{
              fontSize: '0.8rem', color: '#888', padding: '0.3rem 0',
              borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none'
            }}>
              {f}
            </div>
          ))}
        </div>

        {/* Google Sign in button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '0.75rem',
            background: loading ? '#2a2a2a' : '#fff',
            color: loading ? '#555' : '#111',
            border: 'none', borderRadius: '10px',
            fontSize: '0.9rem', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/>
                <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z"/>
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.3-4.1-13.2-9.7l-7.8 6C6.9 42.6 14.8 48 24 48z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <div style={{
            marginTop: '1rem', fontSize: '0.8rem',
            color: '#f87171', background: '#7f1d1d',
            border: '1px solid #b91c1c', borderRadius: '8px', padding: '0.5rem'
          }}>
            {error}
          </div>
        )}

        <p style={{ fontSize: '0.72rem', color: '#444', marginTop: '1.25rem' }}>
          By signing in you agree to our terms of service
        </p>
      </div>
    </div>
  )
}