import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Quiz from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import QuestionManager from './pages/QuestionManager';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/quiz" element={<Quiz />} />
          </Route>

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/questions" element={<QuestionManager />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
