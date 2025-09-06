import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Card,
  Alert,
  Spin,
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

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, getRedirectPath, user } =
    useAuth();

  // Kiểm tra nếu người dùng vừa đăng ký thành công
  useEffect(() => {
    const state = location.state as
      | { registered?: boolean; username?: string }
      | undefined;

    if (state?.registered && state?.username) {
      form.setFieldsValue({ username: state.username });
      // Không hiển thị thông báo trùng lặp vì đã hiển thị ở trang đăng ký
    }
  }, [location.state, form]);

  // Nếu đã đăng nhập, chuyển hướng đến trang phù hợp với vai trò
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      const redirectPath = getRedirectPath();
      message.success(`Đăng nhập thành công! Chào mừng ${user.username}`);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, getRedirectPath, user]);

  const onFinish = async (values: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      message.loading({
        content: "Đang đăng nhập...",
        key: "login",
        duration: 0,
      });

      await login(values.username, values.password);
      message.success({ content: "Đăng nhập thành công!", key: "login" });

      // Redirect sẽ được xử lý bởi useEffect khi isAuthenticated thay đổi
    } catch (error: any) {
      console.error("Đăng nhập thất bại:", error);
      message.error({ content: "Đăng nhập thất bại", key: "login" });

      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        // Lỗi từ server
        const status = error.response.status;
        if (status === 401) {
          setErrorMessage("Tên đăng nhập hoặc mật khẩu không đúng");
        } else if (status === 403) {
          setErrorMessage("Tài khoản của bạn đã bị khóa");
        } else if (status === 429) {
          setErrorMessage("Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau");
        } else {
          setErrorMessage(
            `Lỗi đăng nhập: ${
              error.response.data?.message || "Đã có lỗi xảy ra"
            }`
          );
        }
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        setErrorMessage(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn"
        );
      } else {
        // Lỗi khác
        setErrorMessage(error.message || "Đã có lỗi xảy ra khi đăng nhập");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google login logic here
    console.log("Đăng nhập với Google được nhấp");
  };

  if (isLoading) {
    return (
      <AuthPageLayout>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Đang tải..." />
        </div>
      </AuthPageLayout>
    );
  }

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
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
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
            />
          </Form.Item>

          <div className="flex justify-between items-center mb-4">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập 30 ngày</Checkbox>
            </Form.Item>
            <Link to="/auth/forgot-password" className="text-blue-600 text-sm">
              Quên mật khẩu
            </Link>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 h-10"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center my-4">hoặc</div>

        <Button
          icon={<GoogleOutlined />}
          className="w-full flex items-center justify-center h-10"
          onClick={handleGoogleLogin}
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
