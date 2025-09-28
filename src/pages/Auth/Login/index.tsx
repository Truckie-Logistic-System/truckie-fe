import React, { useState, useEffect } from "react";
import { Card, App } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthPageLayout } from "../components";
import { useAuth } from "../../../context";
import axios from "axios";
import LoginForm from "./components/LoginForm";
import SocialLogin from "./components/SocialLogin";

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, getRedirectPath, user } = useAuth();
  const { message: messageApi } = App.useApp();

  // Check if user was redirected from registration
  useEffect(() => {
    const state = location.state as
      | { registered?: boolean; username?: string }
      | undefined;

    // if (state?.registered && state?.username) {
    //   messageApi.success(`Đăng ký thành công! Vui lòng đăng nhập với tài khoản ${state.username}`);
    // }
  }, [location.state, messageApi]);

  // Remove the auto-redirect effect since we'll handle it manually after login success
  // We only want to redirect if the user is already authenticated when first loading the page
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });
    }
  }, []);  // Only run once on component mount

  const handleLoginSubmit = (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true);
    setErrorMessage(null);

    // Call login function
    login(values.username, values.password)
      .then(response => {
        // On successful login, show success message and redirect
        messageApi.success(response.message || "Đăng nhập thành công");

        // Get the redirect path based on user role
        const redirectPath = getRedirectPath();

        // Navigate to the appropriate page
        navigate(redirectPath, { replace: true });
      })
      .catch(error => {
        console.error("Đăng nhập thất bại:", error);

        // Extract error message
        let errorMsg = "Tên đăng nhập hoặc mật khẩu không đúng";

        if (axios.isAxiosError(error)) {
          if (error.response) {
            errorMsg = error.response.data.message || errorMsg;
          } else if (error.request) {
            // No response received
            errorMsg = "Không thể kết nối đến máy chủ";
          }
        } else if (error instanceof Error) {
          errorMsg = error.message;
        }

        setErrorMessage(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGoogleLogin = () => {
    // Implement Google login logic here
    console.log("Đăng nhập với Google được nhấp");
  };

  return (
    <AuthPageLayout>
      <div className="text-center mb-4">
        <Link to="/">
          <span className="text-blue-600 font-bold text-3xl">truckie</span>
        </Link>
      </div>

      <Card className="shadow-md border-0" bodyStyle={{ padding: "24px" }}>
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">Đăng nhập</h1>
          <p className="text-gray-500 text-sm">Chào mừng bạn quay lại!</p>
        </div>

        <LoginForm
          loading={loading}
          onFinish={handleLoginSubmit}
          errorMessage={errorMessage}
          initialUsername={(location.state as any)?.username}
        />

        <SocialLogin
          loading={loading}
          onGoogleLogin={handleGoogleLogin}
        />
      </Card>
    </AuthPageLayout>
  );
};

export default LoginPage;
