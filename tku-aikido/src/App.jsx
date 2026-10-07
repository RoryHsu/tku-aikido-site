import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Coaches from "./pages/Coaches";
import Classes from "./pages/Classes";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Achievements from "./pages/Achievements";
import Videos from "./pages/Videos";
import Contact from "./pages/Contact";
import FinanceSignPage from "./pages/FinanceSignPage";

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
import { rolesFor } from "./components/adminMenu";

// 前台共用版面：每個前台頁面都有導覽列與頁尾
function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 前台頁面 */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* 領款人簽名頁：由財務長產生的連結開啟，不需登入 */}
        <Route path="/finance/sign/:recordId" element={<FinanceSignPage />} />

        {/* 後台登入 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        {/* 後台首頁：登入後都能進入；沒有職位的帳號會看到「尚未設定職位權限」 */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 職位授權管理：只有社長 */}
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RoleRoute allowRoles={rolesFor("/admin/roles")}>
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
              <RoleRoute allowRoles={rolesFor("/admin/members")}>
                <MembersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* 活動公告管理：所有現任幹部 */}
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowRoles={rolesFor("/admin/events")}
              >
                <EventsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* 照片 / 影片管理：所有現任幹部與歷任幹部 */}
        <Route
          path="/admin/media"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowRoles={rolesFor("/admin/media")}
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
              <RoleRoute allowRoles={rolesFor("/admin/finance")}>
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
              <RoleRoute allowRoles={rolesFor("/admin/seal")}>
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