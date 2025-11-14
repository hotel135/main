// src/components/dashboard/DashboardNav.js
'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardNav({ userData }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Client Navigation
  const clientNavItems = [
    { href: '/dashboard/client', label: 'Home', icon: '🏠' },
    { href: '/dashboard/client/browse', label: 'Browse', icon: '🔍' },
    { href: '/dashboard/client/saved', label: 'Saved', icon: '❤️' },
    { href: '/dashboard/client/profile', label: 'Profile', icon: '👤' },
  ];

  // Provider Navigation
  const providerNavItems = [
    { href: '/dashboard/provider', label: 'Home', icon: '🏠' },
    { href: '/dashboard/provider/profile', label: 'Profile', icon: '👤' },
    { href: '/dashboard/provider/wallet', label: 'Wallet', icon: '💰' },
    { href: '/dashboard/provider/ads', label: 'My Ads', icon: '📢' },
  ];

  const navItems = userData?.userType === 'provider' ? providerNavItems : clientNavItems;
  const isProvider = userData?.userType === 'provider';

  const isActive = (href) => {
    if (href === '/dashboard/client' || href === '/dashboard/provider') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-pink-500/30 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              MeetAnEscort
            </span>
            <span className="ml-2 px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs font-medium">
              {isProvider ? 'Provider' : 'Client'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isActive(item.href)
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg transition duration-200"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-pink-500/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition duration-200 ${
                    isActive(item.href)
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg transition duration-200"
              >
                <span className="mr-3">🚪</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}