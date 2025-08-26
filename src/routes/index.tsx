import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "../pages/Home";
import { LoginPage, RegisterPage } from "../pages/Auth";
import { CreateOrder, OrdersList } from "../pages/Orders";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/auth/register",
    element: <RegisterPage />,
  },
  {
    path: "/orders",
    element: <OrdersList />,
  },
  {
    path: "/orders/create",
    element: <CreateOrder />,
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
