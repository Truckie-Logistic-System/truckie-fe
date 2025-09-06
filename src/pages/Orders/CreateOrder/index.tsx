import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "../../../components/layout";
import { addressService } from "../../../services/addressService";
import { orderService } from "../../../services/orderService";
import { orderSizeService } from "../../../services/orderSizeService";
import { categoryService } from "../../../services/categoryService";
import type { Address, OrderSize, Category } from "../../../types";
import { toast } from "react-toastify";
import { AUTH_TOKEN_KEY } from "../../../config";
import { useAuth } from "../../../context/AuthContext";

const CreateOrder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderSizes, setOrderSizes] = useState<OrderSize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Helper function to get UTC+7 time in format YYYY-MM-DDTHH:mm:ss
  const getVietnamTime = () => {
    const now = new Date();
    // Add 7 hours to UTC (Vietnam timezone)
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    // Format as YYYY-MM-DDTHH:mm:ss (without milliseconds and Z)
    return vietnamTime.toISOString().slice(0, 19);
  };

  // OrderRequest fields
  const [orderRequest, setOrderRequest] = useState({
    notes: "",
    totalWeight: 0,
    receiverName: "",
    receiverPhone: "",
    packageDescription: "",
    estimateStartTime: getVietnamTime(),
    deliveryAddressId: "",
    pickupAddressId: "",
    senderId: "c71a95b2-6ee4-464f-aacd-bb6eae80db35",
    categoryId: "",
  });

  // OrderDetails (array, for now just one item)
  const [orderDetails, setOrderDetails] = useState([
    {
      weight: 0,
      description: "",
      orderSizeId: "",
    },
  ]);

  // Fetch addresses and orderSizes on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Check if user is authenticated before making API calls
      if (!isAuthenticated || !user) {
        console.log(
          "CreateOrder: User not authenticated, redirecting to login"
        );
        navigate("/login");
        return;
      }

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        console.log("CreateOrder: No token found, redirecting to login");
        navigate("/login");
        return;
      }

      try {
        console.log("CreateOrder: Starting to fetch data...");
        console.log("CreateOrder: Current token:", token);
        console.log("CreateOrder: User:", user);
        console.log("CreateOrder: isAuthenticated:", isAuthenticated);

        const [addressData, orderSizeData, categoryData] = await Promise.all([
          addressService.getAllAddress(),
          orderSizeService.getAllOrderSize(),
          categoryService.getAllCategory(),
        ]);

        console.log("Fetched addresses:", addressData);
        console.log("Fetched order sizes:", orderSizeData);
        console.log("Fetched categories:", categoryData);
        console.log(
          "CreateOrder: Token after successful fetch:",
          localStorage.getItem(AUTH_TOKEN_KEY)
        );

        setAddresses(addressData);
        setOrderSizes(orderSizeData);
        setCategories(categoryData);

        console.log("🏠 Addresses loaded:", addressData?.length || 0, "items");
        console.log(
          "📦 OrderSizes loaded:",
          orderSizeData?.length || 0,
          "items"
        );
        console.log(
          "🏷️ Categories loaded:",
          categoryData?.length || 0,
          "items"
        );
      } catch (error) {
        console.error("Failed to fetch data:", error);
        console.log(
          "CreateOrder: Token after error:",
          localStorage.getItem(AUTH_TOKEN_KEY)
        );

        // If error is 401, don't show error toast since user will be redirected to login
        if ((error as any)?.response?.status !== 401) {
          toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
        }
      }
    };
    fetchData();
  }, [isAuthenticated, user, navigate]);
  const handleInputChange = (field: string, value: string | boolean) => {
    console.log(`📝 handleInputChange: ${field} = "${value}"`);
    let processedValue = value;

    // Convert datetime-local to format YYYY-MM-DDTHH:mm:ss
    if (field === "estimateStartTime" && typeof value === "string") {
      const date = new Date(value);
      // Ensure we have a valid date and format it properly
      if (!isNaN(date.getTime())) {
        // Convert to UTC+7 (Vietnam time) and format as YYYY-MM-DDTHH:mm:ss
        const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        processedValue = vietnamTime.toISOString().slice(0, 19);
      } else {
        processedValue = getVietnamTime();
      }
      console.log("Datetime converted (UTC+7):", value, "->", processedValue);
    }

    setOrderRequest((prev) => {
      const updated = { ...prev, [field]: processedValue };
      console.log(`📊 Updated orderRequest.${field}:`, processedValue);
      return updated;
    });
  };

  const handleOrderDetailsChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setOrderDetails((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addOrderDetail = () => {
    setOrderDetails((prev) => [
      ...prev,
      {
        weight: 0,
        description: "",
        orderSizeId: "",
      },
    ]);
  };

  const removeOrderDetail = (index: number) => {
    if (orderDetails.length > 1) {
      setOrderDetails((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Check authentication before submitting
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để tạo đơn hàng.");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build FormOrders payload
      const payload = {
        orderRequest: {
          ...orderRequest,
          // Ensure estimateStartTime is in format YYYY-MM-DDTHH:mm:ss
          estimateStartTime: (() => {
            const time = orderRequest.estimateStartTime;
            if (time) {
              const date = new Date(time);
              // Convert to UTC+7 and format as YYYY-MM-DDTHH:mm:ss
              const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
              const formattedTime = vietnamTime.toISOString().slice(0, 19);
              console.log("Final estimateStartTime format:", formattedTime);
              return formattedTime;
            }
            const defaultTime = getVietnamTime();
            console.log("Using default estimateStartTime:", defaultTime);
            return defaultTime;
          })(),
        },
        orderDetails,
      };

      console.log("=== REQUEST MODEL DEBUG ===");
      console.log("🔍 Request Model Structure:");
      console.log("📦 Full payload:", JSON.stringify(payload, null, 2));
      console.log("📋 Request Model Type:", typeof payload);
      console.log("📝 OrderRequest object:", payload.orderRequest);
      console.log("📃 OrderDetails array:", payload.orderDetails);
      console.log("🔢 OrderDetails count:", payload.orderDetails.length);
      console.log("=== PAYLOAD DEBUG ===");
      console.log("Full payload:", JSON.stringify(payload, null, 2));
      console.log("OrderRequest fields:");
      console.log("- notes:", payload.orderRequest.notes);
      console.log("- totalWeight:", payload.orderRequest.totalWeight);
      console.log("- receiverName:", payload.orderRequest.receiverName);
      console.log("- receiverPhone:", payload.orderRequest.receiverPhone);
      console.log(
        "- packageDescription:",
        payload.orderRequest.packageDescription
      );
      console.log(
        "- estimateStartTime:",
        payload.orderRequest.estimateStartTime
      );
      console.log(
        "- deliveryAddressId:",
        payload.orderRequest.deliveryAddressId
      );
      console.log("- pickupAddressId:", payload.orderRequest.pickupAddressId);
      console.log("- senderId:", payload.orderRequest.senderId);
      console.log("- categoryId:", payload.orderRequest.categoryId);
      console.log("OrderDetails array:");
      payload.orderDetails.forEach((detail, index) => {
        console.log(`- Detail ${index}:`, {
          weight: detail.weight,
          description: detail.description,
          orderSizeId: detail.orderSizeId,
        });
      });
      console.log("Current token before submit:", token);
      console.log("User authenticated:", isAuthenticated);
      console.log("User data:", user);
      console.log("=== END PAYLOAD DEBUG ===");

      console.log("🚀 === FINAL REQUEST MODEL ===");
      console.log("📤 Sending to API:", JSON.stringify(payload, null, 2));
      console.log("🏷️ Model validation:");
      console.log("  ✅ orderRequest exists:", !!payload.orderRequest);
      console.log("  ✅ orderDetails exists:", !!payload.orderDetails);
      console.log(
        "  ✅ orderDetails is array:",
        Array.isArray(payload.orderDetails)
      );
      console.log("  📊 orderDetails length:", payload.orderDetails.length);
      console.log("🚀 === END FINAL REQUEST MODEL ===");

      // Call orderService.createOrder
      const createdOrder = await orderService.createOrder(payload);
      console.log("Order created successfully:", createdOrder);

      toast.success("Đơn hàng đã được tạo thành công!");
      navigate("/orders");
    } catch (error) {
      console.error("Failed to create order:", error);
      console.log("Error response:", (error as any)?.response);
      console.log("Error status:", (error as any)?.response?.status);
      console.log("Error data:", (error as any)?.response?.data);
      console.log(
        "Current token after error:",
        localStorage.getItem(AUTH_TOKEN_KEY)
      );

      if ((error as any)?.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error("Tạo đơn hàng thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Quay lại danh sách đơn hàng
            </Link>
          </div>

          <div className="flex items-center justify-between mb-8">
            {[
              { step: 1, title: "Thông Tin Giao Nhận" },
              { step: 2, title: "Loại Hàng và Yêu cầu" },
              { step: 3, title: "Thông Tin Giao Hàng" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= item.step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {item.step}
                </div>
                <div className="ml-3">
                  <span
                    className={`text-sm font-medium ${
                      currentStep >= item.step
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      currentStep > item.step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Thông Tin Đơn Hàng
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người nhận
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={orderRequest.receiverName}
                      onChange={(e) =>
                        handleInputChange("receiverName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại người nhận
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={orderRequest.receiverPhone}
                      onChange={(e) =>
                        handleInputChange("receiverPhone", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ gửi (ID)
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={orderRequest.pickupAddressId}
                      onChange={(e) =>
                        handleInputChange("pickupAddressId", e.target.value)
                      }
                    >
                      <option value="">Chọn địa chỉ gửi</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.street}, {address.ward}, {address.province}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ nhận (ID)
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={orderRequest.deliveryAddressId}
                      onChange={(e) =>
                        handleInputChange("deliveryAddressId", e.target.value)
                      }
                    >
                      <option value="">Chọn địa chỉ nhận</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.street}, {address.ward}, {address.province}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian dự kiến
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={
                        orderRequest.estimateStartTime
                          ? orderRequest.estimateStartTime.slice(0, 16) // Format: YYYY-MM-DDTHH:mm
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange("estimateStartTime", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại hàng (Category)
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={orderRequest.categoryId}
                      onChange={(e) =>
                        handleInputChange("categoryId", e.target.value)
                      }
                    >
                      <option value="">Chọn loại hàng hóa</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả kiện hàng
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={orderRequest.packageDescription}
                      onChange={(e) =>
                        handleInputChange("packageDescription", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    value={orderRequest.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID người gửi
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={orderRequest.senderId}
                    onChange={(e) =>
                      handleInputChange("senderId", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Loại Hàng và Yêu cầu
                </h2>

                <div className="space-y-4">
                  {/* Order Details Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-900">
                        Chi Tiết Đơn Hàng
                      </h3>
                      <button
                        type="button"
                        onClick={addOrderDetail}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Thêm chi tiết
                      </button>
                    </div>

                    {orderDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 mb-4 relative"
                      >
                        {orderDetails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOrderDetail(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Trọng lượng (kg)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={detail.weight}
                              onChange={(e) =>
                                handleOrderDetailsChange(
                                  index,
                                  "weight",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="Nhập trọng lượng"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Loại xe tải
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={detail.orderSizeId}
                              onChange={(e) =>
                                handleOrderDetailsChange(
                                  index,
                                  "orderSizeId",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Chọn loại xe tải</option>
                              {orderSizes.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {size.description} ({size.minWeight}-
                                  {size.maxWeight} kg)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mô tả chi tiết
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={detail.description}
                              onChange={(e) =>
                                handleOrderDetailsChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Mô tả chi tiết kiện hàng"
                            />
                          </div>
                        </div>

                        {/* Show truck size details when selected */}
                        {detail.orderSizeId && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            {(() => {
                              const selectedSize = orderSizes.find(
                                (s) => s.id === detail.orderSizeId
                              );
                              return selectedSize ? (
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <strong>Thông số xe:</strong>
                                  </p>
                                  <p>
                                    Trọng lượng: {selectedSize.minWeight} -{" "}
                                    {selectedSize.maxWeight} kg
                                  </p>
                                  <p>
                                    Kích thước: {selectedSize.minLength}×
                                    {selectedSize.minWidth}×
                                    {selectedSize.minHeight} -{" "}
                                    {selectedSize.maxLength}×
                                    {selectedSize.maxWidth}×
                                    {selectedSize.maxHeight} m
                                  </p>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* urgentDelivery removed, not in API payload */}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Thông Tin Giao Hàng
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú thêm
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Thêm ghi chú cho đơn hàng (tùy chọn)"
                      value={orderRequest.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-900">
                      Tóm tắt đơn hàng
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Điểm gửi (ID):</span>
                        <span className="text-gray-900">
                          {orderRequest.pickupAddressId || "Chưa nhập"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Điểm nhận (ID):</span>
                        <span className="text-gray-900">
                          {orderRequest.deliveryAddressId || "Chưa nhập"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Loại hàng (Category ID):
                        </span>
                        <span className="text-gray-900">
                          {orderRequest.categoryId || "Chưa chọn"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Ước tính phí vận chuyển:
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          150,000 VND
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Phí cuối cùng sẽ được xác nhận sau khi tài xế nhận đơn
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 5v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2z"
                        />
                      </svg>
                      Tạo đơn hàng
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateOrder;
