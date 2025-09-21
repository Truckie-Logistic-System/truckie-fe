import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface SocialLoginProps {
    loading: boolean;
    onGoogleLogin: () => void;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ loading, onGoogleLogin }) => {
    return (
        <>
            <div className="text-center my-4">hoặc</div>

            <Button
                icon={<GoogleOutlined />}
                className="w-full flex items-center justify-center h-10"
                onClick={onGoogleLogin}
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
        </>
    );
};

export default SocialLogin; 