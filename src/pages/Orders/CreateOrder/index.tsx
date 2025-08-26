import { useState } from "react";

const CreateOrder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Pickup details
    pickupAddress: "",
    pickupDate: "",
    pickupTime: "",
    pickupNote: "",

    // Delivery details
    deliveryAddress: "",
    deliveryDate: "",
    deliveryTime: "",
    deliveryNote: "",

    // Cargo details
    cargoType: "",
    weight: "",
    dimensions: "",
    specialRequirements: "",

    // Additional info
    customerNote: "",
    urgentDelivery: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleSubmit = () => {
    console.log("Order submitted:", formData);
    // Handle order submission
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg
                className="w-6 h-6 text-gray-600"
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
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Tạo Đơn Hàng Mới
            </h1>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
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
                    currentStep >= item.step ? "text-blue-600" : "text-gray-500"
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
                Thông Tin Giao Nhận
              </h2>

              {/* Pickup Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Nơi gửi</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên địa chỉ
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên địa chỉ"
                    value={formData.pickupAddress}
                    onChange={(e) =>
                      handleInputChange("pickupAddress", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày gửi hàng
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.pickupDate}
                        onChange={(e) =>
                          handleInputChange("pickupDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.pickupTime}
                        onChange={(e) =>
                          handleInputChange("pickupTime", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lưu ý cho tài xế
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Nhập lưu ý cho tài xế"
                    value={formData.pickupNote}
                    onChange={(e) =>
                      handleInputChange("pickupNote", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Delivery Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Nơi nhận</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên địa chỉ
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên địa chỉ"
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      handleInputChange("deliveryAddress", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày nhận hàng
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.deliveryDate}
                        onChange={(e) =>
                          handleInputChange("deliveryDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.deliveryTime}
                        onChange={(e) =>
                          handleInputChange("deliveryTime", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lưu ý cho tài xế
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Nhập lưu ý cho tài xế"
                    value={formData.deliveryNote}
                    onChange={(e) =>
                      handleInputChange("deliveryNote", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Loại Hàng và Yêu cầu
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại hàng hóa
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.cargoType}
                    onChange={(e) =>
                      handleInputChange("cargoType", e.target.value)
                    }
                  >
                    <option value="">Chọn loại hàng hóa</option>
                    <option value="general">Hàng hóa thông thường</option>
                    <option value="fragile">Hàng dễ vỡ</option>
                    <option value="liquid">Chất lỏng</option>
                    <option value="food">Thực phẩm</option>
                    <option value="electronics">Điện tử</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trọng lượng (kg)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập trọng lượng"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kích thước (cm)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="D x R x C"
                      value={formData.dimensions}
                      onChange={(e) =>
                        handleInputChange("dimensions", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu đặc biệt
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Mô tả yêu cầu đặc biệt (nếu có)"
                    value={formData.specialRequirements}
                    onChange={(e) =>
                      handleInputChange("specialRequirements", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="urgentDelivery"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.urgentDelivery}
                    onChange={(e) =>
                      handleInputChange("urgentDelivery", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="urgentDelivery"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Giao hàng khẩn cấp (phụ phí áp dụng)
                  </label>
                </div>
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
                    value={formData.customerNote}
                    onChange={(e) =>
                      handleInputChange("customerNote", e.target.value)
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
                      <span className="text-gray-600">Điểm gửi:</span>
                      <span className="text-gray-900">
                        {formData.pickupAddress || "Chưa nhập"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Điểm nhận:</span>
                      <span className="text-gray-900">
                        {formData.deliveryAddress || "Chưa nhập"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại hàng:</span>
                      <span className="text-gray-900">
                        {formData.cargoType || "Chưa chọn"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trọng lượng:</span>
                      <span className="text-gray-900">
                        {formData.weight
                          ? `${formData.weight} kg`
                          : "Chưa nhập"}
                      </span>
                    </div>
                    {formData.urgentDelivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Giao hàng khẩn cấp:
                        </span>
                        <span className="text-orange-600 font-medium">Có</span>
                      </div>
                    )}
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
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
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
