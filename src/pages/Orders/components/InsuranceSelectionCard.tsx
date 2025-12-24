import React, { useState, useEffect } from "react";
import { Card, Form, Radio, Alert, Typography, Space, Table, Tooltip, Row, Col, Divider } from "antd";
import { SafetyCertificateOutlined, WarningOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { CategoryName, isFragileCategory } from "../../../models/CategoryName";
import { useInsuranceRates } from "../../../hooks";

const { Text, Paragraph } = Typography;

interface InsuranceSelectionCardProps {
  totalDeclaredValue?: number;
  categoryName?: CategoryName;
}

const InsuranceSelectionCard: React.FC<InsuranceSelectionCardProps> = ({
  totalDeclaredValue = 0,
  categoryName = CategoryName.NORMAL,
}) => {
  const [selectedOption, setSelectedOption] = useState<boolean>(true);
  const form = Form.useFormInstance();
  const { rates, normalRatePercent, fragileRatePercent, normalRatePercentBase, fragileRatePercentBase, vatRatePercent } = useInsuranceRates();
  
  // Lấy giá trị thực tế từ form để kiểm tra validation
  const categoryId = Form.useWatch('categoryId', form);
  const orderDetailsList = Form.useWatch('orderDetailsList', form);
  
  // Kiểm tra xem user đã chọn category và nhập giá trị khai báo chưa
  const hasValidInputs = () => {
    if (!categoryId) return false; // Chưa chọn category
    
    if (!orderDetailsList || orderDetailsList.length === 0) return false; // Chưa có kiện hàng
    
    // Kiểm tra ít nhất một kiện hàng có giá trị khai báo > 0
    const hasDeclaredValue = orderDetailsList.some((detail: any) => {
      const declaredValue = parseFloat(detail.declaredValue || 0);
      return declaredValue > 0;
    });
    
    return hasDeclaredValue;
  };
  
  const canShowPricing = hasValidInputs();
  
  // Kiểm tra hàng dễ vỡ - sử dụng enum-based detection
  const isFragile = isFragileCategory(categoryName);

  // Tính phí bảo hiểm dự kiến - rates đã bao gồm VAT
  const insuranceRate = isFragile ? rates.fragileRate : rates.normalRate; // Already includes VAT
  const insuranceRatePercent = isFragile ? fragileRatePercent : normalRatePercent; // Already includes VAT
  const baseRatePercent = isFragile ? fragileRatePercentBase : normalRatePercentBase; // Without VAT
  const estimatedInsuranceFee = canShowPricing ? Math.round(totalDeclaredValue * insuranceRate) : 0;

  // Bảng so sánh 4 trường hợp
  const compensationCases = [
    {
      key: "1",
      insurance: "✅ CÓ",
      documents: "✅ CÓ",
      compensation: "Tỷ lệ hư hại × Giá trị khai báo",
      note: "TỐI ƯU NHẤT",
      color: "#52c41a",
    },
    {
      key: "2",
      insurance: "✅ CÓ",
      documents: "❌ KHÔNG",
      compensation: "Tối đa 10 × Cước phí",
      note: "BH bị vô hiệu hóa",
      color: "#faad14",
    },
    {
      key: "3",
      insurance: "❌ KHÔNG",
      documents: "✅ CÓ",
      compensation: "Tối đa 10 × Cước phí",
      note: "Giới hạn pháp lý",
      color: "#faad14",
    },
    {
      key: "4",
      insurance: "❌ KHÔNG",
      documents: "❌ KHÔNG",
      compensation: "Tối đa 10 × Cước phí",
      note: "RỦI RO CAO NHẤT",
      color: "#ff4d4f",
    },
  ];

  const columns = [
    {
      title: "Bảo hiểm",
      dataIndex: "insurance",
      key: "insurance",
      width: 100,
    },
    {
      title: "Chứng từ",
      dataIndex: "documents",
      key: "documents",
      width: 100,
    },
    {
      title: "Mức bồi thường",
      dataIndex: "compensation",
      key: "compensation",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (text: string, record: typeof compensationCases[0]) => (
        <Text style={{ color: record.color, fontWeight: 600 }}>{text}</Text>
      ),
    },
  ];

  // Sync form state with component state
  useEffect(() => {
    const currentValue = form.getFieldValue('hasInsurance');
    if (currentValue !== undefined) {
      setSelectedOption(currentValue);
    }
  }, [form]);

  // Handle card click
  const handleCardClick = (value: boolean) => {
    setSelectedOption(value);
    form.setFieldsValue({ hasInsurance: value });
  };

  // Common card style for equal sizing
  const optionCardStyle = {
    height: "100%",
    minHeight: 140,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "flex-start",
  };

  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: "#1890ff", fontSize: 20 }} />
          <span>Bảo hiểm hàng hóa</span>
          <Tooltip title="Bảo hiểm là TÙY CHỌN. Giúp bảo vệ quyền lợi khi xảy ra sự cố hư hỏng/mất mát do lỗi của Bên Vận Chuyển.">
            <InfoCircleOutlined style={{ color: "#999" }} />
          </Tooltip>
        </Space>
      }
      style={{ marginTop: 16 }}
    >
      {/* Thông tin 4 trường hợp bồi thường */}
      <Alert
        message="Chính sách bồi thường khi xảy ra sự cố"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              <Text strong>Lưu ý:</Text> Trách nhiệm bồi thường <Text strong>CHỈ</Text> phát sinh khi tổn thất do lỗi chủ quan của Bên Vận Chuyển (Điều 7.1).
            </Paragraph>
            <Table
              dataSource={compensationCases}
              columns={columns}
              pagination={false}
              size="small"
              bordered
              style={{ marginBottom: 12 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              * Chứng từ: Hóa đơn VAT, hợp đồng mua bán, phiếu xuất kho... chứng minh giá trị hàng hóa
            </Text>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Lựa chọn mua bảo hiểm - 2 thẻ full width */}
      <Form.Item
        name="hasInsurance"
        label={<Text strong>Quý khách có muốn mua bảo hiểm hàng hóa không?</Text>}
        initialValue={true}
        rules={[{ required: true, message: "Vui lòng chọn" }]}
      >
        <Radio.Group style={{ display: "none" }}>
          <Radio value={true} />
          <Radio value={false} />
        </Radio.Group>
        
        <Row gutter={16}>
          {/* Option: Mua bảo hiểm */}
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                ...optionCardStyle,
                border: selectedOption === true ? "3px solid #1890ff" : "2px solid #d9d9d9",
                backgroundColor: selectedOption === true ? "#f0f7ff" : "#f5f5f5",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: selectedOption === true ? "0 4px 12px rgba(24, 144, 255, 0.2)" : "none",
              }}
              bodyStyle={{ padding: "16px" }}
              hoverable
              onClick={() => handleCardClick(true)}
            >
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space>
                  <CheckCircleOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                  <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                    MUA BẢO HIỂM
                  </Text>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Tỷ lệ bảo hiểm cho {isFragile ? "hàng dễ vỡ" : "hàng thường"} (đã bao gồm VAT):{" "}
                  </Text>
                  <Text strong style={{ color: "#1890ff", fontSize: 13 }}>
                    {insuranceRatePercent.toFixed(3)}%
                  </Text>
                </div>
                {canShowPricing && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Phí ước tính = Giá trị khai báo × Tỷ lệ bảo hiểm
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      = {totalDeclaredValue.toLocaleString("vi-VN")} × {insuranceRatePercent.toFixed(3)}% ={" "}
                    </Text>
                    <Text strong style={{ color: "#52c41a", fontSize: 13 }}>
                      {estimatedInsuranceFee.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </div>
                )}
                {!canShowPricing && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <InfoCircleOutlined /> Vui lòng chọn loại hàng hóa và nhập giá trị khai báo
                    </Text>
                  </div>
                )}
                <Text style={{ color: "#52c41a", fontSize: 12 }}>
                  ✓ Bồi thường = Tỷ lệ hư hại × Giá trị khai báo
                </Text>
              </Space>
            </Card>
          </Col>

          {/* Option: Không mua bảo hiểm */}
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                ...optionCardStyle,
                border: selectedOption === false ? "3px solid #faad14" : "2px solid #d9d9d9",
                backgroundColor: selectedOption === false ? "#fffbe6" : "#f5f5f5",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: selectedOption === false ? "0 4px 12px rgba(250, 173, 20, 0.2)" : "none",
              }}
              bodyStyle={{ padding: "16px" }}
              hoverable
              onClick={() => handleCardClick(false)}
            >
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space>
                  <CloseCircleOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />
                  <Text strong style={{ color: "#595959", fontSize: 16 }}>
                    KHÔNG MUA BẢO HIỂM
                  </Text>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Phí bảo hiểm: </Text>
                  <Text strong style={{ fontSize: 13 }}>0 VNĐ</Text>
                </div>
                <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                  ⚠ Bồi thường tối đa: 10 × Cước phí vận chuyển
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  (Theo Điều 546 Luật Thương mại 2005)
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form.Item>

      {/* Cảnh báo về chứng từ và thẩm định */}
      <Alert
        message={
          <Text strong style={{ color: "#595959" }}>Nghĩa vụ quan trọng của Quý khách</Text>
        }
        description={
          <div style={{ color: "#595959" }}>
            <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 4 }}>
                <Text style={{ color: "#595959" }}>
                  Khai báo <Text strong>ĐÚNG</Text> giá trị hàng hóa theo hóa đơn/chứng từ hợp pháp
                </Text>
              </li>
              <li style={{ marginBottom: 4 }}>
                <Text style={{ color: "#595959" }}>
                  Chuẩn bị sẵn <Text strong>Hóa đơn VAT, hợp đồng mua bán, phiếu xuất kho</Text> để xuất trình khi xảy ra sự cố
                </Text>
              </li>
              <li style={{ marginBottom: 4 }}>
                <Text style={{ color: "#595959" }}>
                  Nếu <Text strong>KHÔNG chứng minh được giá trị</Text> → Bảo hiểm bị <Text strong style={{ color: "#d46b08" }}>VÔ HIỆU HÓA</Text> → Bồi thường tối đa 10 × Cước phí
                </Text>
              </li>
              <li>
                <Text style={{ color: "#595959" }}>
                  Khai khống giá trị để trục lợi bảo hiểm → Vi phạm <Text strong>Luật Kinh doanh Bảo hiểm 2022</Text> → <Text strong style={{ color: "#cf1322" }}>Từ chối bồi thường</Text>
                </Text>
              </li>
            </ul>
            
            <Divider style={{ margin: "12px 0", borderColor: "#e8e8e8" }} />
            
            {/* Thẩm định giá trị khi thiếu chứng từ */}
            <div style={{ backgroundColor: "#f5f5f5", padding: "12px", borderRadius: 6 }}>
              <Text strong style={{ color: "#595959", display: "block", marginBottom: 8 }}>
                📋 Thẩm định giá trị khi thiếu chứng từ
              </Text>
              <ul style={{ paddingLeft: 20, marginBottom: 0, fontSize: 13 }}>
                <li style={{ marginBottom: 6 }}>
                  <Text style={{ color: "#595959" }}>
                    <Text strong>Xác định mức bồi thường (Theo Điều 360 Bộ luật Dân sự 2015 và Điều 546 Luật Thương mại 2005):</Text> Bên Vận Chuyển thẩm định giá trị thiệt hại thực tế dựa trên <Text strong>giá thị trường ước tính</Text> tại thời điểm xảy ra sự cố. Mức bồi thường = MIN(Giá trị thiệt hại ước tính, 10 × Cước phí).
                  </Text>
                </li>
                <li>
                  <Text style={{ color: "#595959" }}>
                    <Text strong>Thẩm định độc lập:</Text> Nếu không đồng ý với mức thẩm định, Quý khách có quyền thuê <Text strong>Giám định viên độc lập</Text>. Chi phí do Bên Vận Chuyển chịu nếu kết quả cho thấy lỗi thuộc về Vận Chuyển hoặc mức thẩm định thấp hơn thực tế &gt;10%; ngược lại do Quý khách chịu.
                  </Text>
                </li>
              </ul>
            </div>
          </div>
        }
        type="warning"
        showIcon={false}
        style={{ 
          backgroundColor: "#fffdf0",
          border: "1px solid #ffe58f",
        }}
      />
    </Card>
  );
};

export default InsuranceSelectionCard;
