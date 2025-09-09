import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input, Select, InputNumber, Steps, Card, Typography, notification, Spin } from "antd";
import { useAuth } from "../../../context";
import orderService from "../../../services/order";
import categoryService from "../../../services/category";
import addressService from "../../../services/address";
import orderSizeService from "../../../services/order-size";
import type { OrderCreateRequest } from "../../../models/Order";
import type { Category } from "../../../models/Category";
import type { Address } from "../../../models/Address";
import type { OrderSize } from "../../../models/OrderSize";
import { formatCurrency } from "../../../utils/formatters";

const { Step } = Steps;
const { Title, Text } = Typography;
const { Option } = Select;

const CreateOrder = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderSizes, setOrderSizes] = useState<OrderSize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({
    weight: 1,
    description: "Mô tả kích thước",
    notes: "Không có ghi chú",
    packageDescription: "Gói hàng thông thường"
  });

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
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

        const [addressesData, orderSizesData, categoriesData] = await Promise.all([
          addressService.getAllAddresses(),
          orderSizeService.getAllOrderSizes(),
          categoryService.getAllCategories()
        ]);

        // Thêm trường fullAddress nếu chưa có
        const addressesWithFullAddress = addressesData.map(address => ({
          ...address,
          fullAddress: address.fullAddress || `${address.street}, ${address.ward}, ${address.province}`
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
    console.log("Form submitted with values:", values);

    // Kết hợp giá trị từ form và state
    const finalValues = {
      ...formValues,
      ...values
    };

    // Log all form values to check if they're being properly collected
    console.log("Final form values detail:");
    console.log("- receiverName:", finalValues.receiverName);
    console.log("- receiverPhone:", finalValues.receiverPhone);
    console.log("- categoryId:", finalValues.categoryId);
    console.log("- packageDescription:", finalValues.packageDescription);
    console.log("- weight:", finalValues.weight);
    console.log("- orderSizeId:", finalValues.orderSizeId);
    console.log("- description:", finalValues.description);
    console.log("- pickupAddressId:", finalValues.pickupAddressId);
    console.log("- deliveryAddressId:", finalValues.deliveryAddressId);
    console.log("- notes:", finalValues.notes);

    if (!isAuthenticated || !user) {
      notification.error({
        message: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để tạo đơn hàng.",
      });
      navigate("/auth/login");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Starting order creation process...");

      // Validate all required fields are present
      const requiredFields = [
        'receiverName',
        'receiverPhone',
        'categoryId',
        'packageDescription',
        'weight',
        'orderSizeId',
        'description',
        'pickupAddressId',
        'deliveryAddressId'
      ];

      const missingFields = requiredFields.filter(field => !finalValues[field]);
      console.log("Missing fields:", missingFields);

      if (missingFields.length > 0) {
        throw new Error(`Thiếu thông tin: ${missingFields.join(', ')}`);
      }

      // Prepare order data
      const orderData: OrderCreateRequest = {
        orderRequest: {
          notes: finalValues.notes || "",
          totalWeight: finalValues.weight,
          receiverName: finalValues.receiverName,
          receiverPhone: finalValues.receiverPhone,
          packageDescription: finalValues.packageDescription,
          // Sửa định dạng thời gian để phù hợp với LocalDateTime của Java
          // Loại bỏ phần 'Z' và giữ định dạng yyyy-MM-ddTHH:mm:ss
          estimateStartTime: new Date().toISOString().split('.')[0],
          deliveryAddressId: finalValues.deliveryAddressId,
          pickupAddressId: finalValues.pickupAddressId,
          senderId: "c71a95b2-6ee4-464f-aacd-bb6eae80db35",
          categoryId: "11111111-1111-1111-1111-111111111111"
        },
        orderDetails: [
          {
            weight: finalValues.weight,
            description: finalValues.description,
            orderSizeId: finalValues.orderSizeId,
          },
        ],
      };

      console.log("Order data prepared:", orderData);

      // Call API to create order
      console.log("Calling createOrder API...");
      await orderService.createOrder(orderData);
      console.log("Order created successfully");

      notification.success({
        message: "Thành công",
        description: "Đơn hàng đã được tạo thành công!",
      });

      // Redirect to orders list
      navigate("/orders");
    } catch (err: any) {
      console.error("Error creating order:", err);
      notification.error({
        message: "Lỗi",
        description: err.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Thông tin người nhận",
      content: (
        <div className="space-y-4">
          <Form.Item
            name="receiverName"
            label="Tên người nhận"
            rules={[{ required: true, message: "Vui lòng nhập tên người nhận" }]}
          >
            <Input placeholder="Nhập tên người nhận" />
          </Form.Item>

          <Form.Item
            name="receiverPhone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10}$/, message: "Số điện thoại không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
        </div>
      ),
    },
    {
      title: "Thông tin gói hàng",
      content: (
        <div className="space-y-4">
          <Form.Item
            name="categoryId"
            label="Loại hàng"
            rules={[{ required: true, message: "Vui lòng chọn loại hàng" }]}
          >
            <Select placeholder="Chọn loại hàng">
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.categoryName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="packageDescription"
            label="Mô tả gói hàng"
            rules={[{ required: true, message: "Vui lòng nhập mô tả gói hàng" }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết về gói hàng" />
          </Form.Item>

          <Form.Item
            name="weight"
            label="Cân nặng (kg)"
            rules={[
              { required: true, message: "Vui lòng nhập cân nặng" },
              { type: 'number', min: 0.1, message: "Cân nặng phải lớn hơn 0" }
            ]}
          >
            <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="orderSizeId"
            label="Kích thước"
            rules={[{ required: true, message: "Vui lòng chọn kích thước" }]}
          >
            <Select placeholder="Chọn kích thước">
              {orderSizes.map((size) => (
                <Option key={size.id} value={size.id}>
                  {size.description}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Ghi chú về kích thước"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={2} placeholder="Thông tin thêm về kích thước" />
          </Form.Item>
        </div>
      ),
    },
    {
      title: "Địa chỉ & Ghi chú",
      content: (
        <div className="space-y-4">
          <Form.Item
            name="pickupAddressId"
            label="Địa chỉ lấy hàng"
            rules={[{ required: true, message: "Vui lòng chọn địa chỉ lấy hàng" }]}
          >
            <Select placeholder="Chọn địa chỉ lấy hàng">
              {addresses.map((address) => (
                <Option key={address.id} value={address.id}>
                  {address.fullAddress}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="deliveryAddressId"
            label="Địa chỉ giao hàng"
            rules={[{ required: true, message: "Vui lòng chọn địa chỉ giao hàng" }]}
          >
            <Select placeholder="Chọn địa chỉ giao hàng">
              {addresses.map((address) => (
                <Option key={address.id} value={address.id}>
                  {address.fullAddress}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
            rules={[{ required: true, message: "Vui lòng nhập ghi chú" }]}
          >
            <Input.TextArea rows={4} placeholder="Ghi chú thêm cho đơn hàng" />
          </Form.Item>
        </div>
      ),
    },
    {
      title: "Xác nhận",
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <Text className="text-blue-600 font-medium">Vui lòng kiểm tra thông tin đơn hàng trước khi xác nhận.</Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Title level={5}>Thông tin người nhận</Title>
              <div className="space-y-2">
                <div>
                  <Text type="secondary">Tên người nhận:</Text>
                  <div className="font-medium">{form.getFieldValue('receiverName')}</div>
                </div>
                <div>
                  <Text type="secondary">Số điện thoại:</Text>
                  <div className="font-medium">{form.getFieldValue('receiverPhone')}</div>
                </div>
              </div>
            </div>

            <div>
              <Title level={5}>Thông tin gói hàng</Title>
              <div className="space-y-2">
                <div>
                  <Text type="secondary">Loại hàng:</Text>
                  <div className="font-medium">
                    {categories.find(c => c.id === form.getFieldValue('categoryId'))?.categoryName}
                  </div>
                </div>
                <div>
                  <Text type="secondary">Cân nặng:</Text>
                  <div className="font-medium">{form.getFieldValue('weight')} kg</div>
                </div>
                <div>
                  <Text type="secondary">Kích thước:</Text>
                  <div className="font-medium">
                    {orderSizes.find(s => s.id === form.getFieldValue('orderSizeId'))?.description}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Title level={5}>Địa chỉ lấy hàng</Title>
              <div className="font-medium">
                {addresses.find(a => a.id === form.getFieldValue('pickupAddressId'))?.fullAddress}
              </div>
            </div>

            <div>
              <Title level={5}>Địa chỉ giao hàng</Title>
              <div className="font-medium">
                {addresses.find(a => a.id === form.getFieldValue('deliveryAddressId'))?.fullAddress}
              </div>
            </div>

            <div>
              <Title level={5}>Ghi chú</Title>
              <div className="font-medium">{form.getFieldValue('notes') || 'Không có'}</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const next = () => {
    form.validateFields()
      .then(values => {
        console.log("Validated fields for current step:", values);
        // Lưu giá trị hiện tại vào form và state
        const currentValues = form.getFieldsValue(true);
        console.log("Current form values:", currentValues);

        // Cập nhật state với giá trị mới
        setFormValues({
          ...formValues,
          ...currentValues
        });

        setCurrentStep(currentStep + 1);
      })
      .catch(errorInfo => {
        console.error("Validation failed:", errorInfo);
      });
  };

  const prev = () => {
    // Lưu giá trị hiện tại trước khi quay lại bước trước
    const currentValues = form.getFieldsValue(true);
    console.log("Saving current values before going back:", currentValues);

    // Cập nhật state với giá trị mới
    setFormValues({
      ...formValues,
      ...currentValues
    });

    setCurrentStep(currentStep - 1);
  };

  // Validate all form fields before final submission
  const validateForm = async () => {
    try {
      console.log("Validating form...");
      // This will validate all fields in the form
      await form.validateFields();
      console.log("Form validation successful");
      return true;
    } catch (error) {
      console.error("Form validation failed:", error);
      // Validation failed
      notification.error({
        message: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin trước khi gửi đơn hàng.",
      });
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo đơn hàng mới</h1>
            <p className="text-gray-600">Điền thông tin để tạo đơn hàng</p>
          </div>
          <Link
            to="/orders"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Quay lại danh sách
          </Link>
        </div>

        <Steps current={currentStep} className="mb-8">
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={formValues}
            onValuesChange={(changedValues, allValues) => {
              // Cập nhật state khi giá trị form thay đổi
              setFormValues({
                ...formValues,
                ...changedValues
              });
            }}
          >
            {steps[currentStep].content}

            <div className="flex justify-between mt-8">
              {currentStep > 0 && (
                <Button onClick={prev}>
                  Quay lại
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={next}>
                  Tiếp tục
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={() => {
                    console.log("Create order button clicked - direct submit");
                    // Lấy tất cả giá trị form hiện tại và kết hợp với state
                    const currentFormValues = form.getFieldsValue(true);
                    const allValues = {
                      ...formValues,
                      ...currentFormValues
                    };
                    console.log("All form values before submit:", allValues);

                    // Cập nhật state formValues
                    setFormValues(allValues);

                    // Kiểm tra các trường bắt buộc
                    const requiredFields = [
                      'receiverName',
                      'receiverPhone',
                      'categoryId',
                      'packageDescription',
                      'weight',
                      'orderSizeId',
                      'description',
                      'pickupAddressId',
                      'deliveryAddressId'
                    ];

                    const missingFields = requiredFields.filter(field => !allValues[field]);

                    if (missingFields.length > 0) {
                      console.error("Missing required fields:", missingFields);
                      notification.error({
                        message: "Thiếu thông tin",
                        description: `Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`
                      });
                      return;
                    }

                    // Đặt lại giá trị form từ state để đảm bảo tất cả các trường có giá trị
                    form.setFieldsValue(allValues);

                    // Nếu đầy đủ thông tin, submit form
                    form.submit();
                  }}
                  loading={isSubmitting}
                >
                  Tạo đơn hàng
                </Button>
              )}
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateOrder;
