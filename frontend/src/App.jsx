import React from 'react';
import QuizAttempt from './pages/QuizAttempt';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';

import AdminDashboard from './pages/AdminDashboard';
import AdminVerification from './pages/AdminVerification';

import { HomePage, BrowsePage } from './pages/Placeholders';

import ArticleDetails from './pages/ArticleDetails';
import WriteArticle from './pages/WriteArticle';
import ArticleConfirmation from './pages/ArticleConfirmation';

import DiscussionPage from './pages/DiscussionPage';
import ChatPage from './pages/ChatPage';
import QuizBuilder from './pages/QuizBuilder';
import Appeals from './pages/Appeals';
import AuthorAnalytics from './pages/AuthorAnalytics';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-150">
          <Navbar />

          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1">
            <Routes>

              {/* ================================================= */}
              {/* PUBLIC ROUTES */}
              {/* ================================================= */}

              <Route
                path="/"
                element={<HomePage />}
              />

              <Route
                path="/browse"
                element={<BrowsePage />}
              />

              {/* Article details */}
              <Route
                path="/browse/:id"
                element={<ArticleDetails />}
              />

              {/* Discussions */}
              <Route
                path="/discussions"
                element={<DiscussionPage />}
              />

              {/* Chat */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              {/* Quiz Builder */}
              <Route
                path="/quiz-builder"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['author', 'admin']}>
                      <QuizBuilder />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />


              {/* Author Analytics & Freshness Alerts */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['author', 'admin']}>
                      <AuthorAnalytics />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />

              {/* Login */}
              <Route
                path="/login"
                element={<Login />}
              />

              {/* Register */}
              <Route
                path="/register"
                element={<Register />}
              />


              {/* ================================================= */}
              {/* LOGGED-IN USER PROFILE */}
              {/* ================================================= */}

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />


              {/* ================================================= */}
              {/* PUBLIC USER PROFILE */}
              {/* Example: /profile/64f123abc... */}
              {/* ================================================= */}

              <Route
                path="/profile/:id"
                element={<PublicProfile />}
              />


              {/* ================================================= */}
              {/* PROTECTED QUIZ ROUTES */}
              {/* ================================================= */}

              <Route
                path="/quiz"
                element={
                  <ProtectedRoute>
                    <QuizAttempt />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/quiz/:id"
                element={
                  <ProtectedRoute>
                    <QuizAttempt />
                  </ProtectedRoute>
                }
              />


              {/* ================================================= */}
              {/* WRITE ARTICLE */}
              {/* ================================================= */}

              <Route
                path="/write"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['author', 'admin']}>
                      <WriteArticle />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/write/:id"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['author', 'admin']}>
                      <WriteArticle />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />


              {/* ================================================= */}
              {/* ARTICLE CONFIRMATION */}
              {/* ================================================= */}

              <Route
                path="/article-confirmation"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['author', 'admin']}>
                      <ArticleConfirmation />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />


              {/* ================================================= */}
              {/* ADMIN DASHBOARD */}
              {/* ================================================= */}

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />


              {/* ================================================= */}
              {/* ADMIN VERIFICATION */}
              {/* ================================================= */}

              <Route
                path="/admin/verification"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminVerification />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />

              {/* ================================================= */}
              {/* APPEALS & MODERATION DISPUTES (PHASE 3) */}
              {/* ================================================= */}

              <Route
                path="/appeals"
                element={
                  <ProtectedRoute>
                    <Appeals />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-appeals"
                element={
                  <ProtectedRoute>
                    <Appeals />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/appeals"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['admin']}>
                      <Navigate to="/admin?tab=appeals" replace />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/spam-abuse"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['admin']}>
                      <Navigate to="/admin?tab=spam" replace />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />


              {/* ================================================= */}
              {/* FALLBACK */}
              {/* ================================================= */}

              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

            </Routes>
            </main>

            <Footer />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
