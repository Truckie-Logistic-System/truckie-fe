import React, { useState } from "react";
import { Form, Input, Button, Card, Space, Empty, Divider } from "antd";
import { PlusOutlined, DeleteOutlined, SafetyOutlined } from "@ant-design/icons";
import type { Seal } from "../../../../models/VehicleAssignment";

const { TextArea } = Input;

interface SealAssignmentStepProps {
    onComplete: (seals: Seal[]) => void;
    onBack: () => void;
    initialSeals?: Seal[];
}

const SealAssignmentStep: React.FC<SealAssignmentStepProps> = ({
    onComplete,
    onBack,
    initialSeals = []
}) => {
    const [seals, setSeals] = useState<Seal[]>(
        initialSeals.length > 0 ? initialSeals : [{ sealCode: "", description: "" }]
    );

    const handleAddSeal = () => {
        setSeals([...seals, { sealCode: "", description: "" }]);
    };

    const handleRemoveSeal = (index: number) => {
        const newSeals = seals.filter((_, i) => i !== index);
        setSeals(newSeals);
    };

    const handleSealChange = (index: number, field: keyof Seal, value: string) => {
        const newSeals = [...seals];
        newSeals[index] = { ...newSeals[index], [field]: value };
        setSeals(newSeals);
    };

    const handleSubmit = () => {
        // Filter out empty seals
        const validSeals = seals.filter(
            seal => seal.sealCode.trim() !== "" || seal.description.trim() !== ""
        );
        onComplete(validSeals);
    };

    const handleSkip = () => {
        onComplete([]);
    };

    return (
        <div className="seal-assignment-step">
            <Card
                title={
                    <div className="flex items-center">
                        <SafetyOutlined className="text-xl text-green-500 mr-2" />
                        <span className="text-lg font-medium">Gán Seal cho chuyến hàng</span>
                    </div>
                }
                bordered={false}
                className="shadow-sm"
            >
                <div className="bg-blue-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
                    <p className="text-sm text-blue-700 mb-1">
                        <strong>Lưu ý:</strong> Seal (niêm phong) được sử dụng để đảm bảo an toàn và tính toàn vẹn của hàng hóa trong quá trình vận chuyển.
                    </p>
                    <p className="text-sm text-blue-700">
                        Bạn có thể thêm nhiều seal cho một chuyến hàng.
                    </p>
                </div>

                {seals.length === 0 ? (
                    <Empty
                        description="Chưa có seal nào được thêm"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddSeal}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Thêm Seal
                        </Button>
                    </Empty>
                ) : (
                    <div className="space-y-4">
                        {seals.map((seal, index) => (
                            <Card
                                key={index}
                                size="small"
                                className="bg-gray-50"
                                title={
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            <SafetyOutlined className="mr-2" />
                                            Seal #{index + 1}
                                        </span>
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveSeal(index)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                }
                            >
                                <Form layout="vertical" size="small">
                                    <Form.Item
                                        label="Mã Seal"
                                        required
                                        className="mb-3"
                                    >
                                        <Input
                                            placeholder="Nhập mã seal (VD: SEAL-001)"
                                            value={seal.sealCode}
                                            onChange={(e) =>
                                                handleSealChange(index, "sealCode", e.target.value)
                                            }
                                            prefix={<SafetyOutlined className="text-gray-400" />}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label="Mô tả"
                                        className="mb-0"
                                    >
                                        <TextArea
                                            placeholder="Nhập mô tả về seal (tùy chọn)"
                                            value={seal.description}
                                            onChange={(e) =>
                                                handleSealChange(index, "description", e.target.value)
                                            }
                                            rows={2}
                                        />
                                    </Form.Item>
                                </Form>
                            </Card>
                        ))}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddSeal}
                            block
                            className="mt-4"
                        >
                            Thêm Seal khác
                        </Button>
                    </div>
                )}

                <Divider />

                <div className="flex justify-between mt-4">
                    <Button onClick={onBack}>
                        Quay lại
                    </Button>
                    <Space>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            className="bg-blue-500 hover:bg-blue-600"
                            disabled={seals.length === 0 || seals.every(s => !s.sealCode.trim())}
                        >
                            Hoàn thành
                        </Button>
                    </Space>
                </div>
            </Card>
        </div>
    );
};

export default SealAssignmentStep;
