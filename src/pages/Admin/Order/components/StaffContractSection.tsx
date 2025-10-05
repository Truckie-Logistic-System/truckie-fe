import React, { useState } from "react";
import {
  Card,
  Descriptions,
  Empty,
  Button,
  Tag,
  App,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { contractService } from "../../../../services/contract";
import { StaffContractPreview } from "../../../../components/features/order";
import type { ContractData } from "../../../../services/contract/contractTypes";
import httpClient from "../../../../services/api/httpClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface StaffContractProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: string;
    supportedValue: string;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
  };
  orderId?: string; // Add orderId for contract creation
}

const StaffContractSection: React.FC<StaffContractProps> = ({
  contract,
  orderId,
}) => {
  const messageApi = App.useApp().message;
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loadingContractData, setLoadingContractData] =
    useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreationModalOpen, setIsCreationModalOpen] =
    useState<boolean>(false);
  const [creatingContract, setCreatingContract] = useState<boolean>(false);
  const [form] = Form.useForm();

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "orange",
      PROCESSING: "blue",
      CANCELLED: "red",
      APPROVED: "green",
      ACTIVE: "green",
      EXPIRED: "red",
      CONTRACT_DRAFT: "orange",
    };
    return statusMap[status] || "default";
  };

  const handlePreviewContract = async () => {
    if (!contract?.id) return;

    console.log("handlePreviewContract called with contractId:", contract.id);
    setLoadingContractData(true);
    try {
      const response = await contractService.getContractPdfData(contract.id);
      console.log("Contract PDF data response:", response);
      if (response.success) {
        setContractData(response.data);
        console.log("Contract data set successfully");
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

  const handleSaveContract = (editedData: any) => {
    console.log("Saving contract with data:", editedData);
    messageApi.success("Đã lưu thay đổi hợp đồng");
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
      const response = await httpClient.post("/contracts/both", contractData);

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

  const handleUploadContract = async () => {
    if (!contract?.id || !contractData) {
      messageApi.error("Không có dữ liệu hợp đồng để xuất");
      return;
    }

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
      formData.append(
        "contractName",
        contract.contractName || "Hợp đồng dịch vụ logistics"
      );

      const formatDateTime = (date: Date) => {
        return date.toISOString().slice(0, 19);
      };

      formData.append("effectiveDate", formatDateTime(new Date()));
      formData.append(
        "expirationDate",
        formatDateTime(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
      );
      formData.append("supportedValue", "0");
      formData.append(
        "description",
        contract.description || "Hợp đồng dịch vụ logistics"
      );

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
    }
  };

  const handleTogglePreview = async () => {
    if (!isPreviewOpen) {
      if (!contractData) {
        await handlePreviewContract();
      }
      setIsPreviewOpen(true);
    } else {
      setIsPreviewOpen(false);
    }
  };

  const handleOpenModal = async () => {
    if (!contractData) {
      await handlePreviewContract();
    }
    setIsModalOpen(true);
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
            <Descriptions.Item label="Giá trị hỗ trợ">
              {contract.supportedValue || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {contract.status ? (
                <Tag color={getStatusColor(contract.status)}>
                  {contract.status}
                </Tag>
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
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleTogglePreview}
                  loading={loadingContractData}
                  size="large"
                  className={
                    isPreviewOpen
                      ? "bg-red-500 hover:bg-red-600 border-red-500"
                      : "bg-green-500 hover:bg-green-600 border-green-500"
                  }
                >
                  {isPreviewOpen
                    ? "Đóng chỉnh sửa"
                    : "Chỉnh sửa nội dung hợp đồng"}
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

              {isPreviewOpen && contractData && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Xem trước hợp đồng
                  </h3>
                  <div
                    className="inline-contract-preview"
                    style={{
                      width: "794px",
                      minHeight: "1123px",
                      margin: "0 auto",
                      backgroundColor: "white",
                      padding: "60px 85px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      transform: "scale(0.8)",
                      transformOrigin: "top center",
                    }}
                  >
                    <StaffContractPreview
                      contractData={contractData}
                      onSave={handleSaveContract}
                    />
                  </div>
                </div>
              )}
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
          <div className="flex justify-end gap-2">
            <Button
              icon={<FileTextOutlined />}
              onClick={handleUploadContract}
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
                onSave={handleSaveContract}
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
    </Card>
  );
};

export default StaffContractSection;
