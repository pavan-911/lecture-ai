import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#666', fontSize: '0.9rem'
      }}>
        Loading...
      </div>
    )
  }

  if (!user) return <Login />

  return children
}