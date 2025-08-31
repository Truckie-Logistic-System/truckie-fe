import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from '../pages/Home';
import { LoginPage, RegisterPage } from '../pages/Auth';
import VietMapPage from '../pages/VietMap';
import OpenMapPage from '../pages/OpenMap';

const router = createBrowserRouter([
    {
        path: '/',
        element: <HomePage />,
    },
    {
        path: '/auth/login',
        element: <LoginPage />,
    },
    {
        path: '/auth/register',
        element: <RegisterPage />,
    },
    {
        path: '/viet-map',
        element: <VietMapPage />,
    },
    {
        path: '/open-map',
        element: <OpenMapPage />,
    }
]);

const AppRoutes = () => {
    return <RouterProvider router={router} />;
};

export default AppRoutes; 