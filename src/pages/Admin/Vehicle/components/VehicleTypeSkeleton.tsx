import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';

const VehicleTypeSkeleton: React.FC = () => {
    return (
        <div>
            <Skeleton.Input active style={{ width: '100%', height: 40 }} />
            <div className="mt-4">
                {[...Array(3)].map((_, index) => (
                    <Card key={index} className="mb-4">
                        <Row gutter={16}>
                            <Col span={8}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={12}>
                                <Skeleton.Input active style={{ width: '100%' }} />
                            </Col>
                            <Col span={4}>
                                <Row gutter={8}>
                                    <Col span={12}>
                                        <Skeleton.Button active />
                                    </Col>
                                    <Col span={12}>
                                        <Skeleton.Button active />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default VehicleTypeSkeleton; 