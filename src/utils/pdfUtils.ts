import { PDFDocument } from 'pdf-lib';

/**
 * Gộp nhiều file PDF thành một file PDF duy nhất
 * @param pdfDataArray Mảng các base64 string của các file PDF
 * @returns Promise với base64 string của file PDF đã gộp
 */
export const mergePDFs = async (pdfDataArray: string[]): Promise<string> => {
    try {
        // Tạo một tài liệu PDF mới
        const mergedPdf = await PDFDocument.create();

        // Lặp qua từng file PDF để gộp
        for (const pdfBase64 of pdfDataArray) {
            try {
                // Chuyển đổi base64 thành ArrayBuffer
                const base64String = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
                const pdfBytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));

                // Tải PDF từ bytes
                const pdf = await PDFDocument.load(pdfBytes);

                // Sao chép tất cả các trang từ PDF hiện tại vào PDF đã gộp
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
            } catch (error) {
                console.error('Lỗi khi xử lý một file PDF:', error);
            }
        }

        // Lưu PDF đã gộp thành ArrayBuffer
        const mergedPdfBytes = await mergedPdf.save();

        // Chuyển đổi ArrayBuffer thành base64
        const mergedPdfBase64 = arrayBufferToBase64(mergedPdfBytes);

        return `data:application/pdf;base64,${mergedPdfBase64}`;
    } catch (error) {
        console.error('Lỗi khi gộp các file PDF:', error);
        throw error;
    }
};

/**
 * Chuyển đổi ArrayBuffer thành chuỗi base64
 * @param buffer ArrayBuffer cần chuyển đổi
 * @returns Chuỗi base64
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
};

/**
 * Kiểm tra xem một chuỗi base64 có phải là PDF không
 * @param base64String Chuỗi base64 cần kiểm tra
 * @returns Boolean cho biết có phải PDF không
 */
export const isPdfBase64 = (base64String: string): boolean => {
    if (!base64String) return false;

    // Check MIME type
    const isMimeTypePdf =
        base64String.toLowerCase().includes('application/pdf') ||
        base64String.toLowerCase().includes('pdf');

    // Check if it's a data URL
    if (base64String.startsWith('data:')) {
        return isMimeTypePdf;
    }

    // Check for PDF signature in base64 (JVBERi- is "%PDF-" in base64)
    const isPdfSignature = base64String.startsWith('JVBERi');

    return isMimeTypePdf || isPdfSignature;
};

/**
 * Tạo tên file cho PDF đã gộp
 * @param fileNames Mảng tên các file gốc
 * @returns Tên file cho PDF đã gộp
 */
export const createMergedFileName = (fileNames: string[]): string => {
    if (fileNames.length === 0) return 'merged-document.pdf';
    if (fileNames.length === 1) return fileNames[0];

    // Tìm phần chung của các tên file
    const commonPrefix = findCommonPrefix(fileNames);

    if (commonPrefix && commonPrefix.length > 5) {
        return `${commonPrefix}merged.pdf`;
    }

    return `merged-${fileNames.length}-documents.pdf`;
};

/**
 * Tìm tiền tố chung của các chuỗi
 * @param strings Mảng các chuỗi
 * @returns Tiền tố chung
 */
const findCommonPrefix = (strings: string[]): string => {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = '';
    const firstString = strings[0];

    for (let i = 0; i < firstString.length; i++) {
        const char = firstString[i];
        let allMatch = true;

        for (let j = 1; j < strings.length; j++) {
            if (strings[j][i] !== char) {
                allMatch = false;
                break;
            }
        }

        if (allMatch) {
            prefix += char;
        } else {
            break;
        }
    }

    return prefix;
}; 