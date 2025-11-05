import React from "react";
import { Steps } from "antd";
import { CarOutlined, EnvironmentOutlined, LockOutlined } from "@ant-design/icons";

interface SubStepIndicatorProps {
    currentSubStep: number;
}

export const SubStepIndicator: React.FC<SubStepIndicatorProps> = ({ currentSubStep }) => {
    return (
        <div className="mb-6">
            <Steps
                current={currentSubStep - 1}
                size="small"
                items={[
                    {
                        title: "Phân công",
                        icon: <CarOutlined />,
                        description: "Chọn xe và tài xế"
                    },
                    {
                        title: "Định tuyến",
                        icon: <EnvironmentOutlined />,
                        description: "Lập lộ trình"
                    },
                    {
                        title: "Gán seal",
                        icon: <LockOutlined />,
                        description: "Gán mã bảo mật"
                    }
                ]}
                className="[&_.ant-steps-item-title]:font-medium [&_.ant-steps-item-description]:text-xs"
            />
        </div>
    );
};
