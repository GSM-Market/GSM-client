import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Badge from './ui/Badge';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { getImageUrl } from '../utils/config';

const Header = ({ user }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = useUnreadMessages(user);

  const isActive = (path, tab = null) => {
    if (path === '/') {
      return location.pathname === '/' && !location.pathname.startsWith('/products') && !location.pathname.startsWith('/chat') && !location.pathname.startsWith('/admin');
    }
    if (path === '/products/create') {
      return location.pathname === '/products/create';
    }
    if (path === '/admin' && tab) {
      const searchParams = new URLSearchParams(location.search);
      return location.pathname === '/admin' && searchParams.get('tab') === tab;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-soft">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          <Link to="/" className="flex items-center group">
            <img 
              src="/logo.png" 
              alt="GSM Market" 
              className="h-40 md:h-48 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-button transition ${
                    isActive('/')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  홈
                </Link>
                {!user.is_admin && (
                  <Link
                    to="/products/create"
                    className={`px-4 py-2 rounded-button transition ${
                      isActive('/products/create')
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    상품등록
                  </Link>
                )}
                {user.is_admin ? (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-button transition ${
                      isActive('/admin')
                        ? 'bg-danger-100 text-danger-700 font-medium'
                        : 'text-danger-600 hover:text-danger-700 hover:bg-danger-50'
                    }`}
                  >
                    관리
                  </Link>
                ) : (
                  <Link
                    to="/my-products"
                    className={`px-4 py-2 rounded-button transition ${
                      isActive('/my-products')
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    내 상품
                  </Link>
                )}
                <Link
                  to="/chat"
                  className={`px-4 py-2 rounded-button transition relative ${
                    isActive('/chat')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  채팅
                  {unreadCount > 0 && (
                    <Badge 
                      variant="danger" 
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs px-1"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
                <Link
                  to="/my-page"
                  className={`px-4 py-2 rounded-button transition flex items-center space-x-2 ${
                    isActive('/my-page')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <span>{user.nickname}</span>
                  {user.avatar_url ? (
                    <img
                      src={getImageUrl(user.avatar_url)}
                      alt={user.nickname}
                      className="w-6 h-6 rounded-full object-cover border border-primary-200"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.nickname?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-button transition ${
                    isActive('/login')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-button transition ${
                    isActive('/register')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-primary-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {user ? (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-button ${
                    isActive('/') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  홈
                </Link>
                {!user.is_admin && (
                  <Link
                    to="/products/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-button ${
                      isActive('/products/create') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    상품등록
                  </Link>
                )}
                        {user.is_admin ? (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-4 py-2 rounded-button ${
                              isActive('/admin') ? 'bg-danger-100 text-danger-700' : 'text-danger-600'
                            }`}
                          >
                            관리
                          </Link>
                        ) : (
                          <Link
                            to="/my-products"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-4 py-2 rounded-button ${
                              isActive('/my-products') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
                            }`}
                          >
                            내 상품
                          </Link>
                        )}
                <Link
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-button relative ${
                    isActive('/chat') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  채팅
                  {unreadCount > 0 && (
                    <Badge 
                      variant="danger" 
                      className="absolute top-1 right-1 min-w-[20px] h-5 flex items-center justify-center text-xs px-1"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
                <Link
                  to="/my-page"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-button ${
                    isActive('/my-page') ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  마이페이지 ({user.nickname})
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-button transition ${
                    isActive('/login') ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-button transition ${
                    isActive('/register') ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
