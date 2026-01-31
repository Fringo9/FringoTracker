import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useAuthStore } from "./stores/authStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Snapshots from "./pages/Snapshots";
import Analytics from "./pages/Analytics";
import Import from "./pages/Import";
import Milestones from "./pages/Milestones";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/snapshots" element={<Snapshots />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/import" element={<Import />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

// Deploy trigger
