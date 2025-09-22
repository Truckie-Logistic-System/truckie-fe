import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Steps, Card, Typography, App, Skeleton } from "antd";
import orderService from "../../services/order";
import categoryService from "../../services/category";
import addressService from "../../services/address";
import orderSizeService from "../../services/order-size";
import type { OrderCreateRequest } from "../../models/Order";
import type { Category } from "../../models/Category";
import type { Address } from "../../models/Address";
import type { OrderSize } from "../../models/OrderSize";
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
  const [formValues, setFormValues] = useState<any>({
    orderDetailsList: [],
  });
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    orderCode: string;
  } | null>(null);

  const [form] = Form.useForm();

  // Cập nhật giá trị form từ state khi component mount
  useEffect(() => {
    console.log("Setting form values from state:", formValues);
    form.setFieldsValue(formValues);
  }, [form, formValues]);

  // Tự động lưu dữ liệu form khi có thay đổi
  const handleFormChange = () => {
    const currentValues = form.getFieldsValue(true);
    setFormValues((prev: any) => ({ ...prev, ...currentValues }));
  };

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
            orderDetailsList: (prev?.orderDetailsList || []).map(
              (detail: any) => ({
                ...detail,
                unit: unitsResponse[0],
              })
            ),
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

  // Cập nhật form với giá trị đã lưu khi chuyển step
  useEffect(() => {
    if (formValues && Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [currentStep, formValues, form]);

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
    form.setFieldsValue({
      pickupAddressId: data.pickupAddressId,
      deliveryAddressId: data.deliveryAddressId,
    });
  };

  const next = async () => {
    try {
      // Validate current step fields before proceeding
      await form.validateFields();

      // Lưu giá trị form hiện tại trước khi chuyển step
      const currentValues = form.getFieldsValue(true);
      setFormValues((prev: any) => ({ ...prev, ...currentValues }));

      // Kiểm tra orderDetailsList không được rỗng khi ở step 0 (step đầu tiên)
      if (currentStep === 0) {
        const orderDetailsList = currentValues.orderDetailsList || [];
        if (orderDetailsList.length === 0) {
          message.error(
            "Vui lòng thêm ít nhất một lô hàng trước khi tiếp tục!"
          );
          return;
        }
      }

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const currentFormValues = form.getFieldsValue(true);
      console.log("Current form values:", currentFormValues);
      let formattedEstimateStartTime;
      if (currentFormValues.estimateStartTime) {
        if (currentFormValues.estimateStartTime._isAMomentObject) {
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
        throw new Error("Vui lòng thêm ít nhất một lô hàng");
      }

      // Kiểm tra các trường bắt buộc trong orderDetailsList
      const invalidDetails = orderDetailsList.filter(
        (detail: any) =>
          !detail.weight ||
          !detail.orderSizeId ||
          !detail.description ||
          !detail.quantity
      );

      if (invalidDetails.length > 0) {
        throw new Error(
          "Một số lô hàng thiếu thông tin. Vui lòng kiểm tra lại trọng lượng, kích thước, mô tả và số lượng."
        );
      }

      // Mở rộng orderDetailsList dựa trên quantity của từng item
      const expandedOrderDetailsList: any[] = [];
      orderDetailsList.forEach((detail: any) => {
        const quantity = detail.quantity || 1;
        // Tạo nhiều bản copy của item dựa trên quantity
        for (let i = 0; i < quantity; i++) {
          expandedOrderDetailsList.push({
            weight: detail.weight,
            unit: detail.unit || "kg",
            description: detail.description || "",
            orderSizeId: detail.orderSizeId,
          });
        }
      });

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
        },
        orderDetails: expandedOrderDetailsList,
      };

      // Log để debug
      console.log("Order request:", orderRequest);

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
      const response = await orderService.createOrder(orderRequest);

      if (response && response.success === true) {
        message.success("Đơn hàng đã được tạo thành công");
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
        <div className="py-12">
          <div className="text-center mb-6">
            <Skeleton.Input active size="large" style={{ width: "300px" }} />
            <div className="mt-3">
              <Skeleton.Input active size="small" style={{ width: "400px" }} />
            </div>
          </div>

          <div className="space-y-6">
            <Skeleton.Button
              active
              size="large"
              shape="round"
              style={{ width: "100%", height: "48px" }}
            />
            <Skeleton active paragraph={{ rows: 6 }} />
            <div className="flex justify-between items-center pt-6">
              <Skeleton.Button
                active
                size="large"
                shape="round"
                style={{ width: "100px" }}
              />
              <Skeleton.Button
                active
                size="large"
                shape="round"
                style={{ width: "100px" }}
              />
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
                onClick={() => window.location.reload()}
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4">
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
            <Steps current={currentStep} className="mb-0">
              <Step
                title="Thông tin lô hàng"
                description="Nhập thông tin lô hàng"
              />
              <Step
                title="Thông tin vận chuyển"
                description="Nhập thông tin vận chuyển"
              />
              <Step
                title="Tổng hợp"
                description="Tổng hợp và xác nhận thông tin"
              />
              <Step
                title="Xác nhận"
                description="Xác nhận thông tin đơn hàng"
              />
            </Steps>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onFieldsChange={handleFormChange}
              initialValues={formValues}
            >
              {renderForm()}

              <StepActions
                currentStep={currentStep}
                totalSteps={4}
                onPrev={prev}
                onNext={next}
                onSubmit={() => form.submit()}
                isSubmitting={isSubmitting}
              />
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
}
