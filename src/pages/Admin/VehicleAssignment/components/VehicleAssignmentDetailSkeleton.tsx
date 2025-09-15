import React from 'react';
import { Skeleton, Card, Row, Col, Divider } from 'antd';

/**
 * Component hiển thị skeleton loading cho trang chi tiết phân công xe
 */
const VehicleAssignmentDetailSkeleton: React.FC = () => {
    return (
        <div className="vehicle-assignment-detail-skeleton">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="flex items-center mb-2">
                    <Skeleton.Avatar active size={24} className="mr-2" />
                    <Skeleton.Input active style={{ width: 300, height: 32 }} />
                </div>
                <Skeleton.Input active style={{ width: 500, height: 16 }} />
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Column - Basic Info */}
                <Col xs={24} lg={8}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow mb-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Skeleton.Avatar active size={120} className="mb-4" />
                            <Skeleton.Input active style={{ width: 200, height: 24 }} className="mb-2" />
                            <Skeleton.Input active style={{ width: 100, height: 24 }} />
                        </div>

                        <div className="mb-6">
                            {Array(4).fill(null).map((_, index) => (
                                <div key={index} className="flex items-center mb-3">
                                    <Skeleton.Avatar active size={24} className="mr-3" />
                                    <div>
                                        <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                        <Skeleton.Input active style={{ width: 150, height: 16 }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <div className="flex flex-col gap-2">
                                <Skeleton.Button active block style={{ height: 32 }} />
                                <Skeleton.Button active block style={{ height: 32 }} />
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Details */}
                <Col xs={24} lg={16}>
                    {/* Assignment Details */}
                    <Card title={<Skeleton.Input active style={{ width: 150, height: 24 }} />} className="shadow-sm mb-6">
                        <div className="mb-4">
                            {Array(3).fill(null).map((_, index) => (
                                <div key={index} className="mb-4">
                                    <Row gutter={[16, 16]}>
                                        <Col span={8}>
                                            <Skeleton.Input active style={{ width: '100%', height: 24 }} />
                                        </Col>
                                        <Col span={16}>
                                            <Skeleton.Input active style={{ width: '100%', height: 24 }} />
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Vehicle Info */}
                    <Card title={<Skeleton.Input active style={{ width: 150, height: 24 }} />} className="shadow-sm mb-6">
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <div className="mb-4">
                                    <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                                    <Skeleton.Input active style={{ width: '100%', height: 24 }} />
                                </div>
                            </Col>
                            <Col span={12}>
                                <div className="mb-4">
                                    <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                                    <Skeleton.Input active style={{ width: '100%', height: 24 }} />
                                </div>
                            </Col>
                            <Col span={12}>
                                <div className="mb-4">
                                    <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                                    <Skeleton.Input active style={{ width: '100%', height: 24 }} />
                                </div>
                            </Col>
                            <Col span={12}>
                                <div className="mb-4">
                                    <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                                    <Skeleton.Input active style={{ width: '100%', height: 24 }} />
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Driver Info */}
                    <Card title={<Skeleton.Input active style={{ width: 150, height: 24 }} />} className="shadow-sm mb-6">
                        <Divider orientation="left">
                            <Skeleton.Input active style={{ width: 120, height: 16 }} />
                        </Divider>

                        <div className="mb-4">
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <div className="flex items-center">
                                        <Skeleton.Avatar active size={64} className="mr-4" />
                                        <div>
                                            <Skeleton.Input active style={{ width: 120, height: 20 }} className="mb-2" />
                                            <Skeleton.Input active style={{ width: 80, height: 16 }} />
                                        </div>
                                    </div>
                                </Col>
                                <Col span={16}>
                                    <Row gutter={[16, 16]}>
                                        <Col span={12}>
                                            <div className="mb-2">
                                                <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                                <Skeleton.Input active style={{ width: '100%', height: 16 }} />
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="mb-2">
                                                <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                                <Skeleton.Input active style={{ width: '100%', height: 16 }} />
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="mb-2">
                                                <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                                <Skeleton.Input active style={{ width: '100%', height: 16 }} />
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="mb-2">
                                                <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                                <Skeleton.Input active style={{ width: '100%', height: 16 }} />
                                            </div>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </div>

                        {/* Second Driver (Optional) */}
                        <Divider orientation="left">
                            <Skeleton.Input active style={{ width: 120, height: 16 }} />
                        </Divider>

                        <div className="mb-4">
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <div className="flex items-center">
                                        <Skeleton.Avatar active size={64} className="mr-4" />
                                        <div>
                                            <Skeleton.Input active style={{ width: 120, height: 20 }} className="mb-2" />
                                            <Skeleton.Input active style={{ width: 80, height: 16 }} />
                                        </div>
                                    </div>
                                </Col>
                                <Col span={16}>
                                    <Row gutter={[16, 16]}>
                                        <Col span={12}>
                                            <div className="mb-2">
                                                <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                                <Skeleton.Input active style={{ width: '100%', height: 16 }} />
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="mb-2">
                                                <Skeleton.Input active style={{ width: 80, height: 14 }} className="mb-1" />
                                                <Skeleton.Input active style={{ width: '100%', height: 16 }} />
                                            </div>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default VehicleAssignmentDetailSkeleton; 