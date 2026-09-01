import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import StoreFront from './pages/StoreFront'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StoreFront />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}