import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Navbar({ onLoginClick }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const username =
    user?.user_metadata?.username ??
    user?.user_metadata?.preferred_username ??
    null;

  // First name only (never full name)
  const firstName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.first_name ??
    (user?.user_metadata?.name?.trim()?.split(/\s+/)[0]) ??
    (user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0]) ??
    null;

  const label = loading ? '...' : user ? (username || firstName || 'Profile') : 'Login';

  const handleRightButton = () => {
    if (loading) return;
    if (user) {
      navigate('/profile');
    } else {
      onLoginClick?.();
    }
  };

  useEffect(() => {
    if (!user) return;
    // Fetch notifications for the user
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      let notifs = data || [];

      // Apply localStorage read state
      const readIds = JSON.parse(localStorage.getItem(`readNotifications_${user.id}`) || '[]');
      notifs = notifs.map(n => ({ ...n, is_read: n.is_read || readIds.includes(n.id) }));

      setNotifications(notifs);
    };
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && notifications.length > 0) {
      // Mark all as read when opening
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      // Persist read state in localStorage
      const readIds = notifications.map(n => n.id);
      localStorage.setItem(`readNotifications_${user.id}`, JSON.stringify(readIds));
    }
  };

  const clearAllNotifications = async () => {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    setNotifications([]);
    localStorage.removeItem(`readNotifications_${user.id}`);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold">
          <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Templyx
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`
            }
          >
            Projects
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`
            }
          >
            About
          </NavLink>

          {user && (
            <div className="relative">
              <button
              onClick={toggleNotifications}
              className={`relative p-2 text-black hover:text-gray-600 hover:scale-110 transition-all duration-200 cursor-pointer ${notifications.filter(n => !n.is_read).length > 0 ? 'animate-bounce' : ''}`}
              >
                🔔
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-2">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-500">No notifications</p>
                    ) : (
                      <>
                        <ul className="space-y-2">
                          {notifications.map(notif => (
                            <li key={notif.id} className={`text-sm p-2 rounded ${notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-black'}`}>
                              {notif.message}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={clearAllNotifications}
                          className="mt-4 w-full text-sm text-red-600 hover:text-red-800 underline"
                        >
                          🗑️ Clear All
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRightButton}
            className="max-w-[160px] truncate rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            title={label}
          >
            {label}
          </button>
        </div>
      </div>
    </nav>
  );
}