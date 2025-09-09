import React from 'react';
import { Button } from 'antd';

interface StepActionsProps {
    currentStep: number;
    totalSteps: number;
    onPrev: () => void;
    onNext: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const StepActions: React.FC<StepActionsProps> = ({
    currentStep,
    totalSteps,
    onPrev,
    onNext,
    onSubmit,
    isSubmitting
}) => {
    return (
        <div className="flex justify-between mt-8">
            {currentStep > 0 && (
                <Button onClick={onPrev}>
                    Quay lại
                </Button>
            )}
            <div className="flex-grow"></div>
            {currentStep < totalSteps - 1 ? (
                <Button type="primary" onClick={onNext}>
                    Tiếp theo
                </Button>
            ) : (
                <Button type="primary" onClick={onSubmit} loading={isSubmitting}>
                    Tạo đơn hàng
                </Button>
            )}
        </div>
    );
};

export default StepActions; 