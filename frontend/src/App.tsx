import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Snapshots from "./pages/Snapshots";
import Analytics from "./pages/Analytics";
import Import from "./pages/Import";
import ManualSnapshot from "./pages/ManualSnapshot";
import Milestones from "./pages/Milestones";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import ReauthModal from "./components/ReauthModal";

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const encryptionKey = useAuthStore((state) => state.encryptionKey);

  if (!isAuthenticated) {
    return <Login />;
  }

  // If authenticated but encryption key is lost (page reload), show re-auth modal
  const needsReauth = isAuthenticated && !encryptionKey;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {needsReauth && <ReauthModal />}
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/snapshots" element={<Snapshots />} />
            <Route path="/manual-snapshot" element={<ManualSnapshot />} />
            <Route path="/manual-snapshot/:id" element={<ManualSnapshot />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/import" element={<Import />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/milestones/new" element={<Milestones />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
