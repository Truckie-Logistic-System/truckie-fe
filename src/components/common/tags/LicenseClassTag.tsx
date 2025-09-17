import React from 'react';
import StatusTag from './StatusTag';
import { LicenseClassEnum, LicenseClassColors, LicenseClassLabels } from '../../../constants/enums';
import { IdcardOutlined } from '@ant-design/icons';

interface LicenseClassTagProps {
    licenseClass: LicenseClassEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị hạng giấy phép lái xe
 */
const LicenseClassTag: React.FC<LicenseClassTagProps> = ({ licenseClass, className, size }) => {
    return (
        <StatusTag
            status={licenseClass}
            colorClass={LicenseClassColors[licenseClass]}
            label={LicenseClassLabels[licenseClass]}
            className={className}
            icon={<IdcardOutlined />}
            size={size}
        />
    );
};

export default LicenseClassTag; 