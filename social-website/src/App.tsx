import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/welcomePage";
import Home from "./pages/homePage";
import SelectAvatar from "./pages/selectAvatarPage";
import Settings from "./pages/settingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/resetPasswordPage";
import ForgotPassword from "./pages/forgotPasswordPage";
import ProfilePage from "./pages/profilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route
          path="/select-avatar"
          element={
            <ProtectedRoute>
              <SelectAvatar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Moved inside <Routes> */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;