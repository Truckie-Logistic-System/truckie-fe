import { Modal, Checkbox, Button, Spin, App } from "antd";
import { useState, useEffect } from "react";
import { stipulationService } from "@/services/stipulationService";
import type { StipulationResponse } from "@/services/stipulationService";

interface StipulationModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export default function StipulationModal({
  visible,
  onAccept,
  onCancel,
}: StipulationModalProps) {
  const { message } = App.useApp();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stipulation, setStipulation] = useState<StipulationResponse | null>(null);

  useEffect(() => {
    if (visible) {
      fetchStipulation();
      setAgreed(false); // Reset checkbox when modal opens
    }
  }, [visible]);

  const fetchStipulation = async () => {
    setLoading(true);
    try {
      const data = await stipulationService.getCurrentStipulation();
      setStipulation(data);
    } catch (error: any) {
      console.error("Error fetching stipulation:", error);
      message.error("Không thể tải điều khoản dịch vụ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Function to remove [cite:...] tags from HTML content
  const removeCiteTags = (html: string): string => {
    if (!html) return html;
    // Remove [cite_start] tags
    let cleaned = html.replace(/\[cite_start\]/g, '');
    // Remove [cite: number] or [cite: number, number, ...] tags
    cleaned = cleaned.replace(/\[cite:\s*[\d,\s]+\]/g, '');
    return cleaned;
  };

  const handleAccept = () => {
    if (!agreed) {
      message.warning("Vui lòng đồng ý với điều khoản và điều kiện để tiếp tục");
      return;
    }
    onAccept();
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      width={800}
      title={null}
      closable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="accept"
          type="primary"
          onClick={handleAccept}
          disabled={!agreed}
        >
          Xác nhận tạo đơn hàng
        </Button>,
      ]}
      centered
      className="stipulation-modal"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip="Đang tải điều khoản..." />
          </div>
        ) : (
          <>
            {/* Content container with scrollable area */}
            <div
              className="border border-gray-200 rounded-lg p-6 max-h-[500px] overflow-y-auto bg-white"
              style={{ 
                fontSize: "14px", 
                lineHeight: "1.8",
                color: "#000000"
              }}
              dangerouslySetInnerHTML={{
                __html: removeCiteTags(stipulation?.content || "<p>Không có nội dung điều khoản</p>"),
              }}
            />

            {/* Agreement checkbox */}
            <div className="pt-4 border-t border-gray-200">
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="text-base"
              >
                <span className="font-medium">
                  Tôi đã đọc và đồng ý với các điều khoản và điều kiện sử dụng dịch vụ
                </span>
              </Checkbox>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
