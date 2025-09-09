import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import HomePage from "../pages/Home";
import { LoginPage, RegisterPage } from "../pages/Auth";
import VietMapPage from "../pages/VietMap";
import OpenMapPage from "../pages/OpenMap";
import TrackAsiaMapPage from "../pages/TrackAsiaMap";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/Dashboard/components/AdminDashboard";
import StaffDashboard from "../pages/Dashboard/components/StaffDashboard";
import PenaltyHistory from "../pages/Staff/PenaltyHistory";
import CustomerSupport from "../pages/Staff/CustomerSupport";
import ProfilePage from "../pages/Profile";
import {
  OrderList as StaffOrderList,
  OrderDetailPage as StaffOrderDetailPage,
} from "../pages/Staff/Order";
import { IssueList, IssueDetail } from "../pages/Staff/Issue";
import {
  OrderList as AdminOrderList,
  OrderDetailPage as AdminOrderDetailPage,
  OrderEdit as AdminOrderEdit,
} from "../pages/Admin/Order";
import OrdersPage from "../pages/Orders";
import OrderDetailPage from "../pages/Orders/OrderDetail";
import CreateOrder from "../pages/Orders/CreateOrder";
import { PermissionRoute } from "../components/auth";
import { MainLayout, AdminLayout } from "../components/layout";
import DriverPage from "../pages/Admin/Driver";
import DriverDetail from "../pages/Admin/Driver/DriverDetail";
import RegisterDriver from "../pages/Admin/Driver/RegisterDriver";

// Định nghĩa các route với bảo vệ dựa trên vai trò và trạng thái xác thực
const router = createBrowserRouter([
  // Các trang xác thực - chỉ dành cho người chưa đăng nhập
  {
    path: "/auth/login",
    element: (
      <PermissionRoute
        authenticationRequired="unauthenticated"
        authRedirectPath={(auth) => {
          // Chuyển hướng dựa trên vai trò nếu đã đăng nhập
          if (auth?.user?.role === "admin") return "/admin/dashboard";
          if (auth?.user?.role === "staff") return "/staff/dashboard";
          if (auth?.user?.role === "driver") return "/driver/dashboard";
          return "/"; // Mặc định cho customer
        }}
      >
        <LoginPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/auth/register",
    element: (
      <PermissionRoute
        authenticationRequired="unauthenticated"
        authRedirectPath={(auth) => {
          // Chuyển hướng dựa trên vai trò nếu đã đăng nhập
          if (auth?.user?.role === "admin") return "/admin/dashboard";
          if (auth?.user?.role === "staff") return "/staff/dashboard";
          if (auth?.user?.role === "driver") return "/driver/dashboard";
          return "/"; // Mặc định cho customer
        }}
      >
        <RegisterPage />
      </PermissionRoute>
    ),
  },

  // Trang chủ và các trang cho khách hàng - không có tiền tố /customer
  {
    path: "/",
    element: (
      <MainLayout>
        <Outlet />
      </MainLayout>
    ),
    children: [
      // Trang chủ - ai cũng có thể truy cập
      {
        index: true,
        element: <HomePage />,
      },

      // Các trang yêu cầu đăng nhập và vai trò customer
      {
        path: "dashboard",
        element: (
          <PermissionRoute
            authenticationRequired="authenticated"
            allowedRoles={["customer"]}
            authRedirectPath="/auth/login"
            roleRedirectPath="/"
          >
            <Dashboard />
          </PermissionRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <PermissionRoute
            authenticationRequired="authenticated"
            allowedRoles={["customer"]}
            authRedirectPath="/auth/login"
            roleRedirectPath="/"
          >
            <OrdersPage />
          </PermissionRoute>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <PermissionRoute
            authenticationRequired="authenticated"
            allowedRoles={["customer"]}
            authRedirectPath="/auth/login"
            roleRedirectPath="/"
          >
            <OrderDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "create-order",
        element: (
          <PermissionRoute
            authenticationRequired="authenticated"
            allowedRoles={["customer"]}
            authRedirectPath="/auth/login"
            roleRedirectPath="/"
          >
            <CreateOrder />
          </PermissionRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <PermissionRoute
            authenticationRequired="authenticated"
            allowedRoles={["customer"]}
            authRedirectPath="/auth/login"
            roleRedirectPath="/"
          >
            <ProfilePage />
          </PermissionRoute>
        ),
      },
      {
        path: "profile/:userId",
        element: (
          <PermissionRoute
            authenticationRequired="authenticated"
            allowedRoles={["customer"]}
            authRedirectPath="/auth/login"
            roleRedirectPath="/"
          >
            <ProfilePage />
          </PermissionRoute>
        ),
      },
    ],
  },

  // Route cho nhân viên - yêu cầu đăng nhập và vai trò staff
  {
    path: "/staff",
    element: (
      <PermissionRoute
        authenticationRequired="authenticated"
        allowedRoles={["staff"]}
        authRedirectPath="/auth/login"
        roleRedirectPath="/"
      >
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </PermissionRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <StaffDashboard />,
      },
      {
        path: "penalties",
        element: <PenaltyHistory />,
      },
      {
        path: "customer-support",
        element: <CustomerSupport />,
      },
      {
        path: "orders",
        element: <StaffOrderList />,
      },
      {
        path: "orders/:id",
        element: <StaffOrderDetailPage />,
      },
      {
        path: "issues",
        element: <IssueList />,
      },
      {
        path: "issues/:id",
        element: <IssueDetail />,
      },
      {
        path: "deliveries",
        element: <div>Quản lý vận chuyển</div>, // Thay thế bằng component thực tế
      },
      {
        path: "customers",
        element: <div>Quản lý khách hàng</div>, // Thay thế bằng component thực tế
      },
      {
        path: "reports",
        element: <div>Báo cáo</div>, // Thay thế bằng component thực tế
      },
      {
        path: "notifications",
        element: <div>Thông báo</div>, // Thay thế bằng component thực tế
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "profile/:userId",
        element: <ProfilePage />,
      },
    ],
  },

  // Route cho admin - yêu cầu đăng nhập và vai trò admin
  {
    path: "/admin",
    element: (
      <PermissionRoute
        authenticationRequired="authenticated"
        allowedRoles={["admin"]}
        authRedirectPath="/auth/login"
        roleRedirectPath="/"
      >
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </PermissionRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "orders",
        element: <AdminOrderList />,
      },
      {
        path: "orders/:id",
        element: <AdminOrderDetailPage />,
      },
      {
        path: "orders/:id/edit",
        element: <AdminOrderEdit />,
      },
      {
        path: "drivers",
        element: <DriverPage />,
      },
      {
        path: "drivers/register",
        element: <RegisterDriver />,
      },
      {
        path: "drivers/:id",
        element: <DriverDetail />,
      },
      {
        path: "users",
        element: <div>Quản lý người dùng</div>, // Thay thế bằng component thực tế
      },
      {
        path: "settings",
        element: <div>Cài đặt hệ thống</div>, // Thay thế bằng component thực tế
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "profile/:userId",
        element: <ProfilePage />,
      },
    ],
  },

  // Route cho tài xế - yêu cầu đăng nhập và vai trò driver
  {
    path: "/driver",
    element: (
      <PermissionRoute
        authenticationRequired="authenticated"
        allowedRoles={["driver"]}
        authRedirectPath="/auth/login"
        roleRedirectPath="/"
      >
        <MainLayout>
          <Outlet />
        </MainLayout>
      </PermissionRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <div>Bảng điều khiển tài xế</div>, // Thay thế bằng component thực tế
      },
      {
        path: "deliveries",
        element: <div>Đơn hàng cần giao</div>, // Thay thế bằng component thực tế
      },
      {
        path: "history",
        element: <div>Lịch sử giao hàng</div>, // Thay thế bằng component thực tế
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },

  // Các trang bản đồ - có thể truy cập tự do
  {
    path: "/maps/vietmap",
    element: <VietMapPage />,
  },
  {
    path: "/maps/openmap",
    element: <OpenMapPage />,
  },
  {
    path: "/maps/trackasia",
    element: <TrackAsiaMapPage />,
  },
]);

export default router;
