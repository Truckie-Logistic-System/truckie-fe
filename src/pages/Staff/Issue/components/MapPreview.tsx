import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import VietMapMap from '@/components/common/VietMapMap';
import vietmapService from '@/services/vietmap/vietmapService';
import type { MapLocation } from '@/models/Map';

const { Text } = Typography;

interface MapPreviewProps {
    latitude: number;
    longitude: number;
    size?: number; // Size for square map
}

const MapPreview: React.FC<MapPreviewProps> = ({ 
    latitude, 
    longitude, 
    size = 250 // Default 250x250px square
}) => {
    const [locationDisplay, setLocationDisplay] = useState<string>('');
    const [mapLocation, setMapLocation] = useState<MapLocation>({
        lat: latitude,
        lng: longitude,
        address: ''
    });

    useEffect(() => {
        const fetchLocationInfo = async () => {
            try {
                const locationData = await vietmapService.reverseGeocode(latitude, longitude);
                if (locationData && locationData.length > 0) {
                    setLocationDisplay(locationData[0].display);
                    setMapLocation({
                        lat: latitude,
                        lng: longitude,
                        address: locationData[0].display
                    });
                }
            } catch (error) {
                console.error('Error fetching location info:', error);
            }
        };

        fetchLocationInfo();
    }, [latitude, longitude]);

    const handleLocationChange = (location: MapLocation) => {
        // Do nothing - this is a preview only
    };

    return (
        <div>
            <div style={{ 
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: 8,
                overflow: 'hidden',
                border: '2px solid #e9ecef',
                margin: '0 auto'
            }}>
                <VietMapMap
                    mapLocation={mapLocation}
                    onLocationChange={handleLocationChange}
                    markers={[mapLocation]}
                    showRouteLines={false}
                />
            </div>
            
            {locationDisplay && (
                <div style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    borderRadius: 6,
                    border: '1px solid #e9ecef'
                }}>
                    <Text style={{ fontSize: 13, color: '#495057' }}>
                        <EnvironmentOutlined style={{ marginRight: 6, color: '#FF4D4F' }} />
                        {locationDisplay}
                    </Text>
                </div>
            )}
        </div>
    );
};

export default MapPreview;
