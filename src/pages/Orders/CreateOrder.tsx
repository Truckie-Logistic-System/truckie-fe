import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  Steps,
  Card,
  Typography,
  notification,
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
import { OrderDetailFormList } from "./components";
import { formatToVietnamTime } from "../../utils/dateUtils";
import {
  ReceiverInfoStep,
  AddressInfoStep,
  OrderSummaryStep,
  StepActions,
} from "./components/CreateOrderSteps";

const { Step } = Steps;
const { Title, Text } = Typography;

export default function CreateOrder() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderSizes, setOrderSizes] = useState<OrderSize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({
    notes: "Không có ghi chú",
    packageDescription: "Gói hàng thông thường",
    orderDetailsList: [
      {
        weight: 1,
        orderSizeId: null,
        description: "",
      },
    ], // Initialize với 1 OrderDetail
  });

  const [form] = Form.useForm();

  // Cập nhật giá trị form từ state khi component mount
  useEffect(() => {
    form.setFieldsValue(formValues);
  }, [form, formValues]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [addressesData, orderSizesData, categoriesData] =
          await Promise.all([
            addressService.getAllAddresses(),
            orderSizeService.getAllOrderSizes(),
            categoryService.getAllCategories(),
          ]);

        // Thêm trường fullAddress nếu chưa có
        const addressesWithFullAddress = addressesData.map((address) => ({
          ...address,
          fullAddress:
            address.fullAddress ||
            `${address.street}, ${address.ward}, ${address.province}`,
        }));

        setAddresses(addressesWithFullAddress);
        setOrderSizes(orderSizesData);
        setCategories(categoriesData);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu");
        notification.error({
          message: "Lỗi",
          description: "Không thể tải dữ liệu cần thiết. Vui lòng thử lại sau.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    // Kết hợp giá trị từ form và state
    const finalValues = {
      ...formValues,
      ...values,
    };

    try {
      setIsSubmitting(true);

      // Xử lý orderDetailsList - lấy item đầu tiên để tạo đơn hàng chính
      // (Tùy theo API có hỗ trợ multiple OrderDetails hay không)
      const orderDetails = finalValues.orderDetailsList || [];
      if (orderDetails.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một gói hàng!");
      }

      // Chuẩn bị orderDetails cho API
      const orderDetailsForAPI = orderDetails.map((detail: any) => ({
        weight: detail.weight,
        description: detail.description,
        orderSizeId: detail.orderSizeId,
      }));

      // Xử lý estimateStartTime - format theo UTC+7 định dạng YYYY-MM-DDTHH:mm:ss
      const estimateStartTime = finalValues.estimateStartTime
        ? formatToVietnamTime(finalValues.estimateStartTime.toDate())
        : undefined;

      // Prepare data for API theo cấu trúc mới
      const orderData: OrderCreateRequest = {
        orderRequest: {
          notes: finalValues.notes,
          receiverName: finalValues.receiverName,
          receiverPhone: finalValues.receiverPhone,
          packageDescription: finalValues.packageDescription,
          estimateStartTime: estimateStartTime,
          deliveryAddressId: finalValues.deliveryAddressId,
          pickupAddressId: finalValues.pickupAddressId,
          categoryId: finalValues.categoryId,
        },
        orderDetails: orderDetailsForAPI,
      };

      console.log("Submitting order data:", orderData);

      // Call API to create order
      const response = await orderService.createOrder(orderData);

      notification.success({
        message: "Đặt hàng thành công",
        description: `Đơn hàng của bạn đã được tạo thành công với mã ${response.orderCode}.`,
      });

      // Redirect to order list page
      navigate("/orders");
    } catch (err: any) {
      notification.error({
        message: "Đặt hàng thất bại",
        description:
          err.message ||
          "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate form fields in current step
  const validateForm = async () => {
    try {
      let fieldsToValidate: string[] = [];

      switch (currentStep) {
        case 0:
          fieldsToValidate = [
            "receiverName",
            "receiverPhone",
            "categoryId",
            "packageDescription",
          ];
          break;
        case 1:
          fieldsToValidate = ["weight", "orderSizeId", "description"];
          break;
        case 2:
          fieldsToValidate = ["pickupAddressId", "deliveryAddressId", "notes"];
          break;
        default:
          fieldsToValidate = [];
      }

      await form.validateFields(fieldsToValidate);
      return true;
    } catch (errorInfo) {
      console.log("Failed form validation:", errorInfo);
      return false;
    }
  };

  // Move to next step
  const next = () => {
    validateForm().then((isValid) => {
      if (isValid) {
        // Save current step form values
        const values = form.getFieldsValue();
        setFormValues((prev: any) => ({
          ...prev,
          ...values,
        }));

        setCurrentStep(currentStep + 1);
      }
    });
  };

  // Move to previous step
  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  // Render form based on current step
  const renderForm = () => {
    if (loading) {
      return (
        <div className="py-8">
          <div className="mb-6">
            <Skeleton.Input active size="large" style={{ width: '50%' }} />
            <div className="mt-3">
              <Skeleton.Input active size="small" style={{ width: '70%' }} />
            </div>
          </div>

          <Card>
            <Skeleton.Button active size="large" shape="circle" className="mb-4" />
            <Skeleton active paragraph={{ rows: 8 }} />
            <div className="mt-6 flex justify-end">
              <Skeleton.Button active size="large" shape="round" className="mr-3" />
              <Skeleton.Button active size="large" shape="round" />
            </div>
          </Card>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 bg-red-50 rounded-md">
          <Title level={4} className="text-red-500">
            Đã xảy ra lỗi
          </Title>
          <Text className="text-red-500">{error}</Text>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return <ReceiverInfoStep categories={categories} />;
      case 1:
        return (
          <OrderDetailFormList
            name="orderDetailsList"
            label="Danh sách gói hàng"
            orderSizes={orderSizes}
          />
        );
      case 2:
        return <AddressInfoStep addresses={addresses} />;
      case 3:
        return (
          <OrderSummaryStep
            formValues={formValues}
            categories={categories}
            orderSizes={orderSizes}
            addresses={addresses}
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
            title="Thông tin người nhận"
            description="Nhập thông tin người nhận"
          />
          <Step
            title="Kích thước & Trọng lượng & trọng lượng"
            description="Nhập thông tin gói hàng"
          />
          <Step title="Địa chỉ" description="Chọn địa chỉ giao và nhận" />
          <Step title="Xác nhận" description="Xác nhận thông tin đơn hàng" />
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
            totalSteps={4}
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
