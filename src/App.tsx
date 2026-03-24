import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const ConnectionsPage = lazy(() => import("./pages/dashboard/ConnectionsPage"));
const GeneratePage = lazy(() => import("./pages/dashboard/GeneratePage"));
const QuizzesPage = lazy(() => import("./pages/dashboard/QuizzesPage"));
const AnalyticsPage = lazy(() => import("./pages/dashboard/AnalyticsPage"));
const ActivityPage = lazy(() => import("./pages/dashboard/ActivityPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Dashboard (protected) */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="connections" element={<ConnectionsPage />} />
                <Route path="generate" element={<GeneratePage />} />
                <Route path="quizzes" element={<QuizzesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Public quiz */}
              <Route path="/quiz/:id" element={<QuizPage />} />
              <Route path="/history" element={<HistoryPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
