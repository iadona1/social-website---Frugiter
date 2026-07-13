import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/welcomePage'
import Home from './pages/homePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App