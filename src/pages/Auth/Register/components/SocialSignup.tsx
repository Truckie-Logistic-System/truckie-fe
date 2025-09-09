import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface SocialSignupProps {
    loading: boolean;
    onGoogleSignup: () => void;
}

const SocialSignup: React.FC<SocialSignupProps> = ({ loading, onGoogleSignup }) => {
    return (
        <>
            <div className="text-center my-4">hoặc</div>

            <Button
                icon={<GoogleOutlined />}
                className="w-full flex items-center justify-center h-10"
                onClick={onGoogleSignup}
                disabled={loading}
            >
                Đăng ký với Google
            </Button>

            <div className="text-center mt-4">
                <span className="text-gray-500">Đã có tài khoản? </span>
                <Link to="/auth/login" className="text-blue-600">
                    Đăng nhập ngay
                </Link>
            </div>
        </>
    );
};

export default SocialSignup; 