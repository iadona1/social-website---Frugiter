import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/welcomePage'
import Home from './pages/homePage'
import SelectAvatar from './pages/selectAvatarPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/select-avatar" element={<SelectAvatar />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App