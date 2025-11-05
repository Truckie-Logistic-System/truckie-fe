import React from "react";
import { Card, Descriptions, Empty, Button, Tag } from "antd";
import { FileTextOutlined } from "@ant-design/icons";

interface ContractProps {
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
}

const ContractSection: React.FC<ContractProps> = ({ contract, orderId }) => {
  const messageApi = App.useApp().message;
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loadingContractData, setLoadingContractData] =
    useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "orange",
      PROCESSING: "blue",
      CANCELLED: "red",
      APPROVED: "green",
      ACTIVE: "green",
      EXPIRED: "red",
      CONTRACT_DRAFT: "orange",
      // Add more status mappings as needed
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

  const handleSaveContract = (editedData: any) => {
    console.log("Saving contract with data:", editedData);
    messageApi.success("Đã lưu thay đổi hợp đồng");
  };

  // Xuất hợp đồng - Gọi API upload contract
  const handleUploadContract = async () => {
    if (!contract?.id || !contractData) {
      messageApi.error("Không có dữ liệu hợp đồng để xuất");
      return;
    }

    try {
      messageApi.loading("Đang xuất hợp đồng...", 0);

      // Tạo FormData để gửi file và các thông tin khác
      const formData = new FormData();

      // Tạo PDF blob từ nội dung hiện tại
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

        // Tạo PDF blob
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

        // Sử dụng JPEG với chất lượng thấp hơn và scale down để giảm kích thước mạnh
        const scaleFactor = 0.5; // Giảm độ phân giải xuống 50%
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

        const imgData = scaledCanvas.toDataURL("image/jpeg", 0.5); // Chất lượng 50%
        console.log(
          `Compressed image size: ${Math.round(
            (imgData.length * 0.75) / 1024
          )}KB`
        );

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
          // Handle multiple pages với compression
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

        // Chuyển PDF thành blob để upload
        const pdfBlob = pdf.output("blob");

        // Kiểm tra kích thước file với multiple attempts
        const maxSizeInBytes = 9 * 1024 * 1024; // 9MB để có buffer
        const currentSize = pdfBlob.size / 1024 / 1024;
        console.log(`PDF size: ${currentSize.toFixed(2)}MB`);

        if (pdfBlob.size > maxSizeInBytes) {
          messageApi.destroy();
          messageApi.error(
            `File PDF vẫn quá lớn (${currentSize.toFixed(
              2
            )}MB). Hệ thống đã nén tối đa nhưng vượt quá 9MB. Vui lòng giảm nội dung hợp đồng.`
          );
          return;
        }
        formData.append("file", pdfBlob, `hop-dong-${contract.id}.pdf`);
      }

      // Thêm các thông tin khác
      formData.append("contractId", contract.id);
      formData.append(
        "contractName",
        contract.contractName || "Hợp đồng dịch vụ logistics"
      );

      // Format datetime theo yêu cầu: 2025-09-24T13:32:12
      const formatDateTime = (date: Date) => {
        return date.toISOString().slice(0, 19); // Lấy phần YYYY-MM-DDTHH:mm:ss
      };

      formData.append("effectiveDate", formatDateTime(new Date()));
      formData.append(
        "expirationDate",
        formatDateTime(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
      ); // 1 năm sau
      formData.append("adjustedValue", "0");
      formData.append(
        "description",
        contract.description || "Hợp đồng dịch vụ logistics"
      );

      // Gọi API upload contract sử dụng httpClient để có authentication
      const { default: httpClient } = await import(
        "../../../../services/api/httpClient"
      );

      const response = await httpClient.post(
        "/contracts/upload-contract",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      messageApi.destroy();

      if (response.data && response.data.success) {
        messageApi.success("Đã xuất hợp đồng thành công!");
        console.log("Upload contract response:", response.data);

        // Có thể refresh contract data hoặc redirect
        // await handlePreviewContract(); // Refresh data nếu cần
      } else {
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (error: any) {
      messageApi.destroy();

      // Xử lý các loại lỗi khác nhau
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
      } else if (error?.response?.data?.message) {
        messageApi.error(`Lỗi: ${error.response.data.message}`);
      } else {
        messageApi.error("Không thể xuất hợp đồng. Vui lòng thử lại!");
      }

      console.error("Error uploading contract:", error);
    }
  };

  const handleTogglePreview = async () => {
    if (!isPreviewOpen) {
      // Mở preview: load data nếu chưa có
      if (!contractData) {
        await handlePreviewContract();
      }
      setIsPreviewOpen(true);
    } else {
      // Đóng preview
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

  // Xuất PDF từ nội dung A4 - Chức năng dành cho Staff với hỗ trợ nhiều trang
  const handleExportPdf = async () => {
    // Tìm container A4 (trong popup) hoặc inline preview container
    let containerElement = document.querySelector(
      ".a4-container"
    ) as HTMLElement;

    // Nếu không có popup, kiểm tra inline preview
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

      // Tạo canvas với chất lượng tốt
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

      // Kích thước A4 trong mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      // Tính toán kích thước ảnh theo tỉ lệ
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Tỉ lệ để fit chiều rộng vào trang
      const ratio = (contentWidth * 3.779527559) / imgWidth; // Convert mm to pixels (1mm = ~3.78px at 96 DPI)
      const scaledHeight = (imgHeight * ratio) / 3.779527559; // Convert back to mm

      // Nếu nội dung vừa một trang
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

        // Thêm số trang
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text("Trang 1", pageWidth - 20, pageHeight - 5);
      } else {
        // Nội dung cần nhiều trang
        const totalPages = Math.ceil(scaledHeight / contentHeight);
        const pixelsPerPage = imgHeight / totalPages;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }

          // Tạo canvas con cho từng trang
          const pageCanvas = document.createElement("canvas");
          const pageCtx = pageCanvas.getContext("2d");

          if (pageCtx) {
            pageCanvas.width = imgWidth;

            // Tính chiều cao cho trang hiện tại
            const startY = page * pixelsPerPage;
            const endY = Math.min(startY + pixelsPerPage, imgHeight);
            const currentPageHeight = endY - startY;

            pageCanvas.height = currentPageHeight;

            // Vẽ phần tương ứng từ canvas gốc
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

          // Thêm số trang
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
      console.error("Error exporting PDF:", error);
    }
  };

  // Note: Contract preview chỉ load khi user click nút, không auto-load

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
              {contract.adjustedValue || "Chưa có thông tin"}
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
            <Button>
              <Link to={contract.attachFileUrl}>Xem chi tiết hợp đồng</Link>
            </Button>
          </Descriptions>

          {/* Contract Preview for CONTRACT_DRAFT status */}
          {contract.status === "CONTRACT_DRAFT" ? (
            <div className="mt-6">
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
        style={{
          maxWidth: "1000px",
          top: 20,
        }}
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
            width: "794px", // A4 width in pixels at 96 DPI (210mm)
            minHeight: "1123px", // A4 height in pixels at 96 DPI (297mm)
            margin: "0 auto",
            backgroundColor: "white",
            padding: "60px 85px", // Standard A4 margins (2cm top/bottom, 2.5cm left/right)
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
    </Card>
  );
};

export default ContractSection;
