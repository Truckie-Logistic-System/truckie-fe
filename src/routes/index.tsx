import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import HomePage from "../pages/Home";
import { LoginPage, RegisterPage } from "../pages/Auth";
import VietMapPage from "../pages/VietMap";
import OpenMapPage from "../pages/OpenMap";
import TrackAsiaMapPage from "../pages/TrackAsiaMap";
import Dashboard, { AdminDashboard, StaffDashboard } from "../pages/Dashboard";
import PenaltyHistory from "../pages/Staff/PenaltyHistory";
import CustomerSupport from "../pages/Staff/CustomerSupport";
import {
  OrderList as StaffOrderList,
  OrderDetailPage,
} from "../pages/Staff/Order";
import { IssueList, IssueDetail } from "../pages/Staff/Issue";
import {
  OrderList as AdminOrderList,
  OrderDetailPage as AdminOrderDetailPage,
  OrderEdit as AdminOrderEdit,
} from "../pages/Admin/Order";
import { OrdersList, CreateOrder } from "../pages/Orders";
import { PermissionRoute } from "../components/auth";
import { MainLayout, AdminLayout } from "../components/layout";

// Định nghĩa các route với bảo vệ dựa trên vai trò và trạng thái xác thực
const router = createBrowserRouter([
  // Trang chủ - ai cũng có thể truy cập
  {
    path: "/",
    element: (
      <MainLayout>
        <HomePage />
      </MainLayout>
    ),
  },

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

  // Route cho khách hàng - yêu cầu đăng nhập và vai trò customer
  {
    path: "/customer",
    element: (
      <PermissionRoute
        authenticationRequired="authenticated"
        allowedRoles={["customer"]}
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
        element: <Dashboard />,
      },
      {
        path: "orders",
        element: <OrdersList />,
      },
      {
        path: "orders/:id",
        element: <OrderDetailPage />,
      },
      {
        path: "create-order",
        element: <CreateOrder />,
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
        element: <OrderDetailPage />,
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
        path: "users",
        element: <div>Quản lý người dùng</div>, // Thay thế bằng component thực tế
      },
      {
        path: "drivers",
        element: <div>Quản lý tài xế</div>, // Thay thế bằng component thực tế
      },
      {
        path: "staff",
        element: <div>Quản lý nhân viên</div>, // Thay thế bằng component thực tế
      },
      {
        path: "reports",
        element: <div>Báo cáo thống kê</div>, // Thay thế bằng component thực tế
      },
      {
        path: "settings",
        element: <div>Cài đặt hệ thống</div>, // Thay thế bằng component thực tế
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
        element: <Dashboard />,
      },
      {
        path: "deliveries",
        element: <div>Driver Deliveries</div>, // Thay thế bằng component thực tế
      },
    ],
  },

  // Các route bản đồ - yêu cầu đăng nhập (không kiểm tra vai trò)
  // {
  //     path: '/viet-map',
  //     element: (
  //         <PermissionRoute authenticationRequired="authenticated">
  //             <VietMapPage />
  //         </PermissionRoute>
  //     ),
  // },
  // {
  //     path: '/open-map',
  //     element: (
  //         <PermissionRoute authenticationRequired="authenticated">
  //             <OpenMapPage />
  //         </PermissionRoute>
  //     ),
  // },
  {
    path: "/trackasia-map",
    element: (
      <PermissionRoute authenticationRequired="authenticated">
        <TrackAsiaMapPage />
      </PermissionRoute>
    ),
  },

  // Route mặc định khi không tìm thấy trang
  {
    path: "*",
    element: (
      <MainLayout>
        <div>Không tìm thấy trang</div>
      </MainLayout>
    ), // Thay thế bằng component 404 thực tế
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
