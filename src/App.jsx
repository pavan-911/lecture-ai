import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Live from './pages/Live'
import Notes from './pages/Notes'
import Flashcards from './pages/Flashcards'
import Quiz from './pages/Quiz'
import Revision from './pages/Revision'
import Progress from './pages/Progress'

function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Layout>
          <Routes>
            <Route path="/"            element={<Live />} />
            <Route path="/notes"       element={<Notes />} />
            <Route path="/flashcards"  element={<Flashcards />} />
            <Route path="/quiz"        element={<Quiz />} />
            <Route path="/revision"    element={<Revision />} />
            <Route path="/progress"    element={<Progress />} />
          </Routes>
        </Layout>
      </ProtectedRoute>
    </BrowserRouter>
  )
}

export default App