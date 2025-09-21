import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { CheckCircleFilled } from '@ant-design/icons';

interface OrderCreationSuccessProps {
    orderId: string;
    orderCode?: string;
}

const OrderCreationSuccess: React.FC<OrderCreationSuccessProps> = ({ orderId, orderCode }) => {
    return (
        <Result
            icon={<CheckCircleFilled className="text-green-500 text-6xl" />}
            title="Đơn hàng đã được tạo thành công!"
            subTitle={
                <div className="text-center">
                    {orderCode && <p className="text-lg mb-2">Mã đơn hàng: <span className="font-bold">{orderCode}</span></p>}
                    <p className="text-gray-500">Đơn hàng của bạn đã được tạo và đang chờ xử lý.</p>
                </div>
            }
            extra={[
                <Link to={`/orders/${orderId}`} key="view">
                    <Button type="primary" size="large">
                        Xem chi tiết đơn hàng
                    </Button>
                </Link>,
                <Link to="/orders" key="list">
                    <Button size="large">
                        Xem danh sách đơn hàng
                    </Button>
                </Link>,
                <Link to="/orders/create" key="create-another">
                    <Button type="link">
                        Tạo đơn hàng khác
                    </Button>
                </Link>
            ]}
        />
    );
};

export default OrderCreationSuccess; 