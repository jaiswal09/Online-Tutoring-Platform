import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, BookOpen, Settings, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();

  const getProfileLink = () => {
    if (user?.role === 'ADMIN') return '/admin/profile';
    if (user?.role === 'TUTOR') return '/tutor/profile';
    if (user?.role === 'STUDENT') return '/student/profile';
    return '/profile';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'TUTOR': return 'bg-green-100 text-green-800';
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-slideInLeft">
              <div className="relative">
                <BookOpen className="h-8 w-8 text-blue-600 animate-float" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 ml-2 text-gradient">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-6 animate-slideInRight">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-gray-700">{user?.email}</div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user?.role || '')}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Link
                  to={getProfileLink()}
                  className="group flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-all duration-300 hover:scale-105 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/20"
                >
                  <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-sm font-medium hidden sm:inline">Profile</span>
                </Link>
                
                <button
                  onClick={logout}
                  className="group flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-all duration-300 hover:scale-105 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/20"
                >
                  <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  <span className="text-sm font-medium hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-fadeInUp">
          {children}
        </div>
      </main>

      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
      </div>
    </div>
  );
};

export default Layout;