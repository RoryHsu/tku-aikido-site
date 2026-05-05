import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Coaches from "./pages/Coaches";
import Classes from "./pages/Classes";
import Achievements from "./pages/Achievements";
import Videos from "./pages/Videos";
import Contact from "./pages/Contact";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";

import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import Dashboard from "./pages/admin/Dashboard";
import RolesPage from "./pages/admin/RolesPage";
import MembersPage from "./pages/admin/MembersPage";
import EventsPage from "./pages/admin/EventsPage";
import MediaPage from "./pages/admin/MediaPage";
import FinancePage from "./pages/admin/FinancePage";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />

        <Route
          path="/coaches"
          element={
            <PublicLayout>
              <Coaches />
            </PublicLayout>
          }
        />

        <Route
          path="/classes"
          element={
            <PublicLayout>
              <Classes />
            </PublicLayout>
          }
        />

        <Route
          path="/achievements"
          element={
            <PublicLayout>
              <Achievements />
            </PublicLayout>
          }
        />

        <Route
          path="/videos"
          element={
            <PublicLayout>
              <Videos />
            </PublicLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />

        <Route
          path="/events"
          element={
            <PublicLayout>
              <Events />
            </PublicLayout>
          }
        />

        <Route
          path="/events/:id"
          element={
            <PublicLayout>
              <EventDetail />
            </PublicLayout>
          }
        />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RoleRoute allowRoles={["president"]}>
                <RolesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/members"
          element={
            <ProtectedRoute>
              <RoleRoute allowRoles={["president", "vice"]}>
                <MembersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowRoles={[
                  "president",
                  "vice",
                  "finance",
                  "activity",
                  "pr",
                ]}
              >
                <EventsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/media"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowRoles={[
                  "president",
                  "vice",
                  "finance",
                  "activity",
                  "pr",
                ]}
              >
                <MediaPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute>
              <RoleRoute allowRoles={["president", "finance"]}>
                <FinancePage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}