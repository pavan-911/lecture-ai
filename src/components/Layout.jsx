import { NavLink } from 'react-router-dom'
import { Radio, BookOpen, CreditCard, HelpCircle, BarChart2, BookMarked, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'

const navItems = [
  { to: '/',           icon: Radio,      label: 'Live' },
  { to: '/notes',      icon: BookOpen,   label: 'My Notes' },
  { to: '/flashcards', icon: CreditCard, label: 'Flashcards' },
  { to: '/quiz',       icon: HelpCircle, label: 'Quiz' },
  { to: '/revision',   icon: BookMarked, label: 'Revision' },
  { to: '/progress',   icon: BarChart2,  label: 'Progress' },
]

export default function Layout({ children }) {
  const { user } = useAuth()

  async function handleLogout() {
    await signOut(auth)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: '200px', background: '#1a1a1a',
        borderRight: '1px solid #2a2a2a',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#a78bfa' }}>LectureAI</div>
          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>Your study partner</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0.5rem 0', flex: 1 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0.6rem 1rem', fontSize: '0.85rem',
                color: isActive ? '#a78bfa' : '#888',
                background: isActive ? '#2d1f4e' : 'transparent',
                borderRight: isActive ? '2px solid #a78bfa' : '2px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User profile + logout */}
        <div style={{ borderTop: '1px solid #2a2a2a', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#2d1f4e', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.75rem', color: '#a78bfa', flexShrink: 0
              }}>
                {user?.displayName?.[0] || '?'}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.displayName || 'Student'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0.45rem 0.6rem', background: 'none',
              border: '1px solid #2a2a2a', borderRadius: '8px',
              color: '#666', fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7f1d1d'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666' }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', background: '#0f0f0f' }}>
        {children}
      </div>

    </div>
  )
}