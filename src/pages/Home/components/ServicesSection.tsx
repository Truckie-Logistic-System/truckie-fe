import React from 'react';
import { Card, Row, Col } from 'antd';
import service1 from '../../../assets/images/home-page/service1.jpg';
import service2 from '../../../assets/images/home-page/service2.jpg';
import service3 from '../../../assets/images/home-page/service3.jpg';

interface ServicesSectionProps { }

const ServicesSection: React.FC<ServicesSectionProps> = () => {
    const services = [
        {
            image: service1,
            title: "Giao nhận vận chuyển",
            description: "Chúng tôi xử lý tất cả các hoạt động logistics từ điểm xuất phát đến điểm đến, đảm bảo giao hàng đúng hẹn."
        },
        {
            image: service2,
            title: "Kho bãi",
            description: "Giải pháp lưu trữ an toàn với hệ thống quản lý kho hàng tiên tiến."
        },
        {
            image: service3,
            title: "Giao hàng chặng cuối",
            description: "Giao hàng nhanh chóng và đáng tin cậy đến khách hàng của bạn với theo dõi thời gian thực."
        }
    ];

    return (
        <div className="py-16">
            <div className="container mx-auto px-4">
                <div className="mb-2">
                    <p className="text-blue-600 uppercase font-medium text-sm">Dịch vụ của chúng tôi</p>
                </div>

                <h2 className="text-3xl font-bold mb-8">
                    Cách chúng tôi mang đến sự xuất sắc trong logistics
                </h2>

                <Row gutter={[24, 24]}>
                    {services.map((service, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                            <Card
                                className="h-full"
                                cover={
                                    <div
                                        className="h-48 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${service.image})` }}
                                    />
                                }
                            >
                                <div className="mb-2">
                                    <span className="text-blue-600 font-medium">Dịch vụ {index + 1}</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                                <p className="text-gray-600">{service.description}</p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default ServicesSection;