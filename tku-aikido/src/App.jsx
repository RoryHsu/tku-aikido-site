import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Coaches from "./pages/Coaches";
import Classes from "./pages/Classes";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Achievements from "./pages/Achievements";
import Videos from "./pages/Videos";
import Contact from "./pages/Contact";

import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import Dashboard from "./pages/admin/Dashboard";
import RolesPage from "./pages/admin/RolesPage";
import EventsPage from "./pages/admin/EventsPage";
import MediaPage from "./pages/admin/MediaPage";
import MembersPage from "./pages/admin/MembersPage";
import FinancePage from "./pages/admin/FinancePage";
import SealPage from "./pages/admin/SealPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 前台頁面 */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/coaches" element={<Coaches />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/contact" element={<Contact />} />

        {/* 後台登入 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        {/* 後台首頁：所有幹部可進入 */}
        <Route
          path="/admin/dashboard"
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
                <Dashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* 職位授權管理：只有社長 */}
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

        {/* 社員資料管理：社長、副社長 */}
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

        {/* 活動公告管理：所有幹部可協助 */}
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

        {/* 照片 / 影片管理：所有幹部可協助 */}
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

        {/* 領款收據 / 財務證明管理：財務長與社長 */}
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

        {/* 社章設定：只有社長 */}
        <Route
          path="/admin/seal"
          element={
            <ProtectedRoute>
              <RoleRoute allowRoles={["president"]}>
                <SealPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* 預設導向 */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}