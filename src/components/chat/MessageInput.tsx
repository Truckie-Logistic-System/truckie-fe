import React, { useState } from 'react';
import { Input, Button, Upload, message as antdMessage, Image } from 'antd';
import {
  SendOutlined,
  PictureOutlined,
  LoadingOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import type { MessageRequest } from '@/models/Chat';
import { useChatMessage } from '@/hooks/useChatMessage';

const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { activeConversation, connectionStatus } = useChatContext();
  const { sendMessage: sendChatMessage, uploadChatImage } = useChatMessage();
  const userId = sessionStorage.getItem('userId');

  // ✅ Xử lý khi Ctrl+V dán ảnh
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (!imageItem) return; // không có ảnh thì bỏ qua
    e.preventDefault();

    const blob = imageItem.getAsFile();
    if (blob) {
      setFile(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    }
  };

  // Chọn file bằng nút upload
  const handleFileChange = (file: File) => {
    setFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false; // không upload ngay
  };

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!inputValue.trim() && !file) return;
    if (!activeConversation) return antdMessage.error('Không có cuộc hội thoại đang hoạt động');
    if (!userId) return antdMessage.error('Bạn chưa đăng nhập');
    if (connectionStatus !== 'connected') return antdMessage.error('Kết nối WebSocket chưa sẵn sàng');

    setSending(true);

    try {
      let messageToSend = inputValue.trim();
      let messageType: 'TEXT' | 'IMAGE' = 'TEXT';

      if (file) {
        const result = await uploadChatImage({
          file,
          senderId: userId,
          roomId: activeConversation.roomId,
        });

        if (result.success && result.url) {
          messageToSend = result.url;
          messageType = 'IMAGE';
        } else {
          throw new Error(result.error || 'Không thể upload ảnh');
        }
      }

      const messageRequest: MessageRequest = {
        roomId: activeConversation.roomId,
        senderId: userId,
        message: messageToSend,
        type: messageType,
      };

      const result = sendChatMessage(undefined, activeConversation.roomId, messageRequest);
      if (!result.success) {
        antdMessage.error(result.message || 'Không thể gửi tin nhắn');
      }

      // Reset
      setInputValue('');
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Send message error:', error);
      antdMessage.error('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4 bg-white">
      {/* Hiển thị preview ảnh */}
      {previewUrl && (
        <div className="mb-2 relative w-fit">
          <Image
            src={previewUrl}
            alt="preview"
            width={150}
            height={100}
            className="rounded-md border object-cover"
          />
          <CloseCircleFilled
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
            }}
            className="absolute -top-2 -right-2 text-red-500 bg-white rounded-full cursor-pointer text-lg shadow"
          />
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Upload
          beforeUpload={handleFileChange}
          showUploadList={false}
          accept="image/*"
          disabled={sending}
        >
          <Button icon={<PictureOutlined />} />
        </Upload>

        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handlePaste} // 👈 Dán ảnh Ctrl+V
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn hoặc dán ảnh (Ctrl + V)..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          disabled={sending || connectionStatus !== 'connected'}
          className="flex-1"
        />

        <Button
          type="primary"
          icon={sending ? <LoadingOutlined /> : <SendOutlined />}
          onClick={handleSend}
          disabled={(!inputValue.trim() && !file) || connectionStatus !== 'connected'}
        >
          Gửi
        </Button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {connectionStatus === 'connected' && '🟢 Đã kết nối'}
        {connectionStatus === 'connecting' && '🟡 Đang kết nối...'}
        {connectionStatus === 'disconnected' && '🔴 Mất kết nối'}
        {connectionStatus === 'error' && '❌ Lỗi kết nối'}
      </div>
    </div>
  );
};

export default MessageInput;
