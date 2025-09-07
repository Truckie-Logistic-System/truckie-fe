import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Card,
  Alert,
  message,
} from "antd";
import {
  GoogleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthPageLayout } from "../components";
import { useAuth } from "../../../context";
import axios from "axios";

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, getRedirectPath, user } = useAuth();

  // Check if user was redirected from registration
  React.useEffect(() => {
    const state = location.state as
      | { registered?: boolean; username?: string }
      | undefined;

    if (state?.registered && state?.username) {
      form.setFieldsValue({ username: state.username });
    }
  }, [location.state, form]);

  // Check if user is already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, getRedirectPath, user]);

  const handleLoginClick = () => {
    // Validate fields manually
    form.validateFields()
      .then(values => {
        setLoading(true);
        setErrorMessage(null);

        // Call login function
        login(values.username, values.password)
          .then(response => {
            // Success is handled by the useEffect that watches isAuthenticated
            message.success(`Đăng nhập thành công! Chào mừng ${response.data.user.username}`);
          })
          .catch(error => {
            console.error("Đăng nhập thất bại:", error);

            // Extract error message
            let errorMsg = "Đã có lỗi xảy ra khi đăng nhập";

            if (axios.isAxiosError(error)) {
              if (error.response) {
                message.error(error.response.data.message);
                errorMsg = error.response.data.message;
              } else if (error.request) {
                // No response received
                errorMsg = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn";
              }
            } else if (error instanceof Error) {
              errorMsg = error.message;
            }

            setErrorMessage(errorMsg);
            message.error("Đăng nhập thất bại");
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch(() => {
        // Form validation failed, do nothing
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoginClick();
    }
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

        {errorMessage && (
          <Alert
            message="Đăng nhập thất bại"
            description={errorMessage}
            type="error"
            showIcon
            closable
            className="mb-4"
            onClose={() => setErrorMessage(null)}
          />
        )}

        <div>
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            initialValues={{ remember: true }}
          >
            <Form.Item
              name="username"
              label={
                <span className="flex items-center">
                  <span className="text-red-500 mr-1">*</span>Tên đăng nhập
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Nhập tên đăng nhập của bạn"
                autoFocus
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="flex items-center">
                  <span className="text-red-500 mr-1">*</span>Mật khẩu
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Nhập mật khẩu"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </Form.Item>

            <div className="flex justify-between items-center mb-4">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox disabled={loading}>Ghi nhớ đăng nhập 30 ngày</Checkbox>
              </Form.Item>
              <Link to="/auth/forgot-password" className="text-blue-600 text-sm">
                Quên mật khẩu
              </Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                className="w-full bg-blue-600 h-10"
                loading={loading}
                onClick={handleLoginClick}
                disabled={loading}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center my-4">hoặc</div>

        <Button
          icon={<GoogleOutlined />}
          className="w-full flex items-center justify-center h-10"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Đăng nhập với Google
        </Button>

        <div className="text-center mt-4">
          <span className="text-gray-500">Chưa có tài khoản? </span>
          <Link to="/auth/register" className="text-blue-600">
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </AuthPageLayout>
  );
};

export default LoginPage;
