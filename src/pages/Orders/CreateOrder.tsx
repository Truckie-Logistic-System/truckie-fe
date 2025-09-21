import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  Steps,
  Card,
  Typography,
  App,
  Skeleton,
} from "antd";
import orderService from "../../services/order";
import categoryService from "../../services/category";
import addressService from "../../services/address";
import orderSizeService from "../../services/order-size";
import type { OrderCreateRequest } from "../../models/Order";
import type { Category } from "../../models/Category";
import type { Address } from "../../models/Address";
import type { OrderSize } from "../../models/OrderSize";
import type { OrderResponse } from "../../services/order/types";
import { OrderDetailFormList } from "./components";
import OrderCreationSuccess from "./components/OrderCreationSuccess";
import { formatToVietnamTime } from "../../utils/dateUtils";
import {
  ReceiverAndAddressStep,
  OrderSummaryStep,
  StepActions,
} from "./components/CreateOrderSteps";

const { Step } = Steps;
const { Title, Text } = Typography;

export default function CreateOrder() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderSizes, setOrderSizes] = useState<OrderSize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderCode?: string } | null>(null);
  const [formValues, setFormValues] = useState<any>({
    notes: "Không có ghi chú",
    packageDescription: "Đơn hàng thông thường",
    orderDetailsList: [
      {
        weight: 1,
        unit: "kg",
        quantity: 1,
        orderSizeId: null,
        description: "",
      },
    ], // Initialize với 1 OrderDetail
  });

  const [form] = Form.useForm();

  // Cập nhật giá trị form từ state khi component mount
  useEffect(() => {
    console.log("Setting form values from state:", formValues);
    form.setFieldsValue(formValues);
  }, [form, formValues]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch categories
        const categoriesResponse = await categoryService.getAllCategories();
        setCategories(categoriesResponse);

        // Fetch order sizes
        const orderSizesResponse = await orderSizeService.getAllOrderSizes();
        setOrderSizes(orderSizesResponse);

        // Fetch units
        const unitsResponse = await orderService.getUnitsList();
        setUnits(unitsResponse);

        // Cập nhật unit trong formValues với giá trị từ API
        if (unitsResponse && unitsResponse.length > 0) {
          setFormValues((prev: any) => ({
            ...prev,
            orderDetailsList: prev.orderDetailsList.map((detail: any) => ({
              ...detail,
              unit: unitsResponse[0]
            }))
          }));
        }

        // Fetch addresses using the new my-addresses endpoint
        const addressesResponse = await addressService.getMyAddresses();
        setAddresses(addressesResponse);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh addresses after creating/updating
  const refreshAddresses = async () => {
    try {
      const addressesResponse = await addressService.getMyAddresses();
      setAddresses(addressesResponse);
    } catch (error) {
      console.error("Error refreshing addresses:", error);
    }
  };

  // Handle receiver details loaded from suggestion
  const handleReceiverDetailsLoaded = (data: any) => {
    // Set address IDs in form
    form.setFieldsValue({
      pickupAddressId: data.pickupAddressId,
      deliveryAddressId: data.deliveryAddressId,
    });

    // Refresh addresses to ensure we have the latest data
    refreshAddresses();
  };

  const next = async () => {
    try {
      // Validate current step fields before proceeding
      await form.validateFields();

      // Update formValues with current form values
      const currentValues = form.getFieldsValue(true);
      console.log("Next step - Current form values:", currentValues);
      setFormValues((prev: any) => ({ ...prev, ...currentValues }));

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  const prev = () => {
    // Lưu giá trị form hiện tại trước khi quay lại bước trước
    const currentValues = form.getFieldsValue(true);
    setFormValues((prev: any) => ({ ...prev, ...currentValues }));
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Lấy giá trị trực tiếp từ form để đảm bảo có dữ liệu mới nhất
      const currentFormValues = form.getFieldsValue(true);
      console.log("Current form values:", currentFormValues);

      // Format date - Xử lý đúng đối tượng Moment từ DatePicker
      let formattedEstimateStartTime;
      if (currentFormValues.estimateStartTime) {
        // Kiểm tra xem estimateStartTime có phải là đối tượng Moment không
        if (currentFormValues.estimateStartTime._isAMomentObject) {
          // Chuyển đổi từ Moment sang Date
          const dateObj = currentFormValues.estimateStartTime.toDate();
          formattedEstimateStartTime = formatToVietnamTime(dateObj);
        } else if (currentFormValues.estimateStartTime instanceof Date) {
          // Nếu đã là Date thì sử dụng trực tiếp
          formattedEstimateStartTime = formatToVietnamTime(currentFormValues.estimateStartTime);
        } else {
          // Trường hợp là string hoặc định dạng khác
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
        throw new Error("Vui lòng thêm ít nhất một lô hàng");
      }

      // Kiểm tra các trường bắt buộc trong orderDetailsList
      const invalidDetails = orderDetailsList.filter(
        (detail: any) => !detail.weight || !detail.orderSizeId || !detail.description
      );

      if (invalidDetails.length > 0) {
        throw new Error("Một số lô hàng thiếu thông tin. Vui lòng kiểm tra lại trọng lượng, kích thước và mô tả.");
      }

      // Extract orderDetailsList from formValues
      const { orderDetailsList: _, ...orderRequestData } = formattedValues;

      // Create order request
      const orderRequest: OrderCreateRequest = {
        orderRequest: {
          notes: orderRequestData.notes || "Không có ghi chú",
          receiverName: orderRequestData.receiverName,
          receiverPhone: orderRequestData.receiverPhone,
          receiverIdentity: orderRequestData.receiverIdentity || "",
          packageDescription: orderRequestData.packageDescription || "Đơn hàng thông thường",
          estimateStartTime: formattedEstimateStartTime,
          deliveryAddressId: orderRequestData.deliveryAddressId?.value || orderRequestData.deliveryAddressId,
          pickupAddressId: orderRequestData.pickupAddressId?.value || orderRequestData.pickupAddressId,
          categoryId: orderRequestData.categoryId
        },
        orderDetails: orderDetailsList.map((detail: any) => ({
          weight: detail.weight,
          unit: detail.unit || "kg",
          description: detail.description || "",
          orderSizeId: detail.orderSizeId
        }))
      };

      // Log để debug
      console.log("Order request:", orderRequest);

      // Kiểm tra dữ liệu trước khi gửi
      if (!orderRequest.orderRequest.receiverName ||
        !orderRequest.orderRequest.receiverPhone ||
        !orderRequest.orderRequest.receiverIdentity ||
        !orderRequest.orderRequest.pickupAddressId ||
        !orderRequest.orderRequest.deliveryAddressId ||
        !orderRequest.orderRequest.categoryId) {
        throw new Error("Vui lòng điền đầy đủ thông tin bắt buộc (tên người nhận, số điện thoại, CMND/CCCD, địa chỉ gửi/nhận, loại hàng hóa)");
      }

      // Submit order
      const response = await orderService.createOrder(orderRequest);

      if (response && response.success === true) {
        message.success("Đơn hàng đã được tạo thành công");
        if (response.data && response.data.id) {
          setCreatedOrder({
            id: response.data.id,
            orderCode: response.data.orderCode
          });
          // Don't navigate, show success component instead
        } else {
          navigate('/orders');
        }
      } else {
        message.error(response?.message || "Có lỗi xảy ra khi tạo đơn hàng");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      message.error(error.message || "Có lỗi xảy ra khi tạo đơn hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was created successfully, show success component
  if (createdOrder) {
    return (
      <div className="p-6">
        <Card>
          <OrderCreationSuccess
            orderId={createdOrder.id}
            orderCode={createdOrder.orderCode}
          />
        </Card>
      </div>
    );
  }

  // Render form based on current step
  const renderForm = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <Text type="danger">{error}</Text>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      );
    }

    // Đảm bảo form đã được cập nhật với giá trị mới nhất từ formValues
    form.setFieldsValue(formValues);

    switch (currentStep) {
      case 0:
        return (
          <OrderDetailFormList
            name="orderDetailsList"
            label="Danh sách lô hàng"
            orderSizes={orderSizes}
            units={units}
          />
        );
      case 1:
        return (
          <ReceiverAndAddressStep
            categories={categories}
            addresses={addresses}
            onReceiverDetailsLoaded={handleReceiverDetailsLoaded}
            onAddressesUpdated={refreshAddresses}
          />
        );
      case 2:
        // Lấy lại giá trị form mới nhất trước khi hiển thị trang tóm tắt
        const currentFormValues = form.getFieldsValue(true);
        const updatedFormValues = { ...formValues, ...currentFormValues };
        console.log("Summary step - Updated form values:", updatedFormValues);

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Tạo đơn hàng mới</Title>
        <Link to="/orders">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <Steps current={currentStep} className="mb-8">
          <Step
            title="Kích thước & Trọng lượng"
            description="Nhập thông tin lô hàng"
          />
          <Step
            title="Thông tin người nhận & Địa chỉ"
            description="Nhập thông tin giao hàng"
          />
          <Step
            title="Xác nhận"
            description="Xác nhận thông tin đơn hàng"
          />
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={formValues}
        >
          {renderForm()}

          <StepActions
            currentStep={currentStep}
            totalSteps={3}
            onPrev={prev}
            onNext={next}
            onSubmit={() => form.submit()}
            isSubmitting={isSubmitting}
          />
        </Form>
      </Card>
    </div>
  );
}


