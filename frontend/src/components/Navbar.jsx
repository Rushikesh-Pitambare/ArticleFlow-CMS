import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import TrustBadge from './trust/TrustBadge';

import {
  BookOpen,
  LayoutGrid,
  Search,
  PenLine,
  User,
  Bell,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  CheckCheck,
  Sparkles,
  Sun,
  Moon,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  BarChart3,
} from 'lucide-react';

const Navbar = () => {
  const {
    user,
    isAuthenticated,
    isAuthor,
    isAdmin,
    logout,
    switchDemoUser,
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('lumen_dark_mode') === 'true';
  });

  const navigate = useNavigate();
  const location = useLocation();

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const roleSwitcherRef = useRef(null);

  const [notifications, setNotifications] = useState([]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lumen_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lumen_dark_mode', 'false');
    }
  }, [darkMode]);

  const demoUsers = [
    {
      name: 'Priya Mehta',
      email: 'priya.mehta@lumen.com',
      role: 'Author',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      name: 'Thomas Okeke',
      email: 'author@lumen.com',
      role: 'Author',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      name: 'Amara Silva',
      email: 'admin@lumen.com',
      role: 'Admin',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      name: 'Lena Kaufmann',
      email: 'reader@lumen.com',
      role: 'Reader',
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    },
  ];

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      if (response.data?.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      // Ignore notification errors
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          unread: false,
        }))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === id
            ? {
                ...n,
                isRead: true,
                unread: false,
              }
            : n
        )
      );
    } catch (err) {
      console.error('Mark single read error:', err);
    }
  };

  const handleSwitchPersona = async (email) => {
    setRoleSwitcherOpen(false);
    await switchDemoUser(email);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }

      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setNotifDropdownOpen(false);
      }

      if (
        roleSwitcherRef.current &&
        !roleSwitcherRef.current.contains(event.target)
      ) {
        setRoleSwitcherOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
    setRoleSwitcherOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Active navigation states
  const isHomeActive = location.pathname === '/';
  const isBrowseActive = location.pathname.startsWith('/browse');
  const isDiscussionActive = location.pathname.startsWith('/discussions');
  const isChatActive = location.pathname.startsWith('/chat');
  const isWriteActive = location.pathname.startsWith('/write');
  const isQuizBuilderActive = location.pathname.startsWith('/quiz-builder');
  const isAnalyticsActive = location.pathname.startsWith('/analytics');
  const isAdminActive = location.pathname.startsWith('/admin');
  const isProfileActive = location.pathname === '/profile';

  const unreadCount = notifications.filter((n) => !n.isRead || n.unread).length;

  const navGroups = [
    {
      groupTitle: 'WORKSPACE',
      items: [
        {
          to: '/',
          label: 'Home',
          icon: LayoutGrid,
          active: isHomeActive,
        },
        {
          to: '/browse',
          label: 'Browse',
          icon: Search,
          active: isBrowseActive,
        },
        {
          to: '/discussions',
          label: 'Discussions',
          icon: MessageSquare,
          active: isDiscussionActive,
        },
      ],
    },
    {
      groupTitle: 'STUDIO & INTELLIGENCE',
      items: [
        {
          to: '/chat',
          label: 'Chat',
          icon: MessageSquare,
          active: isChatActive,
          show: isAuthenticated,
        },
        {
          to: '/write',
          label: 'Write',
          icon: PenLine,
          active: isWriteActive,
          show: isAuthor || isAdmin,
        },
        {
          to: '/quiz-builder',
          label: 'Quizzes',
          icon: BookOpen,
          active: isQuizBuilderActive,
          show: isAuthor || isAdmin,
        },
        {
          to: '/analytics',
          label: 'Analytics',
          icon: BarChart3,
          active: isAnalyticsActive,
          show: isAuthor || isAdmin,
        },
      ],
    },
    {
      groupTitle: 'GOVERNANCE',
      items: [
        {
          to: '/admin',
          label: 'Admin',
          mobileLabel: 'Admin Center',
          icon: ShieldCheck,
          active: isAdminActive,
          show: isAdmin,
        },
        {
          to: '/profile',
          label: 'Profile',
          icon: User,
          active: isProfileActive,
          show: isAuthenticated,
        },
      ],
    },
  ];

  return (
    <aside className="sticky top-0 z-50 w-full shrink-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors md:sticky md:h-screen md:w-64 md:border-b-0 md:border-r shadow-xs">
      <div className="h-full px-3.5 sm:px-5 md:px-3 flex flex-col justify-between">
        
        {/* Top Header & Brand */}
        <div className="flex items-center justify-between py-3.5 md:py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Layers className="w-5 h-5" />
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                ArticleFlow
              </span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  ENTERPRISE CMS
                </span>
              </div>
            </div>
          </Link>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Dark Mode toggle mobile */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-col flex-1 overflow-y-auto py-3 space-y-5 pr-1">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(({ show }) => show !== false);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  {group.groupTitle}
                </div>

                <div className="space-y-0.5">
                  {visibleItems.map(({ to, label, icon: Icon, active }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-2xs font-bold border border-blue-200/60 dark:border-blue-800/60'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                      )}
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          active
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Control Dock (Desktop) */}
        <div className="hidden md:flex flex-col gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 pb-2">
          
          {/* Action Row: Theme toggle + Demo persona + Notifications */}
          <div className="flex items-center justify-between gap-1 px-1">
            
            {/* Dark Mode Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full ring-2 ring-white dark:ring-[#0B0F19]" />
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-80 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const notificationId = n._id || n.id;
                        const isUnread = !n.isRead || n.unread;

                        return (
                          <div
                            key={notificationId}
                            onClick={() => {
                              handleMarkSingleRead(notificationId);
                              if (n.link) navigate(n.link);
                            }}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-xs cursor-pointer ${
                              isUnread ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {n.title}
                              </p>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Quick Button */}
            <div className="relative flex-1" ref={roleSwitcherRef}>
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition"
                title="Switch Demo Persona"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate">Persona</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-72 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Select Demo Role
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Switch roles to test permissions & telemetry
                    </p>
                  </div>

                  <div className="py-1">
                    {demoUsers.map((u) => (
                      <button
                        key={u.email}
                        onClick={() => handleSwitchPersona(u.email)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left ${
                          user?.email === u.email
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 font-bold'
                            : ''
                        }`}
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {u.email}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${u.badge}`}>
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* User Profile Card / Sign In */}
          {isAuthenticated ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 transition text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {getInitials(user?.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {user?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {user?.role}
                    </span>
                    <TrustBadge score={user?.trustScore ?? 50} level={user?.trustLevel} size="sm" variant="compact" />
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
              </button>

              {userDropdownOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-64 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    My Profile
                  </Link>

                  <Link
                    to="/my-appeals"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    Report Appeals
                  </Link>

                  <Link
                    to="/discussions"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Community Discussions
                  </Link>

                  {(isAuthor || isAdmin) && (
                    <Link
                      to="/write"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Write New Article
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        Admin Center
                      </Link>

                      <Link
                        to="/admin?tab=appeals"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Appeals Queue
                      </Link>

                      <Link
                        to="/admin?tab=spam"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Spam & Abuse
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Link
                to="/login"
                className="w-full text-center py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] px-4 py-4 space-y-3 shadow-xl">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {group.groupTitle}
              </div>
              {group.items
                .filter(({ show }) => show !== false)
                .map(({ to, label, mobileLabel, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    {mobileLabel || label}
                  </Link>
                ))}
            </div>
          ))}

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 px-1">
                <span>Signed in as <strong className="text-slate-900 dark:text-slate-100">{user?.name}</strong></span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <Link
                to="/login"
                className="flex-1 text-center py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2 text-xs font-bold bg-blue-600 text-white rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Navbar;