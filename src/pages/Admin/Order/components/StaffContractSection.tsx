import React, { useState } from "react";
import {
  Card,
  Descriptions,
  Empty,
  Button,
  App,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Checkbox,
  Row,
  Col,
  Alert,
  Divider,
  Statistic,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { contractService } from "../../../../services/contract";
import { StaffContractPreview } from "../../../../components/features/order";
import type { ContractData } from "../../../../services/contract/contractTypes";
import httpClient from "../../../../services/api/httpClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import { ContractStatusTag } from "../../../../components/common/tags";
import { ContractStatusEnum } from "../../../../constants/enums";

interface StaffContractProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: string;
    adjustedValue: string;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
  };
  orderId?: string; // Add orderId for contract creation
  depositAmount?: number;
}

const StaffContractSection: React.FC<StaffContractProps> = ({
  contract,
  orderId,
  depositAmount,
}) => {
  const messageApi = App.useApp().message;
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loadingContractData, setLoadingContractData] =
    useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreationModalOpen, setIsCreationModalOpen] =
    useState<boolean>(false);
  const [creatingContract, setCreatingContract] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const hasAdjustedValue = Boolean(contract?.adjustedValue && contract.adjustedValue !== "0");
  const [uploadingContract, setUploadingContract] = useState<boolean>(false);
  const [isEditContentModalOpen, setIsEditContentModalOpen] =
    useState<boolean>(false);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [previewForm] = Form.useForm();
  const [contentForm] = Form.useForm();

  // Contract customization state
  const [contractCustomization, setContractCustomization] = useState({
    effectiveDate: "",
    expirationDate: "",
    hasAdjustedValue: false,
    adjustedValue: 0,
  });

  // Contract content customization
  const [contractContent, setContractContent] = useState({
    companyName: "TRUCKIE LOGISTICS",
    companyAddress: "Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
    companyPhone: "0123 456 789",
    companyEmail: "contact@truckie.vn",
    representativeName: "[Tên người đại diện]",
    representativeTitle: "Giám đốc",
    serviceDescription:
      "Dịch vụ bao gồm: Vận chuyển hàng hóa từ điểm lấy hàng đến điểm giao hàng theo yêu cầu của Bên B.",
    paymentMethod: "Chuyển khoản",
    warrantyTerms: "Cung cấp bảo hiểm hàng hóa theo tỷ lệ quy định",
    generalTerms: "Hợp đồng có hiệu lực kể từ ngày ký và thanh toán đặt cọc.",
  });

  const handlePreviewContract = async () => {
    if (!contract?.id) return;

    console.log("handlePreviewContract called with contractId:", contract.id);
    setLoadingContractData(true);
    try {
      const response = await contractService.getContractPdfData(contract.id);
      console.log("Contract PDF data response:", response);
      if (response.success) {
        setContractData(response.data);
        console.log("Contract data set SUCCESSFUL");
      } else {
        messageApi.error(response.message);
        console.error("Contract service returned error:", response.message);
      }
    } catch (error) {
      messageApi.error("Không thể tải dữ liệu hợp đồng");
      console.error("Error fetching contract data:", error);
    } finally {
      setLoadingContractData(false);
    }
  };

  const handleCreateContract = async (values: any) => {
    if (!orderId) {
      messageApi.error("Không tìm thấy thông tin đơn hàng để tạo hợp đồng");
      return;
    }

    setCreatingContract(true);
    try {
      const contractData = {
        contractName: values.contractName,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
        totalValue: values.totalValue,
        supportedValue: values.supportedValue,
        description: values.description,
        attachFileUrl: values.attachFileUrl || "N/A",
        orderId: orderId, // Using the orderId prop
      };

      console.log("Creating contract with data:", contractData);
      const response = await httpClient.post(
        "/contracts/both/for-cus",
        contractData
      );

      if (response.data.success) {
        messageApi.success("Hợp đồng đã được tạo thành công!");
        setIsCreationModalOpen(false);
        form.resetFields();

        // Reload the page to reflect the new contract status
        window.location.reload();
      } else {
        throw new Error(response.data.message || "Failed to create contract");
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      messageApi.error("Có lỗi xảy ra khi tạo hợp đồng");
    } finally {
      setCreatingContract(false);
    }
  };

  const handleOpenUploadModal = () => {
    if (!contract?.id || !contractData) {
      messageApi.error("Không có dữ liệu hợp đồng để xuất");
      return;
    }

    // Use values from preview form customization if available, otherwise use contract data
    uploadForm.setFieldsValue({
      contractName: contract.contractName || "Hợp đồng dịch vụ logistics",
      effectiveDate:
        contractCustomization.effectiveDate ||
        (contract.effectiveDate
          ? new Date(contract.effectiveDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]),
      expirationDate:
        contractCustomization.expirationDate ||
        (contract.expirationDate
          ? new Date(contract.expirationDate).toISOString().split("T")[0]
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]),
      adjustedValue: contractCustomization.hasAdjustedValue
        ? contractCustomization.adjustedValue
        : contract.adjustedValue || "0",
      description: contract.description || "Hợp đồng dịch vụ logistics",
    });

    setIsUploadModalOpen(true);
  };

  const handleUploadContract = async (values: any) => {
    if (!contract?.id || !contractData) {
      messageApi.error("Không có dữ liệu hợp đồng để xuất");
      return;
    }

    setUploadingContract(true);
    try {
      messageApi.loading("Đang xuất hợp đồng...", 0);

      const formData = new FormData();
      const containerElement = document.querySelector(
        ".a4-container"
      ) as HTMLElement;

      if (containerElement) {
        const canvas = await html2canvas(containerElement, {
          useCORS: true,
          allowTaint: true,
          background: "#ffffff",
          width: containerElement.scrollWidth,
          height: containerElement.scrollHeight,
          logging: false,
        });

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const contentWidth = pageWidth - margin * 2;
        const contentHeight = pageHeight - margin * 2;

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = (contentWidth * 3.779527559) / imgWidth;
        const scaledHeight = (imgHeight * ratio) / 3.779527559;

        const scaleFactor = 0.5;
        const scaledCanvas = document.createElement("canvas");
        const scaledCtx = scaledCanvas.getContext("2d");

        scaledCanvas.width = canvas.width * scaleFactor;
        scaledCanvas.height = canvas.height * scaleFactor;

        if (scaledCtx) {
          scaledCtx.drawImage(
            canvas,
            0,
            0,
            scaledCanvas.width,
            scaledCanvas.height
          );
        }

        const imgData = scaledCanvas.toDataURL("image/jpeg", 0.5);

        if (scaledHeight <= contentHeight) {
          pdf.addImage(
            imgData,
            "JPEG",
            margin,
            margin,
            contentWidth,
            scaledHeight
          );
        } else {
          const totalPages = Math.ceil(scaledHeight / contentHeight);
          const pixelsPerPage = scaledCanvas.height / totalPages;

          for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();

            const pageCanvas = document.createElement("canvas");
            const pageCtx = pageCanvas.getContext("2d");

            if (pageCtx) {
              pageCanvas.width = scaledCanvas.width;
              const startY = page * pixelsPerPage;
              const endY = Math.min(
                startY + pixelsPerPage,
                scaledCanvas.height
              );
              const currentPageHeight = endY - startY;
              pageCanvas.height = currentPageHeight;

              pageCtx.drawImage(
                scaledCanvas,
                0,
                startY,
                scaledCanvas.width,
                currentPageHeight,
                0,
                0,
                scaledCanvas.width,
                currentPageHeight
              );

              const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.5);
              const pageHeightMM =
                (currentPageHeight * ratio * scaleFactor) / 3.779527559;

              pdf.addImage(
                pageImgData,
                "JPEG",
                margin,
                margin,
                contentWidth,
                pageHeightMM
              );
            }
          }
        }

        const pdfBlob = pdf.output("blob");
        const maxSizeInBytes = 9 * 1024 * 1024;
        const currentSize = pdfBlob.size / 1024 / 1024;

        if (pdfBlob.size > maxSizeInBytes) {
          messageApi.destroy();
          messageApi.error(
            `File PDF quá lớn (${currentSize.toFixed(
              2
            )}MB). Vui lòng giảm nội dung hợp đồng.`
          );
          return;
        }

        formData.append("file", pdfBlob, `hop-dong-${contract.id}.pdf`);
      }

      formData.append("contractId", contract.id);
      formData.append("contractName", values.contractName);

      const formatDateTime = (dateString: string) => {
        return new Date(dateString).toISOString().slice(0, 19);
      };

      formData.append("effectiveDate", formatDateTime(values.effectiveDate));
      formData.append("expirationDate", formatDateTime(values.expirationDate));
      formData.append("supportedValue", values.supportedValue.toString());
      formData.append("description", values.description);

      const { default: httpClient } = await import(
        "../../../../services/api/httpClient"
      );
      const response = await httpClient.post(
        "/contracts/upload-contract",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      messageApi.destroy();

      if (response.data && response.data.success) {
        messageApi.success("Đã xuất hợp đồng thành công!");
        setIsUploadModalOpen(false);
        uploadForm.resetFields();
        // Reload the page to reflect the updated contract
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (error: any) {
      messageApi.destroy();

      if (error?.response?.status === 413) {
        messageApi.error(
          "File quá lớn! Vui lòng giảm nội dung hợp đồng và thử lại."
        );
      } else if (error?.response?.status === 400) {
        messageApi.error(
          "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin hợp đồng."
        );
      } else if (error?.response?.status === 401) {
        messageApi.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        messageApi.error("Không thể xuất hợp đồng. Vui lòng thử lại!");
      }
    } finally {
      setUploadingContract(false);
    }
  };

  const handleOpenModal = async () => {
    if (!contractData) {
      await handlePreviewContract();
    }

    // Initialize form with default values
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);

    previewForm.setFieldsValue({
      effectiveDate: dayjs(today),
      expirationDate: dayjs(oneYearLater),
      hasAdjustedValue: false,
      adjustedValue: 0,
    });

    setContractCustomization({
      effectiveDate: today.toISOString().split("T")[0],
      expirationDate: oneYearLater.toISOString().split("T")[0],
      hasAdjustedValue: false,
      adjustedValue: 0,
    });

    setIsModalOpen(true);
  };

  const handlePreviewFormChange = (_changedValues: any, allValues: any) => {
    setContractCustomization({
      effectiveDate: allValues.effectiveDate
        ? allValues.effectiveDate.format("YYYY-MM-DD")
        : "",
      expirationDate: allValues.expirationDate
        ? allValues.expirationDate.format("YYYY-MM-DD")
        : "",
      hasAdjustedValue: allValues.hasAdjustedValue || false,
      adjustedValue: allValues.adjustedValue || 0,
    });
  };

  const handleOpenEditContentModal = () => {
    // Initialize form with current content
    contentForm.setFieldsValue(contractContent);
    setIsEditContentModalOpen(true);
  };

  const handleSaveContractContent = (values: any) => {
    setContractContent(values);
    setIsEditContentModalOpen(false);
    messageApi.success("Đã cập nhật nội dung hợp đồng");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleExportPdf = async () => {
    let containerElement = document.querySelector(
      ".a4-container"
    ) as HTMLElement;

    if (!containerElement) {
      containerElement = document.querySelector(
        ".inline-contract-preview"
      ) as HTMLElement;
    }

    if (!containerElement) {
      messageApi.error("Vui lòng mở xem trước hợp đồng trước khi xuất PDF");
      return;
    }

    try {
      messageApi.loading("Đang tạo file PDF với nhiều trang...", 0);

      const canvas = await html2canvas(containerElement, {
        useCORS: true,
        allowTaint: true,
        background: "#ffffff",
        width: containerElement.scrollWidth,
        height: containerElement.scrollHeight,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = (contentWidth * 3.779527559) / imgWidth;
      const scaledHeight = (imgHeight * ratio) / 3.779527559;

      if (scaledHeight <= contentHeight) {
        const imgData = canvas.toDataURL("image/png", 1.0);
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          contentWidth,
          scaledHeight
        );
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text("Trang 1", pageWidth - 20, pageHeight - 5);
      } else {
        const totalPages = Math.ceil(scaledHeight / contentHeight);
        const pixelsPerPage = imgHeight / totalPages;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const pageCanvas = document.createElement("canvas");
          const pageCtx = pageCanvas.getContext("2d");

          if (pageCtx) {
            pageCanvas.width = imgWidth;
            const startY = page * pixelsPerPage;
            const endY = Math.min(startY + pixelsPerPage, imgHeight);
            const currentPageHeight = endY - startY;
            pageCanvas.height = currentPageHeight;

            pageCtx.drawImage(
              canvas,
              0,
              startY,
              imgWidth,
              currentPageHeight,
              0,
              0,
              imgWidth,
              currentPageHeight
            );

            const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
            const pageHeightMM = (currentPageHeight * ratio) / 3.779527559;

            pdf.addImage(
              pageImgData,
              "PNG",
              margin,
              margin,
              contentWidth,
              pageHeightMM
            );
          }

          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text(
            `Trang ${page + 1} / ${totalPages}`,
            pageWidth - 30,
            pageHeight - 5
          );
        }
      }

      const fileName = `hop-dong-${
        contract?.contractName?.replace(/\s+/g, "-") || contract?.id || "staff"
      }-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      messageApi.destroy();
      const totalPages =
        scaledHeight <= contentHeight
          ? 1
          : Math.ceil(scaledHeight / contentHeight);
      messageApi.success(`Đã xuất PDF thành công! (${totalPages} trang)`);
    } catch (error) {
      messageApi.destroy();
      messageApi.error("Không thể xuất PDF. Vui lòng thử lại!");
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center">
          <FileTextOutlined className="mr-2 text-blue-500" />
          <span>Thông tin hợp đồng</span>
        </div>
      }
      className="shadow-md mb-6 rounded-xl"
    >
      {contract ? (
        <>
          {/* Payment Summary */}
          {depositAmount && (
            <div className="mb-6">
              <Alert
                message="Thông tin thanh toán"
                description={
                  <Row gutter={[16, 16]} className="mt-3">
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Tổng giá trị đơn hàng"
                        value={contract.totalValue}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    {hasAdjustedValue && (
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Giá trị điều chỉnh"
                          value={contract.adjustedValue}
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                    )}
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Số tiền cọc cần thanh toán"
                        value={depositAmount.toLocaleString('vi-VN')}
                        suffix="VNĐ"
                        prefix={<CreditCardOutlined />}
                        valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Số tiền còn lại"
                        value={(() => {
                          const adjusted = hasAdjustedValue
                            ? (typeof contract.adjustedValue === 'string'
                                ? parseFloat(contract.adjustedValue.replace(/[^0-9.-]+/g, ''))
                                : Number(contract.adjustedValue) || 0)
                            : undefined;
                          const baseValue = adjusted ?? (typeof contract.totalValue === 'string'
                                ? parseFloat(contract.totalValue.replace(/[^0-9.-]+/g, ''))
                                : Number(contract.totalValue) || 0);
                          return (baseValue - depositAmount).toLocaleString('vi-VN');
                        })()}
                        suffix="VNĐ"
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                  </Row>
                }
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
              />
            </div>
          )}

          <Divider orientation="left">Chi tiết hợp đồng</Divider>

          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label="Tên hợp đồng">
              {contract.contractName || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hiệu lực">
              {contract.effectiveDate || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {contract.expirationDate || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị hợp đồng">
              {contract.totalValue || "Chưa có thông tin"}
            </Descriptions.Item>
            {hasAdjustedValue && (
              <Descriptions.Item label="Giá trị điều chỉnh">
                {contract.adjustedValue}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Trạng thái">
              {contract.status ? (
                <ContractStatusTag status={contract.status as ContractStatusEnum} />
              ) : (
                "Chưa có thông tin"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nhân viên phụ trách">
              {contract.staffName || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={3}>
              {contract.description || "Không có mô tả"}
            </Descriptions.Item>
          </Descriptions>

          {/* Staff Contract Preview and Controls for CONTRACT_DRAFT status */}
          {contract.status === "CONTRACT_DRAFT" ? (
            <div className="mt-6">
              <div className="flex gap-4 mb-4">
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreationModalOpen(true)}
                  size="large"
                  className="border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600"
                >
                  Tạo hợp đồng mới
                </Button>
                <Button
                  type="default"
                  icon={<FileTextOutlined />}
                  onClick={handleOpenModal}
                  loading={loadingContractData}
                  size="large"
                  className="border-purple-500 text-purple-500 hover:border-purple-600 hover:text-purple-600"
                >
                  Xem hợp đồng (preview)
                </Button>
                {contractData && (
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    onClick={handleExportPdf}
                    size="large"
                    className="border-orange-500 text-orange-500 hover:border-orange-600 hover:text-orange-600"
                  >
                    Xuất PDF
                  </Button>
                )}
              </div>
            </div>
          ) : contract.attachFileUrl ? (
            <div className="mt-4">
              <Button
                type="primary"
                href={contract.attachFileUrl}
                target="_blank"
              >
                Xem file đính kèm
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-gray-500">Chưa có file đính kèm</p>
            </div>
          )}
        </>
      ) : (
        <Empty description="Chưa có thông tin hợp đồng" />
      )}

      {/* A4 Size Modal Popup */}
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="mr-2 text-blue-500" />
            <span>Hợp đồng - Khổ A4</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={
          <div className="flex justify-between items-center">
            <Button
              icon={<EditOutlined />}
              onClick={handleOpenEditContentModal}
              size="large"
              type="default"
              className="border-purple-500 text-purple-500 hover:border-purple-600 hover:text-purple-600"
            >
              Chỉnh sửa nội dung
            </Button>
            <div className="flex gap-2">
              <Button
                icon={<FileTextOutlined />}
                onClick={handleOpenUploadModal}
                size="large"
                type="primary"
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Xuất hợp đồng
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportPdf}
                size="large"
                type="default"
                className="border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600"
              >
                Xuất PDF
              </Button>
              <Button onClick={handleCloseModal} size="large">
                Đóng
              </Button>
            </div>
          </div>
        }
        width="95vw"
        style={{ maxWidth: "1000px", top: 20 }}
        className="a4-modal"
        bodyStyle={{
          padding: "20px",
          height: "calc(100vh - 200px)",
          overflow: "auto",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Customization Form */}
        <Card
          title="⚙️ Điều chỉnh thông tin hợp đồng"
          className="mb-4"
          size="small"
        >
          <Form
            form={previewForm}
            layout="vertical"
            onValuesChange={handlePreviewFormChange}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Ngày hiệu lực"
                  name="effectiveDate"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày hiệu lực" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày hiệu lực"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Ngày hết hạn"
                  name="expirationDate"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày hết hạn" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày hết hạn"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item name="hasSupportValue" valuePropName="checked">
                  <Checkbox>
                    <strong>Có trợ giá</strong>
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.hasSupportValue !== curr.hasSupportValue
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("hasSupportValue") ? (
                  <Form.Item
                    label="Giá trị trợ giá"
                    name="supportedValue"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập giá trị trợ giá",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập giá trị trợ giá"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) =>
                        Number(value!.replace(/\$\s?|(,*)/g, "")) as any
                      }
                      addonAfter="VND"
                      min={0}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Form>
        </Card>

        <div
          className="a4-container"
          style={{
            width: "794px",
            minHeight: "1123px",
            margin: "0 auto",
            backgroundColor: "white",
            padding: "60px 85px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            borderRadius: "8px",
            transform: "scale(0.85)",
            transformOrigin: "top center",
            marginBottom: "40px",
          }}
        >
          {contractData ? (
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <StaffContractPreview
                contractData={contractData}
                customization={contractCustomization}
                content={contractContent}
              />
            </div>
          ) : (
            <div
              className="flex justify-center items-center"
              style={{ height: "400px" }}
            >
              <div className="text-center">
                <FileTextOutlined
                  style={{
                    fontSize: "48px",
                    color: "#d9d9d9",
                    marginBottom: "16px",
                  }}
                />
                <p className="text-gray-500 text-lg">
                  Đang tải dữ liệu hợp đồng...
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Contract Creation Modal */}
      <Modal
        title="Tạo hợp đồng mới"
        open={isCreationModalOpen}
        onCancel={() => {
          setIsCreationModalOpen(false);
          form.resetFields();
        }}
        width={600}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateContract}
          initialValues={{
            contractName: "Hợp đồng vận chuyển",
            totalValue: 0,
            supportedValue: 0,
            description: "Hợp đồng vận chuyển hàng hóa",
            attachFileUrl: "",
          }}
        >
          <Form.Item
            label="Tên hợp đồng"
            name="contractName"
            rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng" }]}
          >
            <Input placeholder="Nhập tên hợp đồng" />
          </Form.Item>

          <Form.Item
            label="Thời gian hiệu lực"
            name="dateRange"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian hiệu lực" },
            ]}
          >
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            />
          </Form.Item>

          <Form.Item
            label="Tổng giá trị hợp đồng"
            name="totalValue"
            rules={[{ required: true, message: "Vui lòng nhập tổng giá trị" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập tổng giá trị"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            label="Giá trị hỗ trợ"
            name="supportedValue"
            rules={[
              { required: true, message: "Vui lòng nhập giá trị hỗ trợ" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá trị hỗ trợ"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            label="Mô tả hợp đồng"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả hợp đồng" />
          </Form.Item>

          <Form.Item label="URL file đính kèm (tùy chọn)" name="attachFileUrl">
            <Input placeholder="Nhập URL file đính kèm" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsCreationModalOpen(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creatingContract}
              >
                Tạo hợp đồng
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Contract Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="mr-2 text-green-500" />
            <span>Điều chỉnh thông tin xuất hợp đồng</span>
          </div>
        }
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          uploadForm.resetFields();
        }}
        width={600}
        footer={null}
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>📝 Lưu ý:</strong> Vui lòng kiểm tra và điều chỉnh thông tin
            hợp đồng trước khi xuất. Các thông tin này sẽ được lưu vào file PDF
            và gửi lên hệ thống.
          </p>
        </div>

        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUploadContract}
        >
          <Form.Item
            label="Tên hợp đồng"
            name="contractName"
            rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng" }]}
          >
            <Input placeholder="Nhập tên hợp đồng" />
          </Form.Item>

          <Form.Item
            label="Ngày hiệu lực"
            name="effectiveDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày hiệu lực" }]}
          >
            <Input type="date" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Ngày hết hạn"
            name="expirationDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày hết hạn" }]}
          >
            <Input type="date" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Giá trị hỗ trợ"
            name="supportedValue"
            rules={[
              { required: true, message: "Vui lòng nhập giá trị hỗ trợ" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá trị hỗ trợ"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                Number(value!.replace(/\$\s?|(,*)/g, "")) as any
              }
              addonAfter="VND"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Mô tả hợp đồng"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả hợp đồng" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  uploadForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploadingContract}
                icon={<FileTextOutlined />}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Xác nhận xuất hợp đồng
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Contract Content Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <EditOutlined className="mr-2 text-purple-500" />
            <span>Chỉnh sửa nội dung hợp đồng</span>
          </div>
        }
        open={isEditContentModalOpen}
        onCancel={() => {
          setIsEditContentModalOpen(false);
          contentForm.resetFields();
        }}
        width={800}
        footer={null}
      >
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Lưu ý:</strong> Chỉ chỉnh sửa các nội dung văn bản tĩnh
            của hợp đồng. Các thông tin từ database (tên khách hàng, địa chỉ,
            giá trị đơn hàng...) không thể chỉnh sửa ở đây.
          </p>
        </div>

        <Form
          form={contentForm}
          layout="vertical"
          onFinish={handleSaveContractContent}
        >
          <h4 className="font-semibold mb-3 text-gray-700">
            Thông tin Bên A (Công ty)
          </h4>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên công ty"
                name="companyName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên công ty" },
                ]}
              >
                <Input placeholder="Nhập tên công ty" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="companyPhone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Địa chỉ công ty"
            name="companyAddress"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input placeholder="Nhập địa chỉ công ty" />
          </Form.Item>

          <Form.Item
            label="Email công ty"
            name="companyEmail"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email công ty" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Người đại diện"
                name="representativeName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên người đại diện",
                  },
                ]}
              >
                <Input placeholder="Nhập tên người đại diện" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chức vụ"
                name="representativeTitle"
                rules={[{ required: true, message: "Vui lòng nhập chức vụ" }]}
              >
                <Input placeholder="Nhập chức vụ" />
              </Form.Item>
            </Col>
          </Row>

          <h4 className="font-semibold mb-3 mt-4 text-gray-700">
            Nội dung điều khoản
          </h4>

          <Form.Item
            label="Mô tả dịch vụ (ĐIỀU 1.2)"
            name="serviceDescription"
            rules={[{ required: true, message: "Vui lòng nhập mô tả dịch vụ" }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả dịch vụ cung cấp" />
          </Form.Item>

          <Form.Item
            label="Phương thức thanh toán"
            name="paymentMethod"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập phương thức thanh toán",
              },
            ]}
          >
            <Input placeholder="Ví dụ: Chuyển khoản, Tiền mặt..." />
          </Form.Item>

          <Form.Item
            label="Điều khoản bảo hiểm (ĐIỀU 5.1)"
            name="warrantyTerms"
            rules={[
              { required: true, message: "Vui lòng nhập điều khoản bảo hiểm" },
            ]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Điều khoản về bảo hiểm hàng hóa"
            />
          </Form.Item>

          <Form.Item
            label="Điều khoản chung (ĐIỀU 6.4)"
            name="generalTerms"
            rules={[
              { required: true, message: "Vui lòng nhập điều khoản chung" },
            ]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Điều khoản về hiệu lực hợp đồng"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsEditContentModalOpen(false);
                  contentForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<EditOutlined />}
                style={{ background: "#9333ea", borderColor: "#9333ea" }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default StaffContractSection;
