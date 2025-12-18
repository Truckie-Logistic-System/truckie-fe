import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Steps, Card, Typography, App, Skeleton } from "antd";
import { useOrderCreation } from "@/hooks";
import { getDefaultWeightUnit } from "../../config/weightUnits";
import type { OrderCreateRequest } from "../../models/Order";
import { OrderDetailFormList, StipulationModal, InsuranceSelectionCard } from "./components";
import OrderCreationSuccess from "./components/OrderCreationSuccess";
import { formatToVietnamTime } from "../../utils/dateUtils";
import { calculateTotalWeight } from "../../utils/weightUtils";
import dayjs from "dayjs";
import {
  ReceiverAndAddressStep,
  OrderSummaryStep,
  StepActions,
} from "./components/CreateOrderSteps";

// Steps.Step deprecated in v6, use items prop instead
const { Title, Text } = Typography;

export default function CreateOrder() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { addresses, orderSizes, categories, loading, error, createOrder, refetchAddresses } = useOrderCreation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<any>({
    orderDetailsList: [{ quantity: 1, unit: "Kí" }], // Initialize with one default item
    hasInsurance: true, // Default to insurance selected
  });
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    orderCode: string;
  } | null>(null);
  const [showStipulationModal, setShowStipulationModal] = useState(false);

  const [form] = Form.useForm();

  // Reset createdOrder state when component mounts (for navigation back from success page)
  useEffect(() => {
    setCreatedOrder(null);
    setCurrentStep(0);
  }, []);

  // Function to reset form and state for retry
  const handleRetry = () => {
    form.resetFields();
    setCurrentStep(0);
    setCreatedOrder(null);
    setFormValues({});
  };

  // Helper function to get field display name in Vietnamese
  const getFieldDisplayName = (fieldName: any): string => {
    if (Array.isArray(fieldName)) {
      // Handle Form.List fields like ['orderDetailsList', 0, 'description']
      const fieldPath = fieldName[fieldName.length - 1]; // Get the last element (actual field name)
      const itemIndex = fieldName[1] + 1; // Get the item index (0-based + 1)

      const fieldNames: { [key: string]: string } = {
        'description': 'Mô tả chi tiết kiện hàng',
        'quantity': 'Số lượng',
        'weight': 'Trọng lượng',
        'orderSizeId': 'Kích thước',
        'unit': 'Đơn vị',
        'declaredValue': 'Giá trị khai báo'
      };

      return `${fieldNames[fieldPath] || fieldPath} (kiện ${itemIndex})`;
    } else {
      // Handle regular fields
      const fieldNames: { [key: string]: string } = {
        'categoryId': 'Loại hàng hóa',
        'receiverName': 'Tên người nhận',
        'receiverPhone': 'Số điện thoại người nhận',
        'receiverIdentity': 'CMND/CCCD người nhận',
        'pickupAddressId': 'Địa chỉ lấy hàng',
        'deliveryAddressId': 'Địa chỉ giao hàng',
        'packageDescription': 'Mô tả đơn hàng',
        'estimateStartTime': 'Thời gian lấy hàng dự kiến'
      };

      return fieldNames[fieldName] || fieldName;
    }
  };

  // Cập nhật giá trị form từ state khi component mount
  useEffect(() => {
    form.setFieldsValue(formValues);
  }, [form, formValues]);

  // Tự động lưu dữ liệu form khi có thay đổi
  const handleFormChange = () => {
    const currentValues = form.getFieldsValue(true);
    setFormValues((prev: any) => ({ ...prev, ...currentValues }));
  };

  // Initialize formValues with default weight unit
  useEffect(() => {
    const defaultUnit = getDefaultWeightUnit();
    if (!formValues.orderDetailsList[0]?.unit) {
      setFormValues((prev: any) => ({
        ...prev,
        orderDetailsList: [{ quantity: 1, unit: defaultUnit }],
      }));
    }
  }, []);

  // Cập nhật form với giá trị đã lưu khi chuyển step
  useEffect(() => {
    if (formValues && Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [currentStep, formValues, form]);

  // Refresh addresses after creating/updating
  const refreshAddresses = async () => {
    await refetchAddresses();
  };

  // Handle receiver details loaded from suggestion
  const handleReceiverDetailsLoaded = (data: any) => {
    form.setFieldsValue({
      pickupAddressId: data.pickupAddressId,
      deliveryAddressId: data.deliveryAddressId,
    });
  };

  const next = async () => {
    try {
      // Define required fields for each step
      const stepFields = {
        0: ['categoryId'], // Step 0: Package info - category is required (other fields are in Form.List with their own validation)
        1: ['receiverName', 'receiverPhone', 'receiverIdentity', 'pickupAddressId', 'deliveryAddressId', 'packageDescription'], // Step 1: Receiver and address info
        2: ['estimateStartTime'], // Step 2: Shipping info - delivery time is required
      };

      // Validate only fields for current step
      const fieldsToValidate = stepFields[currentStep as keyof typeof stepFields];
      if (fieldsToValidate && fieldsToValidate.length > 0) {
        console.log('🔍 Validating fields for step', currentStep, ':', fieldsToValidate);
        await form.validateFields(fieldsToValidate);
      }

      // For step 0, also validate Form.List fields explicitly
      if (currentStep === 0) {
        const currentValues = form.getFieldsValue(true);
        const orderDetailsList = currentValues.orderDetailsList || [];
        
        console.log('🔍 Step 0 validation - orderDetailsList:', orderDetailsList);
        
        if (orderDetailsList.length === 0) {
          message.error(
            "Vui lòng thêm ít nhất một kiện hàng trước khi tiếp tục!"
          );
          return;
        }

        // Build Form.List field paths for validation
        const formListFields = [];
        for (let i = 0; i < orderDetailsList.length; i++) {
          formListFields.push(
            ['orderDetailsList', i, 'description'],
            ['orderDetailsList', i, 'quantity'],
            ['orderDetailsList', i, 'weight'],
            ['orderDetailsList', i, 'orderSizeId'],
            ['orderDetailsList', i, 'unit'],
            ['orderDetailsList', i, 'declaredValue']
          );
        }
        
        console.log('🔍 Validating Form.List fields:', formListFields);
        
        // Validate Form.List fields using Ant Design's validation
        await form.validateFields(formListFields);
        
        console.log('✅ All order details validated successfully');
      }

      // Lưu giá trị form hiện tại trước khi chuyển step
      const currentValues = form.getFieldsValue(true);
      setFormValues((prev: any) => ({ ...prev, ...currentValues }));

      setCurrentStep(currentStep + 1);
      
      // Auto scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("❌ Validation error:", error);
      
      // Scroll to first validation error
      if (error.errorFields && error.errorFields.length > 0) {
        const firstErrorField = error.errorFields[0];
        console.log('🔍 Scrolling to first error field:', firstErrorField.name);
        
        // Use Ant Design's scrollToField method with smooth scrolling
        form.scrollToField(firstErrorField.name, {
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        
        // Remove additional message since Ant Design already shows error under input
      }
      
      // Validation errors will be displayed automatically by Ant Design Form
    }
  };

  const prev = () => {
    // Lưu giá trị form hiện tại trước khi quay lại bước trước
    const currentValues = form.getFieldsValue(true);
    setFormValues((prev: any) => ({ ...prev, ...currentValues }));
    setCurrentStep(currentStep - 1);
    
    // Auto scroll to top when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitClick = () => {
    // Show stipulation modal before actual submit
    setShowStipulationModal(true);
  };

  const handleSubmit = async () => {
    setShowStipulationModal(false);
    setIsSubmitting(true);
    try {
      // Validate all form fields first
      await form.validateFields();
      
      // Additional validation for total weight
      const currentFormValues = form.getFieldsValue(true);
      const orderDetails = currentFormValues.orderDetailsList || [];
      
      // Use utility function for consistent total weight calculation
      const totalWeight = calculateTotalWeight(orderDetails);

      if (totalWeight < 0.01 || totalWeight > 50) {
        message.error(`Tổng khối lượng đơn hàng phải từ 0.01 đến 50 tấn. Hiện tại: ${totalWeight.toFixed(2)} tấn`);
        setIsSubmitting(false);
        return;
      }

      let formattedEstimateStartTime;
      if (currentFormValues.estimateStartTime) {
        if (currentFormValues.estimateStartTime._isAMomentObject || dayjs.isDayjs(currentFormValues.estimateStartTime)) {
          // Handle dayjs object from DateSelectGroup
          const dateObj = currentFormValues.estimateStartTime.toDate();
          formattedEstimateStartTime = formatToVietnamTime(dateObj);
        } else if (currentFormValues.estimateStartTime instanceof Date) {
          formattedEstimateStartTime = formatToVietnamTime(
            currentFormValues.estimateStartTime
          );
        } else {
          formattedEstimateStartTime = currentFormValues.estimateStartTime;
        }
      }

      const formattedValues = {
        ...currentFormValues,
        estimateStartTime: formattedEstimateStartTime,
      };

      // Đảm bảo orderDetailsList luôn là một mảng
      const orderDetailsList = Array.isArray(formattedValues.orderDetailsList)
        ? formattedValues.orderDetailsList
        : [];

      if (orderDetailsList.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một kiện hàng");
      }

      // Kiểm tra các trường bắt buộc trong orderDetailsList
      const invalidDetails = orderDetailsList.filter(
        (detail: any) =>
          (!detail.weightBaseUnit && !detail.weight) ||
          !detail.orderSizeId ||
          !detail.description ||
          !detail.quantity ||
          detail.declaredValue === null ||
          detail.declaredValue === undefined ||
          detail.declaredValue === ""
      );

      if (invalidDetails.length > 0) {
        throw new Error(
          "Một số kiện hàng thiếu thông tin. Vui lòng kiểm tra lại trọng lượng, kích thước, mô tả, số lượng và giá trị khai báo."
        );
      }

      // Mở rộng orderDetailsList dựa trên quantity của từng item
      const expandedOrderDetailsList: any[] = [];
      orderDetailsList.forEach((detail: any) => {
        const quantity = detail.quantity || 1;
        const weight = detail.weight || 0;
        const unit = detail.unit || "Tấn";
        
        // Debug: Log declaredValue
        console.log('🔍 DEBUG: detail.declaredValue =', detail.declaredValue, 'type:', typeof detail.declaredValue);
        
        // Tạo nhiều bản copy của item dựa trên quantity
        for (let i = 0; i < quantity; i++) {
          expandedOrderDetailsList.push({
            weight: weight, // Send original weight without conversion
            unit: unit, // Send original unit as selected by user
            description: detail.description || "",
            orderSizeId: detail.orderSizeId,
            declaredValue: detail.declaredValue, // Giá trị khai báo - không dùng || 0 để tránh convert null thành 0
          });
        }
      });
      
      // Debug: Log expandedOrderDetailsList
      console.log('🔍 DEBUG: expandedOrderDetailsList =', JSON.stringify(expandedOrderDetailsList, null, 2));

      // Extract orderDetailsList from formValues
      const { orderDetailsList: _, ...orderRequestData } = formattedValues;

      // Create order request
      const orderRequest: OrderCreateRequest = {
        orderRequest: {
          notes: orderRequestData.notes || "Không có ghi chú",
          receiverName: orderRequestData.receiverName,
          receiverPhone: orderRequestData.receiverPhone,
          receiverIdentity: orderRequestData.receiverIdentity || "",
          packageDescription:
            orderRequestData.packageDescription || "Đơn hàng thông thường",
          estimateStartTime: formattedEstimateStartTime,
          deliveryAddressId:
            orderRequestData.deliveryAddressId?.value ||
            orderRequestData.deliveryAddressId,
          pickupAddressId:
            orderRequestData.pickupAddressId?.value ||
            orderRequestData.pickupAddressId,
          categoryId: orderRequestData.categoryId,
          hasInsurance: orderRequestData.hasInsurance || false, // Mua bảo hiểm
        },
        orderDetails: expandedOrderDetailsList,
      };

      // Debug: Log full request before sending
      console.log('🔍 DEBUG: Full orderRequest =', JSON.stringify(orderRequest, null, 2));
      
      // Log để debug
      // Kiểm tra dữ liệu trước khi gửi
      if (
        !orderRequest.orderRequest.receiverName ||
        !orderRequest.orderRequest.receiverPhone ||
        !orderRequest.orderRequest.receiverIdentity ||
        !orderRequest.orderRequest.pickupAddressId ||
        !orderRequest.orderRequest.deliveryAddressId ||
        !orderRequest.orderRequest.categoryId
      ) {
        throw new Error(
          "Vui lòng điền đầy đủ thông tin bắt buộc (tên người nhận, số điện thoại, CMND/CCCD, địa chỉ gửi/nhận, loại hàng hóa)"
        );
      }

      // Submit order
      const response = await createOrder(orderRequest);

      if (response && response.success === true) {
        message.success("Đơn hàng đã được tạo thành công");
        
        // Scroll to top to show complete success notification
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (response.data && response.data.id) {
          setCreatedOrder({
            id: response.data.id,
            orderCode: response.data.orderCode,
          });
          // Don't navigate, show success component instead
        } else {
          navigate("/orders");
        }
      } else {
        message.error(response?.message || "Có lỗi xảy ra khi tạo đơn hàng");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      
      // Scroll to first validation error if it's a form validation error
      if (error.errorFields && error.errorFields.length > 0) {
        const firstErrorField = error.errorFields[0];
        console.log('🔍 Submit validation - Scrolling to first error field:', firstErrorField.name);
        
        // Use Ant Design's scrollToField method with smooth scrolling
        form.scrollToField(firstErrorField.name, {
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        
        // Remove additional message since Ant Design already shows error under input
      } else {
        // For other types of errors (API errors, etc.)
        message.error(error.message || "Có lỗi xảy ra khi tạo đơn hàng");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was created SUCCESSFUL, show success component
  if (createdOrder) {
    return (
      <div className="p-6">
        <Card>
          <OrderCreationSuccess
            orderId={createdOrder.id}
            orderCode={createdOrder.orderCode}
            onCreateAnother={handleRetry}
          />
        </Card>
      </div>
    );
  }

  // Render form based on current step
  const renderForm = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <div>
            <Skeleton active />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
              <div>
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <Title level={4} className="text-red-600 mb-3">
                Đã xảy ra lỗi
              </Title>
              <Text className="text-red-500 block mb-6">{error}</Text>
              <Button
                type="primary"
                size="large"
                onClick={handleRetry}
                className="bg-red-500 hover:bg-red-600 border-red-500"
              >
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        // Tính tổng giá trị khai báo từ danh sách kiện hàng
        const orderDetailsList = form.getFieldValue("orderDetailsList") || [];
        const totalDeclaredValue = orderDetailsList.reduce((sum: number, item: any) => {
          const quantity = item?.quantity || 1;
          const declaredValue = item?.declaredValue || 0;
          return sum + (declaredValue * quantity);
        }, 0);
        
        return (
          <>
            <OrderDetailFormList
              name="orderDetailsList"
              label="Danh sách kiện hàng"
              categories={categories}
              orderSizes={orderSizes}
              form={form}
            />
            <InsuranceSelectionCard
              totalDeclaredValue={totalDeclaredValue}
              categoryName={categories.find(c => c.id === form.getFieldValue('categoryId'))?.categoryName}
            />
          </>
        );
      case 1:
        return (
          <ReceiverAndAddressStep
            addresses={addresses}
            onReceiverDetailsLoaded={handleReceiverDetailsLoaded}
            onAddressesUpdated={refreshAddresses}
          />
        );
      case 2:
        // Lấy lại giá trị form mới nhất trước khi hiển thị trang tóm tắt
        const currentFormValues = form.getFieldsValue(true);
        const updatedFormValues = { ...formValues, ...currentFormValues };
        return (
          <OrderSummaryStep
            formValues={updatedFormValues}
            categories={categories}
            addresses={addresses}
            orderSizes={orderSizes}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Title level={2} className="mb-2">
              Tạo đơn hàng mới
            </Title>
            <Text className="text-gray-600">
              Điền thông tin chi tiết để tạo đơn hàng vận chuyển
            </Text>
          </div>
          <Link to="/orders">
            <Button type="default" size="large" className="shrink-0">
              ← Quay lại danh sách
            </Button>
          </Link>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
          {/* Steps Navigation */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
            <Steps 
              current={currentStep} 
              className="mb-0"
              items={[
                { title: 'Thông tin kiện hàng', description: 'Nhập thông tin kiện hàng' },
                { title: 'Thông tin vận chuyển', description: 'Nhập thông tin vận chuyển' },
                { title: 'Tổng hợp và xác nhận', description: 'Xác nhận thông tin đơn hàng' },
              ]}
            />
          </div>

          {/* Form Content */}
          <div className="p-8">
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
              onValuesChange={handleFormChange}
              className="space-y-6"
            >
              {renderForm()}

              {/* Step Actions */}
              {!createdOrder && (
                <StepActions
                  currentStep={currentStep}
                  totalSteps={3}
                  onPrev={prev}
                  onNext={next}
                  onSubmit={handleSubmitClick}
                  isSubmitting={isSubmitting}
                />
              )}
            </Form>
          </div>
        </Card>

        {/* Stipulation Modal */}
        <StipulationModal
          visible={showStipulationModal}
          onAccept={handleSubmit}
          onCancel={() => setShowStipulationModal(false)}
        />
      </div>
    </div>
  );
}
