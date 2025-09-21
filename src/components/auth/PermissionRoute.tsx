import React from 'react';
import AuthRoute from './AuthRoute';
import RoleBasedRoute from './RoleBasedRoute';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

type RedirectPathFunction = (auth: { user: any; isAuthenticated: boolean }) => string;

interface PermissionRouteProps {
    /**
     * Xác định liệu route này yêu cầu người dùng đã đăng nhập hay chưa đăng nhập
     * - 'authenticated': Yêu cầu người dùng đã đăng nhập
     * - 'unauthenticated': Yêu cầu người dùng chưa đăng nhập
     * - 'any': Không có yêu cầu về trạng thái xác thực
     */
    authenticationRequired: 'authenticated' | 'unauthenticated' | 'any';

    /**
     * Các vai trò được phép truy cập route này
     * Áp dụng cho cả 'authenticated' và 'any'
     */
    allowedRoles?: ('admin' | 'customer' | 'staff' | 'driver')[];

    /**
     * Đường dẫn chuyển hướng khi không đáp ứng yêu cầu xác thực
     */
    authRedirectPath?: string | RedirectPathFunction;

    /**
     * Đường dẫn chuyển hướng khi không đáp ứng yêu cầu về vai trò
     */
    roleRedirectPath?: string | RedirectPathFunction;

    children?: React.ReactNode;
}

/**
 * Component kết hợp kiểm tra cả trạng thái xác thực và vai trò
 */
const PermissionRoute: React.FC<PermissionRouteProps> = ({
    authenticationRequired,
    allowedRoles = [],
    authRedirectPath = authenticationRequired === 'authenticated' ? '/auth/login' : '/',
    roleRedirectPath = '/',
    children
}) => {
    const auth = useAuth();
    const location = useLocation();
    const { user, isAuthenticated } = auth;

    // Kiểm tra nếu authenticationRequired là 'any' và có allowedRoles
    // Trong trường hợp này, chúng ta cần kiểm tra vai trò nếu người dùng đã đăng nhập
    if (authenticationRequired === 'any' && allowedRoles.length > 0 && isAuthenticated) {
        const hasRequiredRole = user && allowedRoles.includes(user.role);

        if (!hasRequiredRole) {
            // Xác định đường dẫn chuyển hướng
            const redirectTo = typeof roleRedirectPath === 'function'
                ? roleRedirectPath(auth)
                : roleRedirectPath;

            // Chuyển hướng đến trang được chỉ định
            return <Navigate to={redirectTo} state={{ from: location }} replace />;
        }
    }

    // Nếu yêu cầu người dùng đã đăng nhập và có chỉ định vai trò
    if (authenticationRequired === 'authenticated' && allowedRoles.length > 0) {
        return (
            <AuthRoute
                authenticationRequired={authenticationRequired}
                redirectPath={authRedirectPath}
            >
                <RoleBasedRoute
                    allowedRoles={allowedRoles}
                    redirectPath={roleRedirectPath}
                >
                    {children}
                </RoleBasedRoute>
            </AuthRoute>
        );
    }

    // Nếu chỉ kiểm tra trạng thái xác thực
    return (
        <AuthRoute
            authenticationRequired={authenticationRequired}
            redirectPath={authRedirectPath}
        >
            {children}
        </AuthRoute>
    );
};

export default PermissionRoute; 