import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Empty, Spin, Tabs, Carousel, Typography, message } from "antd";
import { PrinterOutlined, FilePdfOutlined, FileImageOutlined, LeftOutlined, RightOutlined, DownloadOutlined, MergeCellsOutlined } from "@ant-design/icons";
import { mergePDFs, isPdfBase64, createMergedFileName } from "../../../../../utils/pdfUtils";
import './styles.css'; // Import CSS file

interface BillOfLadingDocument {
    fileName: string;
    base64Content: string;
    mimeType: string;
}

interface BillOfLadingPreviewModalProps {
    visible: boolean;
    loading: boolean;
    documents: BillOfLadingDocument[] | null;
    onClose: () => void;
}

// Component để hiển thị PDF bằng Blob URL
const PdfViewer: React.FC<{
    base64Content: string;
    mimeType: string;
    fileName: string;
}> = ({ base64Content, mimeType, fileName }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Chuyển đổi base64 thành Blob URL
        if (base64Content) {
            try {
                // Loại bỏ phần header nếu có
                const base64Data = base64Content.includes('base64,')
                    ? base64Content.split('base64,')[1]
                    : base64Content;

                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                // Tạo URL từ Blob
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (error) {
                console.error("Error creating Blob URL:", error);
            }
        }

        // Cleanup function
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [base64Content, mimeType]);

    const handleDownload = () => {
        const link = document.createElement('a');
        if (blobUrl) {
            link.href = blobUrl;
        } else {
            link.href = `data:${mimeType};base64,${base64Content}`;
        }
        link.download = fileName;
        link.click();
    };

    if (!blobUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Spin tip="Đang tải PDF..." />
            </div>
        );
    }

    return (
        <>
            <div className="pdf-controls bg-gray-100 p-2 flex justify-end">
                <Button
                    type="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                >
                    Tải xuống
                </Button>
            </div>
            <iframe
                ref={iframeRef}
                src={blobUrl}
                title={fileName}
                width="100%"
                height="calc(100% - 40px)"
                style={{ border: "none" }}
            />
        </>
    );
};

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const BillOfLadingPreviewModal: React.FC<BillOfLadingPreviewModalProps> = ({
    visible,
    loading,
    documents,
    onClose,
}) => {
    const [activeTabKey, setActiveTabKey] = useState<string>("0");
    const carouselRef = React.useRef<any>(null);
    const [combiningPdfs, setCombiningPdfs] = useState<boolean>(false);
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

    // Reset active tab when modal opens
    useEffect(() => {
        if (visible) {
            setActiveTabKey("0");
            setMergedPdfUrl(null);

            // Add class to body when modal is open to prevent scrolling
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        // Cleanup function
        return () => {
            document.body.classList.remove('modal-open');
            // Revoke object URL if it exists
            if (mergedPdfUrl && mergedPdfUrl.startsWith('blob:')) {
                URL.revokeObjectURL(mergedPdfUrl);
            }
        };
    }, [visible]);

    // Hàm gộp PDF sử dụng pdf-lib
    const handleMergePDFs = async (shouldOpen = true): Promise<string | null> => {
        if (!documents || documents.length === 0) return null;

        setCombiningPdfs(true);
        message.loading({ content: 'Đang gộp các file PDF...', key: 'mergingPdfs' });

        try {
            // Lọc ra các file PDF
            const pdfDocuments = documents.filter(doc => isPdfBase64(doc.mimeType));

            if (pdfDocuments.length === 0) {
                message.warning('Không có file PDF nào để gộp');
                setCombiningPdfs(false);
                return null;
            }

            // Lấy nội dung base64 của các file PDF
            const pdfBase64Array = pdfDocuments.map(doc => `data:${doc.mimeType};base64,${doc.base64Content}`);

            // Gộp các file PDF
            const mergedPdfBase64 = await mergePDFs(pdfBase64Array);

            // Tạo tên file cho PDF đã gộp
            const mergedFileName = createMergedFileName(pdfDocuments.map(doc => doc.fileName));

            // Tạo blob từ base64
            const byteCharacters = atob(mergedPdfBase64.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Tạo URL cho blob
            const pdfUrl = URL.createObjectURL(blob);
            setMergedPdfUrl(pdfUrl);

            if (shouldOpen) {
                // Mở tab mới với PDF đã gộp
                const newWindow = window.open(pdfUrl, '_blank');
                if (newWindow) {
                    newWindow.document.title = mergedFileName;
                }
            }

            message.success({ content: 'Đã gộp thành công các file PDF!', key: 'mergingPdfs', duration: 2 });
            return pdfUrl;
        } catch (error) {
            console.error('Lỗi khi gộp các file PDF:', error);
            message.error({ content: 'Không thể gộp các file PDF', key: 'mergingPdfs' });
            return null;
        } finally {
            setCombiningPdfs(false);
        }
    };

    const handlePrintAll = async () => {
        if (!documents || documents.length === 0) return;

        setCombiningPdfs(true);
        message.loading({ content: 'Đang chuẩn bị tài liệu để in...', key: 'printLoading' });

        // Kiểm tra xem tất cả tài liệu có phải là PDF không
        const allPdfs = documents.every(doc => isPdfBase64(doc.mimeType));

        if (allPdfs && documents.length > 1) {
            // Nếu tất cả là PDF và có nhiều hơn 1 file, gộp chúng lại
            try {
                const mergedPdfUrl = await handleMergePDFs(false);

                if (mergedPdfUrl) {
                    // Mở tab mới với PDF đã gộp và in
                    const printWindow = window.open(mergedPdfUrl, '_blank');
                    if (printWindow) {
                        printWindow.document.title = 'Vận đơn hợp nhất';
                        printWindow.onload = () => {
                            setTimeout(() => {
                                printWindow.print();
                                message.success({ content: 'Đã mở tài liệu đã gộp để in!', key: 'printLoading', duration: 2 });
                            }, 1000);
                        };
                    }
                }
            } catch (error) {
                console.error('Lỗi khi gộp PDF để in:', error);
                // Fallback to old method if merging fails
                printAllDocumentsOldMethod();
            }
        } else {
            // Sử dụng phương pháp cũ nếu không phải tất cả là PDF
            printAllDocumentsOldMethod();
        }

        setCombiningPdfs(false);
    };

    const handleDownloadAll = () => {
        if (!documents || documents.length === 0) return;

        // Nếu chỉ có một tài liệu, tải xuống trực tiếp
        if (documents.length === 1) {
            const doc = documents[0];
            const link = document.createElement('a');
            link.href = `data:${doc.mimeType};base64,${doc.base64Content}`;
            link.download = doc.fileName;
            link.click();
            return;
        }

        // Kiểm tra xem tất cả có phải là PDF không
        const allPdfs = documents.every(doc => isPdfBase64(doc.mimeType));

        if (allPdfs) {
            // Nếu tất cả là PDF, gộp và tải xuống
            handleMergePDFs();
        } else {
            // Nếu có nhiều tài liệu, thông báo cho người dùng
            message.info('Đang tải xuống các tài liệu...');

            // Tải xuống từng tài liệu một
            documents.forEach((doc, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = `data:${doc.mimeType};base64,${doc.base64Content}`;
                    link.download = doc.fileName;
                    link.click();
                }, index * 1000); // Trì hoãn mỗi lần tải 1 giây để tránh trình duyệt chặn
            });
        }
    };

    const handleDownloadMergedPdf = async () => {
        if (!documents || documents.length === 0) return;

        setCombiningPdfs(true);
        message.loading({ content: 'Đang gộp các file PDF...', key: 'downloadingPdf' });

        try {
            // Lọc ra các file PDF
            const pdfDocuments = documents.filter(doc => isPdfBase64(doc.mimeType));

            if (pdfDocuments.length === 0) {
                message.warning('Không có file PDF nào để gộp');
                setCombiningPdfs(false);
                return;
            }

            // Lấy nội dung base64 của các file PDF
            const pdfBase64Array = pdfDocuments.map(doc => `data:${doc.mimeType};base64,${doc.base64Content}`);

            // Gộp các file PDF
            const mergedPdfBase64 = await mergePDFs(pdfBase64Array);

            // Tạo tên file cho PDF đã gộp
            const mergedFileName = createMergedFileName(pdfDocuments.map(doc => doc.fileName));

            // Tạo link tải xuống
            const link = document.createElement('a');
            link.href = mergedPdfBase64;
            link.download = mergedFileName;
            link.click();

            message.success({ content: 'Đã tải xuống file PDF đã gộp!', key: 'downloadingPdf', duration: 2 });
        } catch (error) {
            console.error('Lỗi khi tải xuống PDF đã gộp:', error);
            message.error({ content: 'Không thể tải xuống PDF đã gộp', key: 'downloadingPdf' });
        } finally {
            setCombiningPdfs(false);
        }
    };

    const handlePrintSingle = (doc: BillOfLadingDocument) => {
        // Tạo Blob URL từ base64
        let blobUrl = '';
        try {
            const base64Data = doc.base64Content.includes('base64,')
                ? doc.base64Content.split('base64,')[1]
                : doc.base64Content;

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: doc.mimeType });

            // Tạo URL từ Blob
            blobUrl = URL.createObjectURL(blob);
        } catch (error) {
            console.error("Error creating Blob URL:", error);
            message.error("Không thể tạo Blob URL cho PDF");
            return;
        }

        const newWindow = window.open("", "_blank");
        if (newWindow) {
            // Create a complete HTML document with proper doctype and meta tags
            newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${doc.fileName}</title>
            <style>
              body { margin: 0; padding: 0; height: 100vh; display: flex; flex-direction: column; }
              .document-title {
                font-family: Arial, sans-serif;
                color: #333;
                margin: 0;
                padding: 10px;
                background-color: #f0f0f0;
                border-bottom: 1px solid #ddd;
                font-size: 16px;
                font-weight: bold;
              }
              .content-container {
                flex: 1;
                width: 100%;
                display: flex;
                flex-direction: column;
              }
              iframe, object, embed {
                width: 100%;
                height: 100%;
                border: none;
                flex: 1;
              }
              img {
                max-width: 100%;
                max-height: calc(100vh - 50px);
                margin: 0 auto;
                display: block;
              }
              @media print {
                .document-title { padding: 5px 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="document-title">
              ${doc.fileName}
              <button class="no-print" onclick="window.print()" style="float:right; padding: 5px 10px; cursor: pointer;">Print</button>
            </div>
            <div class="content-container">
            ${doc.mimeType.includes("pdf")
                    ? `<iframe src="${blobUrl}" style="width:100%; height:100%; border:none;"></iframe>`
                    : `<img src="data:${doc.mimeType};base64,${doc.base64Content}" alt="${doc.fileName}">`
                }
            </div>
            <script>
              // Add event listener to print when loaded
              window.onload = function() {
                // Wait a bit for PDF to render
                setTimeout(function() {
                  // Uncomment the line below to automatically print
                  // window.print();
                }, 1000);
              };
              // Cleanup Blob URL when window closes
              window.onbeforeunload = function() {
                URL.revokeObjectURL("${blobUrl}");
              };
            </script>
          </body>
        </html>
      `);
            newWindow.document.close();
        }
    };

    const printAllDocumentsOldMethod = () => {
        if (!documents || documents.length === 0) return;

        // Tạo mảng Blob URLs cho các PDF
        const blobUrls: string[] = [];

        // Tạo Blob URLs cho từng document
        documents.forEach((doc) => {
            if (doc.mimeType.includes('pdf')) {
                try {
                    const base64Data = doc.base64Content.includes('base64,')
                        ? doc.base64Content.split('base64,')[1]
                        : doc.base64Content;

                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: doc.mimeType });

                    // Tạo URL từ Blob
                    const url = URL.createObjectURL(blob);
                    blobUrls.push(url);
                } catch (error) {
                    console.error("Error creating Blob URL:", error);
                    blobUrls.push(''); // Placeholder for error
                }
            } else {
                blobUrls.push(''); // Not a PDF, use data URL later
            }
        });

        const newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Vận đơn hợp nhất</title>
            <style>
              body { margin: 0; padding: 0; }
              .document-container { 
                width: 100%; 
                height: 100vh; 
                page-break-after: always;
                display: flex;
                flex-direction: column;
              }
              .document-container:last-child { page-break-after: auto; }
              .document-title {
                font-family: Arial, sans-serif;
                color: #333;
                margin: 10px 0;
                padding: 10px;
                background-color: #f0f0f0;
                border-bottom: 1px solid #ddd;
                font-size: 16px;
                font-weight: bold;
              }
              .content-container {
                flex: 1;
                width: 100%;
                display: flex;
                flex-direction: column;
              }
              iframe, object, embed {
                width: 100%;
                height: 100%;
                border: none;
                flex: 1;
              }
              img {
                max-width: 100%;
                max-height: calc(100vh - 60px);
                margin: 0 auto;
                display: block;
              }
              @media print {
                .document-title { padding: 5px 10px; margin: 0; }
                .document-container { height: 100vh; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="padding: 10px; background: #f8f8f8; text-align: center; position: sticky; top: 0; z-index: 100;">
              <button onclick="window.print()" style="padding: 8px 16px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 4px;">
                In tất cả
              </button>
            </div>
      `);

            if (documents.length === 1) {
                // Nếu chỉ có một tài liệu, hiển thị nó toàn màn hình
                const doc = documents[0];
                const blobUrl = doc.mimeType.includes('pdf') ? blobUrls[0] : '';

                newWindow.document.write(`
          <div class="document-container">
            <div class="document-title">${doc.fileName}</div>
            <div class="content-container">
            ${doc.mimeType.includes('pdf')
                        ? `<iframe src="${blobUrl}" style="width:100%; height:100%; border:none;"></iframe>`
                        : `<img src="data:${doc.mimeType};base64,${doc.base64Content}" alt="${doc.fileName}">`
                    }
            </div>
          </div>
        `);
            } else {
                // Nếu có nhiều tài liệu
                documents.forEach((doc, index) => {
                    const blobUrl = doc.mimeType.includes('pdf') ? blobUrls[index] : '';

                    newWindow.document.write(`
            <div class="document-container">
              <div class="document-title">${doc.fileName}</div>
              <div class="content-container">
              ${doc.mimeType.includes('pdf')
                            ? `<iframe src="${blobUrl}" style="width:100%; height:100%; border:none;"></iframe>`
                            : `<img src="data:${doc.mimeType};base64,${doc.base64Content}" alt="${doc.fileName}">`
                        }
              </div>
            </div>
          `);
                });
            }

            // Thêm script để xử lý in tự động sau khi tất cả các tài liệu đã tải
            newWindow.document.write(`
        <script>
          window.onload = function() {
            // Đảm bảo tất cả các tài liệu đã được tải
            setTimeout(function() {
              // Uncomment to automatically print
              // window.print();
            }, 1500);
          };
          
          // Cleanup Blob URLs when window closes
          window.onbeforeunload = function() {
            ${blobUrls.map(url => url ? `URL.revokeObjectURL("${url}");` : '').join('\n')}
          };
        </script>
      `);

            newWindow.document.write(`
          </body>
        </html>
      `);

            newWindow.document.close();
            message.success({ content: 'Đã chuẩn bị xong tài liệu!', key: 'printLoading', duration: 2 });
        }
    };

    const renderTabContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <Spin size="large" tip="Đang tải vận đơn..." />
                </div>
            );
        }

        if (!documents || documents.length === 0) {
            return <Empty description="Không có dữ liệu vận đơn" />;
        }

        // Debug: Log document information
        documents.forEach((doc, index) => {
            
        });

        // Kiểm tra xem có file PDF nào không
        const hasPdfFiles = documents.some(doc => isPdfBase64(doc.mimeType));

        return (
            <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                type="card"
                className="bill-of-lading-tabs"
                tabBarExtraContent={
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadAll}
                            className="bg-blue-600 hover:bg-blue-700 ml-2"
                        >
                            Tải xuống
                        </Button>
                        {hasPdfFiles && documents.length > 1 && (
                            <Button
                                type="primary"
                                icon={<MergeCellsOutlined />}
                                onClick={() => handleMergePDFs(true)}
                                loading={combiningPdfs}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Gộp PDF
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            onClick={handlePrintAll}
                            loading={combiningPdfs}
                            className="bg-green-600 hover:bg-green-700 ml-2"
                        >
                            In tất cả
                        </Button>
                    </div>
                }
            >
                {documents.map((doc, index) => (
                    <TabPane
                        tab={
                            <span>
                                {doc.mimeType.includes("pdf") ? <FilePdfOutlined /> : <FileImageOutlined />}{" "}
                                {doc.fileName.length > 15 ? `${doc.fileName.substring(0, 15)}...` : doc.fileName}
                            </span>
                        }
                        key={index.toString()}
                    >
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <Title level={4} className="m-0 text-blue-700">{doc.fileName}</Title>
                                <Button
                                    type="primary"
                                    icon={<PrinterOutlined />}
                                    onClick={() => handlePrintSingle(doc)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    In vận đơn này
                                </Button>
                            </div>
                            <div className="preview-container border border-gray-200 rounded-lg overflow-hidden bg-white">
                                {doc.mimeType.includes("pdf") ? (
                                    <div className="pdf-viewer-container" style={{ height: "600px" }}>
                                        {/* Sử dụng Blob URL thay vì data URL để tránh bị chặn */}
                                        <PdfViewer
                                            base64Content={doc.base64Content}
                                            mimeType={doc.mimeType}
                                            fileName={doc.fileName}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex justify-center p-4">
                                        <img
                                            src={`data:${doc.mimeType};base64,${doc.base64Content}`}
                                            alt={doc.fileName}
                                            style={{ maxWidth: "100%", maxHeight: "600px" }}
                                            className="shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabPane>
                ))}
            </Tabs>
        );
    };

    const renderCarouselView = () => {
        if (loading || !documents || documents.length === 0) {
            return null;
        }

        return (
            <div className="carousel-container mt-4">
                <Title level={5} className="text-center mb-4">Xem nhanh tất cả vận đơn</Title>
                <div className="relative">
                    <Button
                        icon={<LeftOutlined />}
                        className="absolute left-0 top-1/2 z-10 transform -translate-y-1/2"
                        onClick={() => carouselRef.current?.prev()}
                    />
                    <Carousel
                        ref={carouselRef}
                        dots={true}
                        infinite={false}
                        speed={500}
                        slidesToShow={documents.length > 2 ? 3 : documents.length}
                        slidesToScroll={1}
                        responsive={[
                            {
                                breakpoint: 1024,
                                settings: {
                                    slidesToShow: Math.min(2, documents.length),
                                    slidesToScroll: 1,
                                }
                            },
                            {
                                breakpoint: 600,
                                settings: {
                                    slidesToShow: 1,
                                    slidesToScroll: 1
                                }
                            }
                        ]}
                        className="px-8"
                    >
                        {documents.map((doc, index) => (
                            <div key={index} className="px-2">
                                <div
                                    className="cursor-pointer p-2 border border-gray-200 rounded-lg hover:border-blue-400 transition-all bg-white"
                                    onClick={() => setActiveTabKey(index.toString())}
                                >
                                    <div className="h-40 flex items-center justify-center overflow-hidden bg-gray-50">
                                        {doc.mimeType.includes("pdf") ? (
                                            <div className="text-center">
                                                <FilePdfOutlined style={{ fontSize: '48px', color: '#f5222d' }} />
                                                <div className="mt-2 text-xs text-gray-600">Tài liệu PDF</div>
                                            </div>
                                        ) : (
                                            <img
                                                src={`data:${doc.mimeType};base64,${doc.base64Content}`}
                                                alt={doc.fileName}
                                                style={{ maxWidth: "100%", maxHeight: "100%" }}
                                            />
                                        )}
                                    </div>
                                    <Text ellipsis className="block mt-2 text-center">
                                        {doc.fileName}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </Carousel>
                    <Button
                        icon={<RightOutlined />}
                        className="absolute right-0 top-1/2 z-10 transform -translate-y-1/2"
                        onClick={() => carouselRef.current?.next()}
                    />
                </div>
            </div>
        );
    };

    return (
        <Modal
            title={
                <div className="flex items-center text-blue-700">
                    <PrinterOutlined className="mr-2" />
                    <span>Xem trước vận đơn</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width={1000}
            footer={null}
            className="bill-of-lading-preview-modal"
            bodyStyle={{ padding: "16px", maxHeight: "80vh", overflow: "auto" }}
            style={{ top: 20 }}
            centered
            destroyOnClose
            wrapClassName="bill-of-lading-modal-wrapper"
        >
            {renderTabContent()}
            {documents && documents.length > 1 && renderCarouselView()}
        </Modal>
    );
};

export default BillOfLadingPreviewModal; 