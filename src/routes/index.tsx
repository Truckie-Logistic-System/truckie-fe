import { createBrowserRouter, Outlet } from "react-router-dom";
import HomePage from "../pages/Home";
import { LoginPage, RegisterPage, ForgotPasswordPage, FirstTimePasswordChangePage } from "../pages/Auth";
import VerifyOTPPage from "../pages/Auth/VerifyOTP";
import { PaymentReturn } from "../pages/Payment";
import RecipientOrderTracking from "../pages/RecipientTracking";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/Admin/Dashboard";
import PenaltyHistory from "../pages/Staff/PenaltyHistory";
import ProfilePage from "../pages/Profile";
import { OrderList as StaffOrderList } from "../pages/Staff/Order";
import { AdminOrderList, AdminOrderDetailPage } from "../pages/Admin/Order";
import { IssueList, IssueDetail } from "../pages/Staff/Issue";
import {
  OrderPage as AdminOrderListOld,
  OrderEdit as AdminOrderEdit,
} from "../pages/Admin/Order";
import StaffOrderDetailPage from "../pages/Admin/Order/StaffOrderDetailPage";
import OrdersPage from "../pages/Orders";
import CustomerOrderDetailPage from "../pages/Orders/CustomerOrderDetailPage";
import CreateOrder from "../pages/Orders/CreateOrder";
import { PermissionRoute } from "../components/auth";
import { MainLayout, AdminLayout, RootLayout } from "../components/layout";
import ScrollToTop from "../components/common/ScrollToTop";
import StaffNotificationListPage from "../pages/Staff/notifications/NotificationListPage";
import CustomerNotificationListPage from "../pages/customer/notifications/NotificationListPage";
import DriverPage from "../pages/Admin/Driver";
import DriverDetail from "../pages/Admin/Driver/DriverDetail";
import RegisterDriver from "../pages/Admin/Driver/RegisterDriver";
import CustomerPage from "../pages/Admin/Customer";
import CustomerDetail from "../pages/Admin/Customer/CustomerDetail";
import StaffPage from "../pages/Admin/Staff";
import StaffDetail from "../pages/Admin/Staff/StaffDetail";
import StaffRegister from "../pages/Admin/Staff/StaffRegister";
import DeviceManagement from "../pages/Admin/Device";
import CategoryManagement from "../pages/Admin/Category";
import OrderSizeManagement from "../pages/Admin/OrderSizes";
import VehiclePage from "../pages/Admin/Vehicle";
import VehicleDetailPage from "../pages/Admin/Vehicle/VehicleDetail";
import VehicleMaintenancePage from "../pages/Admin/VehicleMaintenance";
import VehicleMaintenanceDetail from "../pages/Admin/VehicleMaintenance/VehicleMaintenanceDetail";
import CreateMaintenance from "../pages/Admin/VehicleMaintenance/CreateMaintenance";
import EditMaintenance from "../pages/Admin/VehicleMaintenance/EditMaintenance";
import AdminVehicleAssignmentPage from "../pages/Admin/VehicleAssignment";
import AdminVehicleAssignmentDetailPage from "../pages/Admin/VehicleAssignment/VehicleAssignmentDetail";
import StaffVehicleAssignmentPage from "../pages/Staff/VehicleAssignment";
import StaffVehicleAssignmentDetailPage from "../pages/Staff/VehicleAssignment/VehicleAssignmentDetail";
import SizeRulePage from "../pages/Admin/SizeRule";
import StipulationSettings from "../pages/Staff/StipulationSettings";
import PricingInfoPage from "../pages/PricingInfo";
import TransactionListPage from "../pages/Staff/Transaction";
import ContractListPage from "../pages/Staff/Contract";
import ContractDetailPage from "../pages/Staff/Contract/ContractDetail";
import RefundListPage from "../pages/Staff/Refund";
import AdminSettingsPage from "../pages/Admin/Settings";
import IssueTypePage from "../pages/Staff/IssueType";
import CompensationAssessmentPage from "../pages/Staff/CompensationAssessment";
import OffRouteEventPage from "../pages/Staff/OffRouteEvent";
import FuelConsumptionPage from "../pages/Admin/FuelConsumption";
import FuelTypePage from "../pages/Admin/FuelType";
import StaffCustomerPage from "../pages/Staff/Customer";

// Định nghĩa các route với bảo vệ dựa trên vai trò và trạng thái xác thực
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
      {
        path: "/auth/forgot-password",
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
            <ForgotPasswordPage />
          </PermissionRoute>
        ),
      },
      {
        path: "/auth/first-time-password",
        element: <FirstTimePasswordChangePage />,
      },
      {
        path: "/auth/verify-otp",
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
            <VerifyOTPPage />
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
          // Trang chủ - chỉ cho phép customer hoặc người chưa đăng nhập
          {
            index: true,
            element: (
              <PermissionRoute
                authenticationRequired="any"
                allowedRoles={["customer"]}
                roleRedirectPath={(auth) => {
                  // Chuyển hướng dựa trên vai trò
                  if (auth?.user?.role === "admin") return "/admin/dashboard";
                  if (auth?.user?.role === "staff") return "/staff/dashboard";
                  if (auth?.user?.role === "driver") return "/driver/dashboard";
                  return "/"; // Mặc định cho customer
                }}
              >
                <HomePage />
              </PermissionRoute>
            ),
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
                <CustomerOrderDetailPage />
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
          {
            path: "notifications",
            element: (
              <PermissionRoute
                authenticationRequired="authenticated"
                allowedRoles={["customer"]}
                authRedirectPath="/auth/login"
                roleRedirectPath="/"
              >
                <CustomerNotificationListPage />
              </PermissionRoute>
            ),
          },
          {
            path: "payment/return",
            element: <PaymentReturn />,
          },
          {
            path: "tracking",
            element: <RecipientOrderTracking />,
          },
          {
            path: "pricing-info",
            element: (
              <PermissionRoute
                authenticationRequired="any"
                allowedRoles={["customer"]}
                roleRedirectPath={(auth) => {
                  if (auth?.user?.role === "admin") return "/admin/dashboard";
                  if (auth?.user?.role === "staff") return "/staff/dashboard";
                  if (auth?.user?.role === "driver") return "/driver/dashboard";
                  return "/pricing-info";
                }}
              >
                <PricingInfoPage />
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
            path: "customers",
            element: <StaffCustomerPage />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
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
          // Staff: Quản lý loại sự cố
          {
            path: "issue-types",
            element: <IssueTypePage />,
          },
          // Staff: Danh sách thẩm định bồi thường
          {
            path: "compensation-assessments",
            element: <CompensationAssessmentPage />,
          },
          // Staff: Danh sách cảnh báo lệch tuyến
          {
            path: "off-route-events",
            element: <OffRouteEventPage />,
          },
          {
            path: "vehicle-assignments",
            element: <StaffVehicleAssignmentPage />,
          },
          {
            path: "vehicle-assignments/:id",
            element: <StaffVehicleAssignmentDetailPage />,
          },
          {
            path: "stipulation-settings",
            element: <StipulationSettings />,
          },
          // Staff: Quản lý phương tiện
          {
            path: "vehicles",
            element: <VehiclePage />,
          },
          {
            path: "vehicles/:id",
            element: <VehicleDetailPage />,
          },
          // Staff: Quản lý bảo trì
          {
            path: "vehicle-maintenances",
            element: <VehicleMaintenancePage />,
          },
          {
            path: "vehicle-maintenances/:id",
            element: <VehicleMaintenanceDetail />,
          },
          {
            path: "vehicle-maintenances/create",
            element: <CreateMaintenance />,
          },
          {
            path: "vehicle-maintenances/edit/:id",
            element: <EditMaintenance />,
          },
          // Staff: Quản lý thiết bị
          {
            path: "devices",
            element: <DeviceManagement />,
          },
          // Staff: Quản lý bảng giá
          {
            path: "vehicle-rules",
            element: <SizeRulePage />,
          },
          // Staff: Quản lý loại hàng
          {
            path: "categories",
            element: <CategoryManagement />,
          },
          // Staff: Quản lý kích thước kiện hàng
          {
            path: "order-sizes",
            element: <OrderSizeManagement />,
          },
          // Staff: Quản lý hợp đồng
          {
            path: "contracts",
            element: <ContractListPage />,
          },
          {
            path: "contracts/:id",
            element: <ContractDetailPage />,
          },
          // Staff: Quản lý giao dịch
          {
            path: "transactions",
            element: <TransactionListPage />,
          },
          // Staff: Quản lý hoàn tiền
          {
            path: "refunds",
            element: <RefundListPage />,
          },
          {
            path: "reports",
            element: <div>Báo cáo</div>, // Thay thế bằng component thực tế
          },
          {
            path: "notifications",
            element: <StaffNotificationListPage />,
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
            path: "customers",
            element: <CustomerPage />,
          },
          {
            path: "customers/:id",
            element: <CustomerDetail />,
          },
          {
            path: "staff",
            element: <StaffPage />,
          },
          {
            path: "staff/register",
            element: <StaffRegister />,
          },
          {
            path: "staff/:id",
            element: <StaffDetail />,
          },
          {
            path: "devices",
            element: <DeviceManagement />,
          },
          {
            path: "vehicles",
            element: <VehiclePage />,
          },
          {
            path: "vehicles/:id",
            element: <VehicleDetailPage />,
          },
          {
            path: "vehicle-assignments",
            element: <AdminVehicleAssignmentPage />,
          },
          {
            path: "vehicle-assignments/:id",
            element: <AdminVehicleAssignmentDetailPage />,
          },
          {
            path: "vehicle-maintenances",
            element: <VehicleMaintenancePage />,
          },
          {
            path: "vehicle-maintenances/:id",
            element: <VehicleMaintenanceDetail />,
          },
          {
            path: "vehicle-maintenances/create",
            element: <CreateMaintenance />,
          },
          {
            path: "vehicle-maintenances/edit/:id",
            element: <EditMaintenance />,
          },
          {
            path: "vehicle-rules",
            element: <SizeRulePage />,
          },
          {
            path: "categories",
            element: <CategoryManagement />,
          },
          // Admin: Quản lý tiêu thụ nhiên liệu
          {
            path: "fuel-consumptions",
            element: <FuelConsumptionPage />,
          },
          // Admin: Quản lý loại nhiên liệu
          {
            path: "fuel-types",
            element: <FuelTypePage />,
          },
          {
            path: "settings",
            element: <AdminSettingsPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "profile/:userId",
            element: <ProfilePage />,
          },
          {
            path: "penalties",
            element: <PenaltyHistory />,
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
    ],
  },
]);

export default router;
