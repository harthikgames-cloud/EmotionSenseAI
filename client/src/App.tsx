import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import WelcomeScreen from "@/components/WelcomeScreen";
import LiveSession from "@/pages/LiveSession";
import Insights from "@/pages/Insights";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LiveSession} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPage, setCurrentPage] = useState("/");

  if (showWelcome) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header 
            userName="Alex Morgan"
            onProfileClick={() => window.location.href = "/profile"}
            onSettingsClick={() => window.location.href = "/profile"}
          />
          
          <main>
            <Router />
          </main>

          <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background">
            <div className="flex items-center justify-around h-16">
              <button
                onClick={() => {
                  setCurrentPage("/");
                  window.location.href = "/";
                }}
                className={`flex flex-col items-center gap-1 px-4 py-2 ${
                  currentPage === "/" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-session"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                </svg>
                <span className="text-xs font-medium">Session</span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentPage("/insights");
                  window.location.href = "/insights";
                }}
                className={`flex flex-col items-center gap-1 px-4 py-2 ${
                  currentPage === "/insights" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-insights"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs font-medium">Insights</span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentPage("/profile");
                  window.location.href = "/profile";
                }}
                className={`flex flex-col items-center gap-1 px-4 py-2 ${
                  currentPage === "/profile" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </nav>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
