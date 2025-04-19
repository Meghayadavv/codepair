import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Pages
import DashboardPage from "@/pages/DashboardPage";
import CodeSessionPage from "@/pages/CodeSessionPage";
import FindPartnersPage from "@/pages/FindPartnersPage";
import SessionHistoryPage from "@/pages/SessionHistoryPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import { User } from "@shared/schema";

// Define user context for the app
export type AppState = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
};

// Mock user for initial development
const initialState: AppState = {
  user: null,
  setUser: () => {},
  isLoading: true,
};

export const AppContext = React.createContext<AppState>(initialState);

function Router() {
  const [location] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get stored user from localStorage
        const storedUser = localStorage.getItem('codepair_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('codepair_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('codepair_user');
    }
  }, [user]);

  // Handle user setting in one place
  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
  };

  const appState: AppState = {
    user,
    setUser: handleSetUser,
    isLoading,
  };

  // Redirect to login if no user and not on auth page
  if (!isLoading && !user && location !== "/auth") {
    window.location.href = "/auth";
    return null;
  }

  return (
    <AppContext.Provider value={appState}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={DashboardPage} />
        <Route path="/session/:id" component={CodeSessionPage} />
        <Route path="/find-partners" component={FindPartnersPage} />
        <Route path="/history" component={SessionHistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
