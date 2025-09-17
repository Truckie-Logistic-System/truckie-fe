import React from 'react';
import { Skeleton, Card, Row, Col, Space } from 'antd';

/**
 * Component hiển thị skeleton loading cho trang quản lý phân công xe
 */
const VehicleAssignmentSkeleton: React.FC = () => {
    return (
        <div className="vehicle-assignment-skeleton">
            {/* Header Skeleton */}
            <div className="mb-6">
                <Skeleton.Input active style={{ width: 300, height: 32 }} className="mb-2" />
                <Skeleton.Input active style={{ width: 500, height: 16 }} />
            </div>

            {/* Stats Cards Skeleton */}
            <Row gutter={[16, 16]} className="mb-6">
                {[1, 2, 3].map((item) => (
                    <Col xs={24} sm={8} key={item}>
                        <Card className="h-full" bodyStyle={{ padding: '16px' }}>
                            <div className="flex justify-between">
                                <div>
                                    <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                                    <Skeleton.Input active style={{ width: 60, height: 24 }} />
                                </div>
                                <Skeleton.Avatar active size={40} shape="circle" />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Search and Filter Skeleton */}
            <Card className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <Skeleton.Input active style={{ width: 200, height: 24 }} className="mb-4 md:mb-0" />
                    <div className="flex w-full md:w-auto gap-2">
                        <Skeleton.Input active style={{ width: 200, height: 32 }} />
                        <Skeleton.Button active style={{ width: 100, height: 32 }} />
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="overflow-x-auto">
                    <div className="mb-4">
                        <Skeleton.Input active block style={{ height: 40 }} />
                    </div>

                    {Array(5).fill(null).map((_, index) => (
                        <div key={index} className="mb-4">
                            <Skeleton.Input active block style={{ height: 60 }} />
                        </div>
                    ))}

                    <div className="flex justify-end mt-4">
                        <Skeleton.Input active style={{ width: 300, height: 32 }} />
                    </div>
                </div>
            </Card>

            {/* Form Modal Skeleton */}
            <div className="hidden">
                <Card>
                    <Skeleton.Input active style={{ width: 200, height: 24 }} className="mb-4" />

                    <div className="mb-4">
                        <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                        <Skeleton.Input active block style={{ height: 32 }} />
                    </div>

                    <div className="mb-4">
                        <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                        <Skeleton.Input active block style={{ height: 32 }} />
                    </div>

                    <div className="mb-4">
                        <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                        <Skeleton.Input active block style={{ height: 32 }} />
                    </div>

                    <div className="mb-4">
                        <Skeleton.Input active style={{ width: 120, height: 16 }} className="mb-2" />
                        <Skeleton.Input active block style={{ height: 80 }} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Skeleton.Button active style={{ width: 80, height: 32 }} />
                        <Skeleton.Button active style={{ width: 80, height: 32 }} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default VehicleAssignmentSkeleton; 