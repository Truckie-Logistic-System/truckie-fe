import React from 'react';
import { Card, Skeleton } from 'antd';

const OrderDetailSkeleton: React.FC = () => {
    return (
        <div className="p-6">
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-6">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                            <Skeleton.Button active size="large" shape="round" className="mr-2" />
                            <Skeleton.Input active size="large" className="bg-opacity-20" style={{ width: 200 }} />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton.Button active size="default" shape="round" />
                            <Skeleton.Button active size="default" shape="round" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Order status skeleton */}
            <div className="max-w-6xl mx-auto px-4">
                <Skeleton active paragraph={{ rows: 1 }} className="mb-6" />

                {/* Order info skeleton */}
                <Card className="mb-6">
                    <Skeleton active paragraph={{ rows: 4 }} />
                </Card>

                {/* Address skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <Skeleton active paragraph={{ rows: 3 }} />
                    </Card>
                    <Card>
                        <Skeleton active paragraph={{ rows: 3 }} />
                    </Card>
                </div>

                {/* Sender info skeleton */}
                <Card className="mb-6">
                    <Skeleton active paragraph={{ rows: 4 }} />
                </Card>

                {/* Order details skeleton */}
                <Card className="mb-6">
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
            </div>
        </div>
    );
};

export default OrderDetailSkeleton; 