import React, { createContext, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';

// Holds the author an admin has picked in the analytics page header.
// '' means "all authors". Authors never use this: the API scopes them itself.
const ScopeContext = createContext({ adminSelectedAuthorId: '' });

export function AnalyticsScopeProvider({ authorId = '', children }) {
  return (
    <ScopeContext.Provider value={{ adminSelectedAuthorId: authorId }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useAnalyticsScope() {
  const { user, isAdmin } = useAuth();
  const { adminSelectedAuthorId } = useContext(ScopeContext);
  return { user, isAdmin, adminSelectedAuthorId };
}
