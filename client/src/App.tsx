import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { BuilderPage } from "./pages/BuilderPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SurveyPage } from "./pages/SurveyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useAuth } from "./hooks/useAuth";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.authed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/builder/:id"
          element={
            <RequireAuth>
              <BuilderPage />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics/:id"
          element={
            <RequireAuth>
              <AnalyticsPage />
            </RequireAuth>
          }
        />
        <Route path="/s/:slug" element={<SurveyPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
