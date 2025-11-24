import { useState, useEffect, useRef } from "react";
import { Card, Button, Skeleton, Typography, App, Space } from "antd";
import { SaveOutlined, UndoOutlined } from "@ant-design/icons";
import { stipulationService } from "@/services/stipulationService";
import type { StipulationResponse } from "@/services/stipulationService";

const { Title, Text } = Typography;

export default function StipulationSettings() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stipulation, setStipulation] = useState<StipulationResponse | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStipulation();
  }, []);

  const fetchStipulation = async () => {
    setLoading(true);
    try {
      const data = await stipulationService.getStipulationForAdmin();
      setStipulation(data);
      setOriginalContent(data.content);
    } catch (error: any) {
      console.error("Error fetching stipulation:", error);
      message.error("Không thể tải điều khoản. Vui lòng thử lại.");
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

  const handleSave = async () => {
    if (!editorRef.current) {
      message.error("Không thể lưu nội dung. Vui lòng thử lại.");
      return;
    }

    const newContent = editorRef.current.innerHTML;
    
    if (!newContent.trim()) {
      message.error("Nội dung không được để trống.");
      return;
    }

    setSaving(true);
    try {
      await stipulationService.updateStipulation(newContent);
      setOriginalContent(newContent);
      message.success("Đã lưu điều khoản thành công");
      fetchStipulation(); // Refresh data
    } catch (error: any) {
      console.error("Error saving stipulation:", error);
      message.error("Không thể lưu điều khoản. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (editorRef.current && originalContent) {
      editorRef.current.innerHTML = originalContent;
      message.info("Đã khôi phục nội dung ban đầu");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Quản lý điều khoản dịch vụ</Title>
        <Text type="secondary">
          Chỉnh sửa nội dung điều khoản và điều kiện sử dụng dịch vụ. 
          Bạn có thể chỉnh sửa văn bản nhưng không nên thay đổi cấu trúc HTML.
        </Text>
      </div>

      <Card
        title="Nội dung điều khoản"
        extra={
          <Space>
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
            >
              Khôi phục
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              Lưu thay đổi
            </Button>
          </Space>
        }
      >
        {/* <div className="mb-4">
          <Text type="warning">
            <strong>Lưu ý:</strong> Bạn có thể chỉnh sửa nội dung văn bản, nhưng không nên thay đổi 
            cấu trúc HTML (các thẻ h2, h3, p, div, strong, v.v.). Việc thay đổi cấu trúc có thể 
            làm giao diện hiển thị không đúng.
          </Text>
        </div> */}

        {/* Editable Content Area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="border border-gray-300 rounded-lg p-6 min-h-[600px] focus:outline-none focus:border-blue-500"
          style={{ 
            fontSize: "14px", 
            lineHeight: "1.8",
            backgroundColor: "#ffffff",
            color: "#000000"
          }}
          dangerouslySetInnerHTML={{
            __html: removeCiteTags(stipulation?.content || ""),
          }}
        />

        <div className="mt-4">
          <Text type="secondary" className="text-xs">
            Nội dung được lưu dưới dạng HTML. Vui lòng kiểm tra kỹ trước khi lưu.
          </Text>
        </div>
      </Card>
    </div>
  );
}
