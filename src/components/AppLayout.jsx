import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
  }`;

function AppLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center py-3 sm:h-16 sm:py-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center mr-2">
                <span className="text-2xl mr-2">✈️</span>
                <span className="text-xl font-bold text-gray-800">ICN Flight Alert</span>
              </div>
              <div className="flex items-center gap-1">
                <NavLink to="/dashboard" className={navClass} end>
                  대시보드
                </NavLink>
                <NavLink to="/chatbot" className={navClass}>
                  공항 챗봇
                </NavLink>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:space-x-4">
              <span className="text-sm text-gray-600 truncate max-w-[200px]">{user?.email}</span>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm shrink-0"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

export default AppLayout;
