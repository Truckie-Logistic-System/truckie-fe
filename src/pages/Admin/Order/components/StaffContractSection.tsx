import React, { useState, useEffect } from "react";
import {
  Card,
  Empty,
  Button,
  App,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { StaffContractPreview } from "../../../../components/features/order";
import ContractExportContent from "../../../../components/features/order/ContractExportContent";
import type { ContractData } from "../../../../services/contract/contractTypes";
import {
  useRefreshContracts,
  useStaffContractOperations,
} from "../../../../hooks";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ContractStatusTag } from "../../../../components/common/tags";
import { ContractStatusEnum } from "../../../../constants/enums";
import DateSelectGroup from "../../../../components/common/DateSelectGroup";
import dayjs from "dayjs";
import { cleanContractData } from "../../../../utils/contractUtils";
import contractSettingService from "../../../../services/contract/contractSettingService";
import type {
  ContractSettings,
  StipulationSettings,
} from "../../../../models/Contract";

interface ErrorResponse {
  response?: {
    status: number;
  };
}

interface StaffContractProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: number;
    adjustedValue: number;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
  };
  orderId?: string; // Add orderId for contract creation
  depositAmount?: number;
  onRefetch?: () => void; // Callback to refresh parent component data
}

const StaffContractSection: React.FC<StaffContractProps> = ({
  contract,
  orderId,
  onRefetch,
}) => {
  const messageApi = App.useApp().message;
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [contractSettings, setContractSettings] =
    useState<ContractSettings | null>(null);
  const [stipulationSettings, setStipulationSettings] =
    useState<StipulationSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreationModalOpen, setIsCreationModalOpen] =
    useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();

  // Fetch contract settings and stipulation settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch contract settings
        const contractResponse =
          await contractSettingService().getContractSettings();
        console.log("[Staff] Contract settings response:", contractResponse);
        if (contractResponse.data && contractResponse.data.length > 0) {
          console.log(
            "[Staff] Setting contract settings:",
            contractResponse.data[0]
          );
          setContractSettings(contractResponse.data[0]);
        }

        // Fetch stipulation settings
        const stipulationResponse =
          await contractSettingService().getStipulationSettings();
        console.log(
          "[Staff] Stipulation settings response:",
          stipulationResponse
        );
        if (stipulationResponse.success && stipulationResponse.data) {
          console.log(
            "[Staff] Setting stipulation settings:",
            stipulationResponse.data
          );
          setStipulationSettings(stipulationResponse.data);
        }
      } catch (error) {
        console.error("[Staff] Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Contract customization state
  const [contractCustomization, setContractCustomization] = useState({
    effectiveDate: "",
    expirationDate: "",
    hasAdjustedValue: false,
    adjustedValue: 0,
    contractName: "",
    description: "",
  });

  // Wrapper function to handle customization changes
  const handleCustomizationChange = (customization: any) => {
    setContractCustomization({
      effectiveDate: customization.effectiveDate || "",
      expirationDate: customization.expirationDate || "",
      hasAdjustedValue: customization.hasAdjustedValue || false,
      adjustedValue: customization.adjustedValue || 0,
      contractName: customization.contractName || "",
      description: customization.description || "",
    });
  };

  const { refetch: refetchContracts } = useRefreshContracts(orderId);
  const {
    creatingContract,
    uploadingContract,
    loadingContractData,
    createContractForCustomer,
    uploadContract,
    getContractPdfData,
  } = useStaffContractOperations();

  const handlePreviewContract = async () => {
    if (!contract?.id) return;
    try {
      const response = await getContractPdfData(contract.id);
      if (response.success) {
        setContractData(response.data);
      } else {
        messageApi.error(response.message);
        console.error("Contract service returned error:", response.message);
      }
    } catch (error) {
      console.error("[StaffContractSection] Error previewing contract:", error);
      messageApi.error("Không thể tải dữ liệu hợp đồng. Vui lòng thử lại.");
    }
  };

  const handleCreateContract = async (values: Record<string, unknown>) => {
    if (!orderId) {
      messageApi.error("Không tìm thấy thông tin đơn hàng để tạo hợp đồng");
      return;
    }

    try {
      const contractData = {
        contractName: values.contractName as string,
        startDate: (
          values.dateRange as Array<{ format: (pattern: string) => string }>
        )[0].format("YYYY-MM-DD"),
        endDate: (
          values.dateRange as Array<{ format: (pattern: string) => string }>
        )[1].format("YYYY-MM-DD"),
        totalValue: values.totalValue,
        adjustedValue: values.adjustedValue,
        description: values.description,
        attachFileUrl: values.attachFileUrl || "",
        orderId: orderId, // Using the orderId prop
      };
      const response = await createContractForCustomer(contractData);

      if (response.success) {
        messageApi.success("Hợp đồng đã được tạo thành công!");
        setIsCreationModalOpen(false);
        form.resetFields();

        // Refetch contracts to reflect the new contract status
        refetchContracts();

        // Refresh parent component data
        if (onRefetch) {
          onRefetch();
        }
      } else {
        throw new Error(response.message || "Failed to create contract");
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      messageApi.error("Có lỗi xảy ra khi tạo hợp đồng");
    }
  };

  const handleOpenUploadModal = () => {
    if (!contract?.id || !contractData) {
      messageApi.error("Không có dữ liệu hợp đồng để xuất");
      return;
    }

    // Use values from preview form customization if available, otherwise use contract data
    const effectiveDateValue = contractCustomization.effectiveDate
      ? new Date(contractCustomization.effectiveDate)
          .toISOString()
          .split("T")[0]
      : contract.effectiveDate
      ? new Date(contract.effectiveDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const expirationDateValue = contractCustomization.expirationDate
      ? new Date(contractCustomization.expirationDate)
          .toISOString()
          .split("T")[0]
      : contract.expirationDate
      ? new Date(contract.expirationDate).toISOString().split("T")[0]
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

    const adjustedValueNum = contractCustomization.hasAdjustedValue
      ? contractCustomization.adjustedValue
      : Number(contract.adjustedValue) || 0;

    const orderCodeText = contractData?.orderInfo?.orderCode || "đơn hàng";

    // Clean "N/A" values with meaningful defaults
    const { contractName: cleanContractName, description: cleanDescription } =
      cleanContractData(
        contract.contractName,
        contract.description,
        orderCodeText
      );

    uploadForm.setFieldsValue({
      contractName: cleanContractName,
      effectiveDate: dayjs(effectiveDateValue),
      expirationDate: dayjs(expirationDateValue),
      adjustedValue: adjustedValueNum,
      description: cleanDescription,
    });

    setIsUploadModalOpen(true);
  };

  const handleUploadContract = async (values: Record<string, unknown>) => {
    if (!contract?.id || !contractData) {
      messageApi.error("Không có dữ liệu hợp đồng để xuất");
      return;
    }

    try {
      messageApi.loading("Đang xuất hợp đồng...", 0);

      const formData = new FormData();
      // Use the hidden PDF export container instead of the visible modal content
      const containerElement = document.querySelector(
        "#pdf-export-container"
      ) as HTMLElement;

      if (!containerElement) {
        messageApi.destroy();
        messageApi.error("Không tìm thấy nội dung hợp đồng để xuất");
        return;
      }

      // Ensure the hidden container is visible temporarily for rendering
      const originalStyle = containerElement.style.cssText;
      containerElement.style.cssText =
        "position: fixed; top: 0; left: 0; width: 210mm; backgroundColor: white; z-index: -9999;";

      if (containerElement) {
        const canvas = await html2canvas(containerElement, {
          useCORS: true,
          allowTaint: true,
          background: "#ffffff",
          logging: false,
        } as any);

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
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

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

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

              const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
              const pageHeightMM = (currentPageHeight * ratio) / 3.779527559;

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

      // Hide the container again
      containerElement.style.cssText = originalStyle;

      formData.append("contractId", contract.id);
      formData.append("contractName", values.contractName as string);

      const formatDateTime = (dateString: string) => {
        return new Date(dateString).toISOString().slice(0, 19);
      };

      formData.append(
        "effectiveDate",
        formatDateTime(values.effectiveDate as string)
      );
      formData.append(
        "expirationDate",
        formatDateTime(values.expirationDate as string)
      );
      formData.append("adjustedValue", (values.adjustedValue || 0).toString());
      formData.append("description", values.description as string);

      const uploadResponse = await uploadContract(formData);
      // Handle response safely
      if (
        uploadResponse &&
        typeof uploadResponse === "object" &&
        "data" in uploadResponse
      ) {
        const response = uploadResponse as {
          success: boolean;
          message?: string;
          data?: unknown;
        };
        if (response.success) {
          messageApi.destroy();
          messageApi.success("Hợp đồng đã được tải lên thành công!");
          setIsUploadModalOpen(false);
          setIsModalOpen(false); // Đóng cả modal preview
          uploadForm.resetFields();

          // Refresh contract data after successful upload
          setTimeout(async () => {
            try {
              const updatedResponse = await getContractPdfData(contract?.id);
              if (updatedResponse.success) {
                setContractData(updatedResponse.data);
              }
            } catch (error) {
              console.error("Error refreshing contract data:", error);
            }
          }, 500);

          // Refetch parent order data to reflect contract status change
          if (onRefetch) {
            setTimeout(() => {
              onRefetch();
            }, 1000);
          }
        } else {
          throw new Error(response?.message || "Upload failed");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      messageApi.destroy();

      // Hide the container again in case of error
      const containerElement = document.querySelector(
        "#pdf-export-container"
      ) as HTMLElement;
      if (containerElement) {
        containerElement.style.cssText =
          "position: fixed; top: -9999px; left: -9999px; width: 210mm; minHeight: 297mm; backgroundColor: white;";
      }

      const errorResponse = error as ErrorResponse;
      if (errorResponse.response?.status === 413) {
        messageApi.error(
          "File quá lớn! Vui lòng giảm nội dung hợp đồng và thử lại."
        );
      } else if (errorResponse.response?.status === 400) {
        messageApi.error(
          "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin hợp đồng."
        );
      } else if (errorResponse.response?.status === 401) {
        messageApi.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        messageApi.error("Không thể xuất hợp đồng. Vui lòng thử lại!");
      }
    }
  };

  const handleOpenInputModal = () => {
    // Initialize form with default values or existing customization
    const today = dayjs();
    const oneYearLater = dayjs().add(1, "year");

    // Pre-fill with contract data if available
    form.setFieldsValue({
      contractName:
        contract?.contractName ||
        `Hợp đồng vận chuyển - ${contract?.id || "ORD" + Date.now()}`,
      effectiveDate: contractCustomization.effectiveDate
        ? dayjs(contractCustomization.effectiveDate)
        : today,
      expirationDate: contractCustomization.expirationDate
        ? dayjs(contractCustomization.expirationDate)
        : oneYearLater,
      adjustedValue: contractCustomization.adjustedValue || 0,
      description:
        contract?.description ||
        "Hợp đồng vận chuyển cho " +
          (contract?.id || "đơn hàng") +
          ". Điều khoản theo thỏa thuận.",
    });

    setIsCreationModalOpen(true);
  };

  const handleInputModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Update contract customization with form values
        setContractCustomization({
          effectiveDate: values.effectiveDate.toISOString(),
          expirationDate: values.expirationDate.toISOString(),
          hasAdjustedValue: values.adjustedValue > 0,
          adjustedValue: values.adjustedValue || 0,
          contractName: values.contractName,
          description: values.description,
        });

        setIsCreationModalOpen(false);
        messageApi.success("Thông tin hợp đồng đã được cập nhật");

        // Open preview modal after setting data
        handleOpenPreviewModal();
      })
      .catch((errorInfo) => {
        console.error("Validation failed:", errorInfo);
      });
  };

  const handleOpenPreviewModal = async () => {
    if (!contractData) {
      await handlePreviewContract();
    }

    setIsModalOpen(true);
  };

  const handleOpenModal = async () => {
    // Check if contract customization has been set
    if (
      !contractCustomization.effectiveDate ||
      !contractCustomization.expirationDate
    ) {
      // Open input modal first
      handleOpenInputModal();
    } else {
      // Directly open preview modal
      handleOpenPreviewModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleExportPdf = async () => {
    // Use the hidden PDF export container instead of the visible preview
    const containerElement = document.querySelector(
      "#pdf-export-container"
    ) as HTMLElement;

    if (!containerElement) {
      messageApi.error("Không tìm thấy nội dung hợp đồng để xuất PDF");
      return;
    }

    // Ensure the hidden container is visible temporarily for rendering
    const originalStyle = containerElement.style.cssText;
    containerElement.style.cssText =
      "position: fixed; top: 0; left: 0; width: 210mm; backgroundColor: white; z-index: -9999; overflow: visible;";

    try {
      messageApi.loading("Đang tạo file PDF với nhiều trang...", 0);

      // Wait for any dynamic content to render
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(containerElement, {
        useCORS: true,
        allowTaint: true,
        background: "#ffffff",
        logging: false,
        scale: 2,
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.querySelector(
            "#pdf-export-container"
          ) as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily = "'Times New Roman', serif";
            clonedElement.style.fontSize = "12pt";
          }
        },
      } as any);

      containerElement.style.cssText = originalStyle;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
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
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(
          imgData,
          "JPEG",
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

            pageCtx.imageSmoothingEnabled = true;
            pageCtx.imageSmoothingQuality = "high";
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

            const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
            const pageHeightMM = (currentPageHeight * ratio) / 3.779527559;

            pdf.addImage(
              pageImgData,
              "JPEG",
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
      console.error("Error exporting PDF:", error);
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
          {/* Contract Details with Enhanced UI */}
          <div className="contract-details-section">
            {/* Contract Status and Key Dates */}
            <div className="mb-6">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FileTextOutlined className="text-blue-500 text-xl mr-3" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Thông tin hợp đồng
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Tên hợp đồng:
                        </span>
                        <span className="font-medium text-gray-900">
                          {contract.contractName || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mô tả:</span>
                        <span className="font-medium text-gray-900">
                          {contract.description || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Trạng thái:
                        </span>
                        <ContractStatusTag
                          status={contract.status as ContractStatusEnum}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Nhân viên phụ trách:
                        </span>
                        <span className="font-medium text-gray-900">
                          {contract.staffName || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="text-sm text-gray-600">
                          Giá trị hợp đồng:
                        </span>
                        <span className="font-semibold text-lg text-blue-600">
                          {contract.adjustedValue && contract.adjustedValue > 0
                            ? `${contract.adjustedValue.toLocaleString(
                                "vi-VN"
                              )} VNĐ`
                            : contract.totalValue && contract.totalValue > 0
                            ? `${contract.totalValue.toLocaleString(
                                "vi-VN"
                              )} VNĐ`
                            : "Chưa có thông tin"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col xs={24} lg={12}>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-500 text-white rounded-full p-2 mr-3">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Thời hạn hiệu lực
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-green-600 font-semibold">
                            NGÀY HIỆU LỰC
                          </span>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {contract.effectiveDate
                            ? new Date(
                                contract.effectiveDate
                              ).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "Chưa có thông tin"}
                        </div>
                        {contract.effectiveDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              contract.effectiveDate
                            ).toLocaleDateString("vi-VN", {
                              weekday: "long",
                            })}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-red-600 font-semibold">
                            NGÀY HẾT HẠN
                          </span>
                        </div>
                        <div className="text-lg font-bold text-red-700">
                          {contract.expirationDate
                            ? new Date(
                                contract.expirationDate
                              ).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "Chưa có thông tin"}
                        </div>
                        {contract.expirationDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              contract.expirationDate
                            ).toLocaleDateString("vi-VN", {
                              weekday: "long",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* Contract Actions - Chỉ xem và xuất hợp đồng, không có thanh toán */}
          <div className="mt-6">
            <div className="flex gap-4">
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
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExportPdf}
                size="large"
                className="border-orange-500 text-orange-500 hover:border-orange-600 hover:text-orange-600"
              >
                Xuất PDF
              </Button>
              {contract.attachFileUrl && contract.attachFileUrl !== "N/A" && (
                <Button
                  type="primary"
                  href={contract.attachFileUrl}
                  target="_blank"
                  icon={<FileTextOutlined />}
                  size="large"
                >
                  Xem file đính kèm
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <Empty description="Chưa có thông tin hợp đồng" />
      )}

      {/* Hidden container for PDF export - without input fields */}
      <div
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "210mm",
          minHeight: "297mm",
          backgroundColor: "white",
        }}
      >
        <div id="pdf-export-container" className="a4-container">
          {contractData && (
            <ContractExportContent
              contractData={contractData}
              customization={contractCustomization}
              contractSettings={contractSettings ?? undefined}
              stipulationSettings={stipulationSettings ?? undefined}
            />
          )}
        </div>
      </div>

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
          <div className="flex justify-between">
            <Button
              icon={<EditOutlined />}
              onClick={handleOpenInputModal}
              size="large"
            >
              Chỉnh sửa thông tin
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
                contractSettings={contractSettings ?? undefined}
                stipulationSettings={stipulationSettings ?? undefined}
                onCustomizationChange={handleCustomizationChange}
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

      {/* Contract Data Input Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="mr-2 text-green-500" />
            <span>Điều chỉnh thông tin xuất hợp đồng</span>
          </div>
        }
        open={isCreationModalOpen}
        onCancel={() => {
          setIsCreationModalOpen(false);
          form.resetFields();
        }}
        onOk={handleInputModalOk}
        width={600}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>📝 Lưu ý:</strong> Vui lòng kiểm tra và điều chỉnh thông tin
            hợp đồng trước khi xuất. Các thông tin này sẽ được lưu vào file PDF
            và gửi lên hệ thống.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            effectiveDate: dayjs(),
            expirationDate: dayjs().add(1, "year"),
            adjustedValue: 0,
          }}
        >
          <Form.Item
            label="Tên hợp đồng"
            name="contractName"
            rules={[
              { required: true, message: "Vui lòng nhập tên hợp đồng" },
              {
                max: 255,
                message: "Tên hợp đồng không được vượt quá 255 ký tự",
              },
            ]}
          >
            <Input placeholder="Nhập tên hợp đồng" showCount maxLength={255} />
          </Form.Item>

          <Form.Item
            label="Ngày hiệu lực"
            name="effectiveDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày hiệu lực" }]}
          >
            <DateSelectGroup mode="delivery" />
          </Form.Item>

          <Form.Item
            label="Ngày hết hạn"
            name="expirationDate"
            rules={[
              { required: true, message: "Vui lòng chọn ngày hết hạn" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const effectiveDate = getFieldValue("effectiveDate");
                  if (
                    !value ||
                    !effectiveDate ||
                    value.isAfter(effectiveDate)
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày hết hạn phải sau ngày hiệu lực")
                  );
                },
              }),
            ]}
          >
            <DateSelectGroup mode="delivery" />
          </Form.Item>

          <Form.Item
            label="Giá trị điều chỉnh (trợ giá)"
            name="adjustedValue"
            tooltip="Giá trị điều chỉnh sẽ thay thế tổng giá trị hợp đồng nếu lớn hơn 0"
            initialValue={0}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá trị điều chỉnh (để 0 nếu không điều chỉnh)"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => {
                if (!value) return 0 as any;
                const parsed = Number(value.replace(/\$\s?|(,*)/g, ""));
                return (isNaN(parsed) ? 0 : parsed) as any;
              }}
              addonAfter="VND"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Mô tả hợp đồng"
            name="description"
            rules={[
              { required: true, message: "Vui lòng nhập mô tả" },
              { max: 100, message: "Mô tả không được vượt quá 100 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả hợp đồng (tối đa 100 ký tự)"
              showCount
              maxLength={100}
            />
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
            rules={[
              { required: true, message: "Vui lòng nhập tên hợp đồng" },
              {
                max: 255,
                message: "Tên hợp đồng không được vượt quá 255 ký tự",
              },
            ]}
          >
            <Input placeholder="Nhập tên hợp đồng" showCount maxLength={255} />
          </Form.Item>

          <Form.Item
            label="Ngày hiệu lực"
            name="effectiveDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày hiệu lực" }]}
          >
            <DateSelectGroup mode="delivery" />
          </Form.Item>

          <Form.Item
            label="Ngày hết hạn"
            name="expirationDate"
            rules={[
              { required: true, message: "Vui lòng chọn ngày hết hạn" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const effectiveDate = getFieldValue("effectiveDate");
                  if (
                    !value ||
                    !effectiveDate ||
                    value.isAfter(effectiveDate)
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày hết hạn phải sau ngày hiệu lực")
                  );
                },
              }),
            ]}
          >
            <DateSelectGroup mode="delivery" />
          </Form.Item>

          <Form.Item
            label="Giá trị điều chỉnh (trợ giá)"
            name="adjustedValue"
            tooltip="Giá trị điều chỉnh sẽ thay thế tổng giá trị hợp đồng nếu lớn hơn 0"
            initialValue={0}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá trị điều chỉnh (để 0 nếu không điều chỉnh)"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => {
                if (!value) return 0 as any;
                const parsed = Number(value.replace(/\$\s?|(,*)/g, ""));
                return (isNaN(parsed) ? 0 : parsed) as any;
              }}
              addonAfter="VND"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Mô tả hợp đồng"
            name="description"
            rules={[
              { required: true, message: "Vui lòng nhập mô tả" },
              { max: 100, message: "Mô tả không được vượt quá 100 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả hợp đồng (tối đa 100 ký tự)"
              showCount
              maxLength={100}
            />
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
    </Card>
  );
};

export default StaffContractSection;
