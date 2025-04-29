'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState(null);

  // Handle screen resize to collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Check subscription status on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get user ID from localStorage
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        setUserId(storedUserId);
        
        // Check subscription status
        const subscriptionStatus = localStorage.getItem(`subscription_${storedUserId}`);
        if (subscriptionStatus) {
          try {
            const isUserSubscribed = JSON.parse(subscriptionStatus);
            setIsSubscribed(!!isUserSubscribed); // Convert to boolean
          } catch (e) {
            console.error('Error parsing subscription data:', e);
            setIsSubscribed(false);
          }
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      
      // Clear subscription data too
      if (userId) {
        localStorage.removeItem(`subscription_${userId}`);
      }
      
      // Redirect to login page
      router.push('/login');
    }
  };

  const NavLink = ({ href, icon, label, requiresSubscription = false }) => {
    // Skip rendering if link requires subscription and user is not subscribed
    if (requiresSubscription && !isSubscribed) {
      return null;
    }
    
    const isActive = pathname === href;
    
    return (
      <Link
        href={href}
        className={`flex items-center py-2 px-2 my-0.5 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-100 text-blue-800 font-medium' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {icon}
        {!isCollapsed && <span className="ml-2 text-sm">{label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button - fixed at the top left */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md text-gray-800 hover:text-gray-900 focus:outline-none"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-20
          flex flex-col
          bg-white shadow-lg
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-14 px-3 border-b">
          <Link href="/dashboard" className={`text-lg font-bold text-blue-900 ${isCollapsed ? 'hidden' : 'block'}`}>
            Career Path
          </Link>
          <Link href="/dashboard" className={`text-lg font-bold text-blue-800 ${isCollapsed ? 'block' : 'hidden'}`}>
            CP
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 hidden md:block"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 pt-2 pb-2 overflow-y-auto">
          <div className={`px-2 ${isCollapsed ? 'space-y-3' : 'space-y-0.5'}`}>
            <NavLink 
              href="/dashboard"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              label="Dashboard"
            />
            
            <NavLink 
              href="/jobs"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              label="Job Listings"
            />
            
            <NavLink 
              href="/test"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              label="Assessment"
            />
            
            <NavLink 
              href="/roadmap"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              label="Roadmap"
            />
            
            <NavLink 
              href="/roadmapro"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              label="Roadmap Pro"
            />
            
            <NavLink 
              href="/resources"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              label="Resources"
            />
            
            {/* Map link only shown for subscribers */}
            <NavLink 
              href="/map"
              requiresSubscription={true}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
                </svg>
              }
              label="Map"
            />

            <NavLink 
              href="/interview"
              requiresSubscription={true}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              label="Interview"
            />
          </div>
        </nav>

        {/* Subscription status indicator */}
        {!isCollapsed && (
          <div className="px-3 py-1.5 mb-1">
            {isSubscribed ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-1.5">
                <div className="text-xs text-blue-800 font-medium">Premium Subscription</div>
                <div className="text-xs text-blue-600 mt-0.5">All features unlocked</div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-1.5">
                <div className="text-xs text-gray-800 font-medium">Free Account</div>
                <div className="text-xs text-gray-600 mt-0.5">Upgrade for more features</div>
              </div>
            )}
          </div>
        )}

        {/* Logout button */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} py-1.5 w-full rounded-md text-red-600 hover:bg-red-50 transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="ml-2 text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`
        flex-1
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}
        pt-16 md:pt-0
      `}>
        {children}
      </main>
    </>
  );
}