import React, { useEffect, useState } from 'react';
import { Modal, Spin, Alert, Space, Typography } from 'antd';
import { EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
import vietmapService from '@/services/vietmap/vietmapService';

const { Text } = Typography;

interface LocationMapModalProps {
    visible: boolean;
    onClose: () => void;
    latitude: number;
    longitude: number;
    title?: string;
}

interface LocationInfo {
    display: string;
    name: string;
    address: string;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
    visible,
    onClose,
    latitude,
    longitude,
    title = 'Vị trí sự cố'
}) => {
    const [loading, setLoading] = useState(false);
    const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && latitude && longitude) {
            fetchLocationInfo();
        }
    }, [visible, latitude, longitude]);

    const fetchLocationInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await vietmapService.reverseGeocode(latitude, longitude);
            if (response && response.length > 0) {
                const location = response[0];
                setLocationInfo({
                    display: location.display,
                    name: location.name,
                    address: location.address
                });
            }
        } catch (err) {
            console.error('Error fetching location info:', err);
            setError('Không thể tải thông tin địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    const mapUrl = `https://maps.vietmap.vn/api/map?apikey=${import.meta.env.VITE_VIETMAP_API_KEY}&center=${longitude},${latitude}&zoom=16&marker=icon:https://vietmap.vn/wp-content/uploads/2023/09/default-marker.png|${longitude},${latitude}`;

    return (
        <Modal
            title={
                <Space>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <span>{title}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            style={{ top: 20 }}
        >
            {/* Location Info Card */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin tip="Đang tải thông tin địa chỉ..." />
                </div>
            ) : error ? (
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            ) : locationInfo ? (
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: 'white'
                }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                            <HomeOutlined style={{ fontSize: 18 }} />
                            <Text strong style={{ color: 'white', fontSize: 16 }}>
                                {locationInfo.name}
                            </Text>
                        </Space>
                        <div style={{ paddingLeft: 26 }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {locationInfo.address}
                            </Text>
                        </div>
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            padding: '8px 12px', 
                            borderRadius: '4px',
                            marginTop: '8px'
                        }}>
                            <Text style={{ color: 'white', fontSize: 13 }}>
                                📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                            </Text>
                        </div>
                    </Space>
                </div>
            ) : null}

            {/* Map */}
            <div style={{ 
                width: '100%', 
                height: '500px', 
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid #e9ecef'
            }}>
                <iframe
                    src={mapUrl}
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none' 
                    }}
                    title="Location Map"
                />
            </div>

            {/* Coordinates Info */}
            <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        <strong>Tọa độ:</strong>
                    </Text>
                    <Space split="|">
                        <Text style={{ fontSize: 13 }}>
                            Vĩ độ: <strong>{latitude}</strong>
                        </Text>
                        <Text style={{ fontSize: 13 }}>
                            Kinh độ: <strong>{longitude}</strong>
                        </Text>
                    </Space>
                </Space>
            </div>
        </Modal>
    );
};

export default LocationMapModal;
