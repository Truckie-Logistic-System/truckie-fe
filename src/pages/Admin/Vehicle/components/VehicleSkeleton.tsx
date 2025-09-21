import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';

const VehicleSkeleton: React.FC = () => {
    return (
        <div>
            <Skeleton.Input active style={{ width: '100%', height: 50 }} />
            <div className="mt-4">
                {[...Array(5)].map((_, index) => (
                    <Card key={index} className="mb-4">
                        <Row gutter={16}>
                            <Col span={4}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={4}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={4}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={3}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={3}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={3}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={3}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                        </Row>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default VehicleSkeleton; 