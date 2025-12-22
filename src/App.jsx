import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import ProductCreate from './pages/ProductCreate';
import ProductEdit from './pages/ProductEdit';
import MyProducts from './pages/MyProducts';
import MyPage from './pages/MyPage';
import Favorites from './pages/Favorites';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import Admin from './pages/Admin';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 초기 로드 시 사용자 정보 확인
    const checkUser = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();

    // localStorage 변경 감지 (다른 탭에서 로그아웃 시)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 커스텀 이벤트로 같은 탭에서의 변경도 감지
    const handleCustomStorageChange = () => {
      checkUser();
    };

    window.addEventListener('authChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleCustomStorageChange);
    };
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // 커스텀 이벤트 발생 (같은 탭에서도 감지 가능)
    window.dispatchEvent(new Event('authChange'));
  };

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-primary-50">
          <Header user={user} />
          <main className="pb-8">
            <Routes>
              <Route 
                path="/" 
                element={user ? <Home /> : <Navigate to="/login" />} 
              />
              <Route
                path="/login"
                element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
              />
              <Route
                path="/register"
                element={user ? <Navigate to="/" /> : <Register />}
              />
              <Route 
                path="/products/:id" 
                element={user ? <ProductDetail user={user} /> : <Navigate to="/login" />} 
              />
              <Route
                path="/products/create"
                element={user ? <ProductCreate /> : <Navigate to="/login" />}
              />
              <Route
                path="/products/:id/edit"
                element={user ? <ProductEdit /> : <Navigate to="/login" />}
              />
              <Route
                path="/my-products"
                element={user ? <MyProducts /> : <Navigate to="/login" />}
              />
              <Route
                path="/my-page"
                element={user ? <MyPage onLogout={handleLogout} /> : <Navigate to="/login" />}
              />
              <Route
                path="/favorites"
                element={user ? <Favorites /> : <Navigate to="/login" />}
              />
              <Route
                path="/chat"
                element={user ? <ChatList /> : <Navigate to="/login" />}
              />
              <Route
                path="/chat/:id"
                element={user ? <ChatRoom /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin"
                element={user?.is_admin ? <Admin /> : <Navigate to="/" />}
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;


