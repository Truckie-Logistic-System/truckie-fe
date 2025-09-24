import React, { useState, useEffect, useRef } from "react";
import { AutoComplete, Typography, Spin, Empty, Tag } from "antd";
import { UserOutlined, PhoneOutlined, ClockCircleOutlined } from "@ant-design/icons";
import orderService from "@/services/order/orderService";
import type { RecentReceiverSuggestion } from "@/services/order/types";
import dayjs from "dayjs";

const { Text } = Typography;

interface ReceiverSuggestionsProps {
    onSelect: (orderId: string, displayText: string) => void;
}

const ReceiverSuggestions: React.FC<ReceiverSuggestionsProps> = ({ onSelect }) => {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<RecentReceiverSuggestion[]>([]);
    const [searchText, setSearchText] = useState("");
    const [selectedValue, setSelectedValue] = useState("");
    const autoCompleteRef = useRef<any>(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const response = await orderService.getRecentReceivers();
                if (response.success) {
                    setSuggestions(response.data);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    const filteredSuggestions = suggestions.filter(
        (suggestion) =>
            suggestion.receiverName.toLowerCase().includes(searchText.toLowerCase()) ||
            suggestion.receiverPhone.includes(searchText) ||
            suggestion.partialAddress.toLowerCase().includes(searchText.toLowerCase())
    );

    // Format thông tin người nhận để hiển thị
    const formatReceiverInfo = (suggestion: RecentReceiverSuggestion) => {
        return `${suggestion.receiverName} - ${suggestion.receiverPhone}`;
    };

    const handleSelect = (value: string, option: any) => {
        const suggestion = suggestions.find(s => s.orderId === value);
        if (suggestion) {
            const displayText = formatReceiverInfo(suggestion);
            setSelectedValue(displayText);
            onSelect(value, displayText);

            // Cập nhật giá trị hiển thị trong input
            if (autoCompleteRef.current) {
                setTimeout(() => {
                    const input = autoCompleteRef.current.input;
                    if (input) {
                        input.value = displayText;
                    }
                }, 0);
            }
        }
    };

    // Xử lý khi giá trị thay đổi
    const handleChange = (value: string) => {
        if (!value) {
            setSelectedValue("");
        }
    };

    const renderOption = (suggestion: RecentReceiverSuggestion) => ({
        value: suggestion.orderId,
        label: (
            <div className="flex flex-col gap-1 py-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserOutlined />
                        <Text strong>{suggestion.receiverName}</Text>
                    </div>
                    <Tag color="blue" className="text-xs">
                        <ClockCircleOutlined className="mr-1" />
                        {dayjs(suggestion.orderDate).format("DD/MM/YYYY")}
                    </Tag>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <PhoneOutlined />
                    <Text>{suggestion.receiverPhone}</Text>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <Text className="text-xs">CMND/CCCD: {suggestion.receiverIdentity}</Text>
                </div>
                <Text className="text-gray-500 text-sm truncate">
                    {suggestion.partialAddress}
                </Text>
            </div>
        ),
        // Thêm thông tin hiển thị để sử dụng sau khi chọn
        displayText: formatReceiverInfo(suggestion)
    });

    return (
        <div className="mb-4">
            <AutoComplete
                ref={autoCompleteRef}
                className="w-full"
                options={filteredSuggestions.map(renderOption)}
                onSelect={handleSelect}
                onChange={handleChange}
                onSearch={setSearchText}
                value={selectedValue}
                placeholder="Tìm kiếm người nhận gần đây..."
                notFoundContent={
                    loading ? (
                        <div className="p-4 flex justify-center">
                            <Spin size="small" />
                        </div>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Không tìm thấy người nhận nào"
                            className="py-2"
                        />
                    )
                }
            />
        </div>
    );
};

export default ReceiverSuggestions; 