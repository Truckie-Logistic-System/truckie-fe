import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from '../pages/Home';
import { LoginPage, RegisterPage } from '../pages/Auth';
import MapPage from '../pages/Map';

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
        path: '/map',
        element: <MapPage />,
    }
]);

const AppRoutes = () => {
    return <RouterProvider router={router} />;
};

export default AppRoutes; 