import React from 'react';
import AddressModal from '../../../components/common/AddressModal';
import type { Address } from '../../../models/Address';

interface AddressFormProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    initialValues: Address | null;
    mode: 'create' | 'edit';
}

const AddressForm: React.FC<AddressFormProps> = ({
    visible,
    onCancel,
    onSuccess,
    initialValues,
    mode
}) => {
    return (
        <AddressModal
            visible={visible}
            onCancel={onCancel}
            onSuccess={onSuccess}
            initialValues={initialValues}
            mode={mode}
            showAddressType={true}
        />
    );
};

export default AddressForm; 