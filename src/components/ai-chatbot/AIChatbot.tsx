import { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Spin, 
  Tag, 
  Modal, 
  Card, 
  Avatar, 
  Tooltip, 
  Badge, 
  Divider, 
  Typography 
} from 'antd';
import { 
  MessageOutlined, 
  SendOutlined, 
  CloseOutlined, 
  RobotOutlined, 
  DeleteOutlined,
  UserOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useAuth } from '@/context';

const { Text, Paragraph } = Typography;

// Format markdown text (handle **, ##, *, -, ```)
const formatMarkdown = (text: string) => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Handle headers (##)
    if (line.startsWith('## ')) {
      return <h3 key={lineIndex} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h3>;
    }
    if (line.startsWith('### ')) {
      return <h4 key={lineIndex} className="text-base font-bold mt-2 mb-1">{line.substring(4)}</h4>;
    }
    
    // Handle code blocks (```)
    if (line.startsWith('```')) {
      return <div key={lineIndex} className="bg-gray-100 px-2 py-1 rounded text-xs font-mono my-1">{line.substring(3)}</div>;
    }
    
    // Handle bullet points (*, -)
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      return <li key={lineIndex} className="ml-4 mb-1">{formatInlineMarkdown(content)}</li>;
    }
    
    // Regular line with inline formatting
    return <div key={lineIndex}>{formatInlineMarkdown(line)}</div>;
  });
};

// Format inline markdown (**, `, etc.)
const formatInlineMarkdown = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, index) => {
    // Handle inline code (`)
    if (part.includes('`')) {
      const codeParts = part.split('`');
      return codeParts.map((codePart, codeIndex) => 
        codeIndex % 2 === 1 
          ? <code key={`${index}-${codeIndex}`} className="bg-gray-100 px-1 rounded text-xs">{codePart}</code>
          : codePart
      );
    }
    // Handle bold (**)
    return index % 2 === 1 ? <strong key={index}>{part}</strong> : part;
  });
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  priceEstimate?: PriceEstimate;
  suggestedActions?: SuggestedAction[];
}

interface PriceEstimate {
  distance: number;
  weight: number;
  vehicleType: string;
  estimatedPrice: number;
  breakdown: string;
}

interface SuggestedAction {
  label: string;
  action: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface AIChatbotProps {
  onOpen?: () => void;
}

export default function AIChatbot({ onOpen }: AIChatbotProps) {
  const { user } = useAuth(); // Get current logged-in user
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [personality, setPersonality] = useState('FRIENDLY');
  const [showScrollButton, setShowScrollButton] = useState(false);

  // LocalStorage keys with user ID isolation
  const STORAGE_KEY_MESSAGES = `ai_chat_messages_${user?.id || 'anonymous'}`;
  const STORAGE_KEY_SESSION = `ai_chat_session_${user?.id || 'anonymous'}`;
  const STORAGE_KEY_PERSONALITY = `ai_chat_personality_${user?.id || 'anonymous'}`;
  const OLD_STORAGE_KEY_MESSAGES = 'ai_chat_messages';
  const OLD_STORAGE_KEY_SESSION = 'ai_chat_session';
  const OLD_STORAGE_KEY_PERSONALITY = 'ai_chat_personality';

  // Load chat history from localStorage on mount with user ID isolation and migration
  useEffect(() => {
    // Migration: Move old generic keys to user-specific keys for current user
    if (user?.id) {
      const oldMessages = localStorage.getItem(OLD_STORAGE_KEY_MESSAGES);
      const oldSession = localStorage.getItem(OLD_STORAGE_KEY_SESSION);
      const oldPersonality = localStorage.getItem(OLD_STORAGE_KEY_PERSONALITY);
      
      // Only migrate if old data exists and user-specific data doesn't exist yet
      if (oldMessages && !localStorage.getItem(STORAGE_KEY_MESSAGES)) {
        localStorage.setItem(STORAGE_KEY_MESSAGES, oldMessages);
        console.log(`[AIChatbot] Migrated chat messages for user ${user.id}`);
      }
      
      if (oldSession && !localStorage.getItem(STORAGE_KEY_SESSION)) {
        localStorage.setItem(STORAGE_KEY_SESSION, oldSession);
        console.log(`[AIChatbot] Migrated session for user ${user.id}`);
      }
      
      if (oldPersonality && !localStorage.getItem(STORAGE_KEY_PERSONALITY)) {
        localStorage.setItem(STORAGE_KEY_PERSONALITY, oldPersonality);
        console.log(`[AIChatbot] Migrated personality for user ${user.id}`);
      }
      
      // Clear old generic keys to prevent data leakage between accounts
      localStorage.removeItem(OLD_STORAGE_KEY_MESSAGES);
      localStorage.removeItem(OLD_STORAGE_KEY_SESSION);
      localStorage.removeItem(OLD_STORAGE_KEY_PERSONALITY);
    }
    
    // Load user-specific chat history
    const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
    
    if (savedSession) {
      setSessionId(savedSession);
    }
  }, []);

  // Save to localStorage whenever messages or sessionId changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
    }
  }, [sessionId]);

  // Load personality from localStorage or backend
  useEffect(() => {
    const loadPersonality = async () => {
      // First check localStorage
      const savedPersonality = localStorage.getItem(STORAGE_KEY_PERSONALITY);
      if (savedPersonality) {
        setPersonality(savedPersonality);
        return;
      }

      // If user is logged in, fetch from backend
      if (user?.id) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/public/chat/personality/${user.id}`);
          if (response.ok) {
            const data = await response.text();
            setPersonality(data);
            localStorage.setItem(STORAGE_KEY_PERSONALITY, data);
          }
        } catch (e) {
          console.error('Failed to load personality:', e);
        }
      }
    };

    loadPersonality();
  }, [user?.id]);

  // Welcome message (separate effect)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Xin chào! Tôi là trợ lý AI của Truckie 🤖\n\nTôi có thể giúp bạn:\n- Tính phí vận chuyển\n- Tìm hiểu quy trình đặt hàng\n- Giải đáp thắc mắc về dịch vụ\n- Và nhiều hơn nữa!\n\nBạn cần giúp gì?`,
        timestamp: new Date(),
        suggestedActions: [
          { label: 'Tính phí vận chuyển', action: 'Tính phí vận chuyển 3 tấn, 50km' },
          { label: 'Quy trình đặt hàng', action: 'Quy trình đặt hàng như thế nào?' },
          { label: 'Chính sách thanh toán', action: 'Chính sách thanh toán ra sao?' }
        ]
      }]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when chat opens (with any message count) or when user sends message
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      // Scroll when opening chat to show latest message
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  // Handle scroll detection for showing scroll button
  useEffect(() => {
    const handleScroll = () => {
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
        setShowScrollButton(!isAtBottom && messages.length > 2);
      }
    };

    // Add scroll listener when chat is open
    if (isOpen) {
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        messagesContainer.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial position
      }
    }

    return () => {
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen, messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Scroll to bottom after user sends message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          userId: user?.id || null // Pass user ID for personalized responses
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Update session ID
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        priceEstimate: data.priceEstimate,
        suggestedActions: data.suggestedActions
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hotline để được hỗ trợ.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    sendMessage(action);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearChat = () => {
    // Direct clear without confirmation
    setMessages([]);
    setSessionId(undefined);
    // Clear user-specific localStorage
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    console.log(`[AIChatbot] Cleared chat history for user ${user?.id || 'anonymous'}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePersonalityChange = async (newPersonality: string) => {
    setPersonality(newPersonality);
    localStorage.setItem(STORAGE_KEY_PERSONALITY, newPersonality);

    // Save to backend if user is logged in
    if (user?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/public/chat/personality?userId=${user.id}&personality=${newPersonality}`, {
          method: 'POST'
        });
      } catch (e) {
        console.error('Failed to save personality:', e);
      }
    }

    setShowSettings(false);
  };

  return (
    <>
      {/* Floating button with badge - always visible */}
      <Tooltip title="Trợ lý AI - Hỗ trợ 24/7" placement="left">
          <Badge 
            count={messages.length > 0 ? messages.length : 0} 
            offset={[-5, 5]}
            style={{ backgroundColor: '#52c41a' }}
          >
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<RobotOutlined />}
              className="fixed shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
              style={{
                width: '64px',
                height: '64px',
                fontSize: '28px',
                zIndex: 999,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                bottom: 'calc(1rem + 72px)', // Chat button height + small gap
                right: '1rem'
              }}
              onClick={() => {
                setIsOpen(true);
                onOpen?.(); // Notify parent to close other chat
              }}
            />
          </Badge>
        </Tooltip>

      {/* Chat window with Card */}
      {isOpen && (
        <Card
          className="fixed shadow-2xl"
          style={{
            width: '480px',
            height: '650px',
            zIndex: 999,
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bottom: '1rem',
            right: 'calc(1rem + 80px)' // Open to the left of buttons
          }}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        >
          {/* Header with Avatar */}
          <div
            className="text-white p-4 flex justify-between items-center"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar 
                size={48} 
                icon={<RobotOutlined />} 
                style={{ 
                  backgroundColor: '#fff',
                  color: '#667eea',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              />
              <div>
                <Text strong style={{ color: '#fff', fontSize: '18px', display: 'block' }}>
                  Trợ lý AI Truckie
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  <ThunderboltOutlined /> Hỗ trợ 24/7 - Powered by Gemini
                </Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip title="Cài đặt AI">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  className="text-white hover:bg-white/20"
                  size="small"
                  onClick={() => setShowSettings(true)}
                />
              </Tooltip>
              <Tooltip title="Xóa lịch sử">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  className="text-white hover:bg-white/20"
                  size="small"
                  onClick={handleClearChat}
                />
              </Tooltip>
              <Tooltip title="Đóng">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  className="text-white hover:bg-white/20"
                  onClick={handleClose}
                />
              </Tooltip>
            </div>
          </div>

          {/* Messages area */}
          <div 
            className="flex-1 overflow-y-auto p-4 relative" 
            style={{ 
              scrollBehavior: 'smooth',
              background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for assistant */}
                {msg.role === 'assistant' && (
                  <Avatar 
                    size={32} 
                    icon={<RobotOutlined />} 
                    style={{ 
                      backgroundColor: '#667eea',
                      flexShrink: 0,
                      marginTop: '4px'
                    }}
                  />
                )}
                
                <Card
                  className={`max-w-[80%] shadow-sm ${
                    msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''
                  }`}
                  style={{
                    borderRadius: '12px',
                    border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb'
                  }}
                  styles={{ body: { padding: '12px' } }}
                >
                  <Paragraph 
                    className={`whitespace-pre-wrap text-sm leading-relaxed m-0 ${
                      msg.role === 'user' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content}
                  </Paragraph>
                  
                  {/* Price estimate card */}
                  {msg.priceEstimate && (
                    <Card 
                      className="mt-3" 
                      size="small"
                      style={{ 
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge status="success" />
                        <Text strong style={{ color: '#16a34a', fontSize: '16px' }}>
                          💰 {msg.priceEstimate.estimatedPrice.toLocaleString('vi-VN')} VNĐ
                        </Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>🚛 <Text type="secondary">Xe:</Text> <Text strong>{msg.priceEstimate.vehicleType}</Text></div>
                        <div>📏 <Text type="secondary">Khoảng cách:</Text> <Text strong>{msg.priceEstimate.distance} km</Text></div>
                        <div>⚖️ <Text type="secondary">Trọng lượng:</Text> <Text strong>{msg.priceEstimate.weight} kg</Text></div>
                      </div>
                    </Card>
                  )}
                  
                  {/* Suggested actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, i) => (
                        <Tag
                          key={i}
                          color="blue"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ 
                            borderRadius: '12px',
                            padding: '4px 12px',
                            fontSize: '12px'
                          }}
                          onClick={() => handleSuggestedAction(action.action)}
                        >
                          {action.label}
                        </Tag>
                      ))}
                    </div>
                  )}
                  
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Card>
                
                {/* Avatar for user */}
                {msg.role === 'user' && (
                  <Avatar 
                    size={32} 
                    icon={<UserOutlined />} 
                    style={{ 
                      backgroundColor: '#3b82f6',
                      flexShrink: 0,
                      marginTop: '4px'
                    }}
                  />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-start gap-2 mb-4">
                <Avatar 
                  size={32} 
                  icon={<RobotOutlined />} 
                  style={{ backgroundColor: '#667eea', marginTop: '4px' }}
                />
                <Card 
                  className="shadow-sm" 
                  style={{ borderRadius: '12px' }}
                  styles={{ body: { padding: '12px' } }}
                >
                  <Spin size="small" /> <Text type="secondary" className="ml-2">Đang suy nghĩ...</Text>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
            
            {/* Scroll to bottom button */}
            {showScrollButton && (
              <div className="absolute bottom-4 right-4">
                <Tooltip title="Cuộn xuống cuối">
                  <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    icon={<DownOutlined />}
                    onClick={scrollToBottom}
                    className="shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  />
                </Tooltip>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2 mb-3">
              <Tooltip title="Xóa toàn bộ lịch sử chat">
                <Button
                  size="small"
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleClearChat}
                  danger
                >
                  Xóa lịch sử
                </Button>
              </Tooltip>
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                {messages.length} tin nhắn
              </Text>
            </div>
            <Input.Search
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSearch={sendMessage}
              enterButton={
                <Button type="primary" icon={<SendOutlined />}>
                  Gửi
                </Button>
              }
              disabled={loading}
              size="large"
              style={{ borderRadius: '8px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
              💡 Ví dụ: "Tính phí 3 tấn, 50km" hoặc "Quy trình đặt hàng?"
            </Text>
          </div>
        </Card>
      )}

      {/* Settings Modal - 2x2 Grid Layout */}
      <Modal
        title={
          <div className="text-center">
            <div className="text-xl font-bold">⚙️ Cài Đặt Trợ Lý AI</div>
            <Text type="secondary" className="text-sm">Chọn phong cách giao tiếp phù hợp với bạn</Text>
          </div>
        }
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={null}
        width={700}
        centered
      >
        <div className="space-y-4 mt-4">
          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Professional */}
            <Card
              hoverable
              className={`cursor-pointer transition-all ${
                personality === 'PROFESSIONAL' 
                  ? 'border-2 border-blue-500 shadow-lg bg-blue-50' 
                  : 'border border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handlePersonalityChange('PROFESSIONAL')}
              style={{ minHeight: '140px' }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl">👔</span>
                <Text strong className="text-base">Chuyên Nghiệp</Text>
                <Text type="secondary" className="text-xs">
                  Trang trọng, súc tích, đi thẳng vào vấn đề
                </Text>
                {personality === 'PROFESSIONAL' && (
                  <div className="mt-2 text-blue-600 font-semibold text-xs">
                    ✓ Đang sử dụng
                  </div>
                )}
              </div>
            </Card>

            {/* Card 2: Friendly */}
            <Card
              hoverable
              className={`cursor-pointer transition-all ${
                personality === 'FRIENDLY' 
                  ? 'border-2 border-green-500 shadow-lg bg-green-50' 
                  : 'border border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handlePersonalityChange('FRIENDLY')}
              style={{ minHeight: '140px' }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl">😊</span>
                <Text strong className="text-base">Thân Thiện</Text>
                <Text type="secondary" className="text-xs">
                  Gần gũi, nhiệt tình, emoji và giải thích chi tiết
                </Text>
                {personality === 'FRIENDLY' && (
                  <div className="mt-2 text-green-600 font-semibold text-xs">
                    ✓ Đang sử dụng (Mặc định)
                  </div>
                )}
              </div>
            </Card>

            {/* Card 3: Expert */}
            <Card
              hoverable
              className={`cursor-pointer transition-all ${
                personality === 'EXPERT' 
                  ? 'border-2 border-purple-500 shadow-lg bg-purple-50' 
                  : 'border border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handlePersonalityChange('EXPERT')}
              style={{ minHeight: '140px' }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl">🧠</span>
                <Text strong className="text-base">Chuyên Gia</Text>
                <Text type="secondary" className="text-xs">
                  Giải thích chuyên sâu, kỹ thuật, phân tích chi tiết
                </Text>
                {personality === 'EXPERT' && (
                  <div className="mt-2 text-purple-600 font-semibold text-xs">
                    ✓ Đang sử dụng
                  </div>
                )}
              </div>
            </Card>

            {/* Card 4: Quick */}
            <Card
              hoverable
              className={`cursor-pointer transition-all ${
                personality === 'QUICK' 
                  ? 'border-2 border-orange-500 shadow-lg bg-orange-50' 
                  : 'border border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handlePersonalityChange('QUICK')}
              style={{ minHeight: '140px' }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl">⚡</span>
                <Text strong className="text-base">Nhanh Gọn</Text>
                <Text type="secondary" className="text-xs">
                  Trả lời cực ngắn, chỉ thông tin cốt lõi
                </Text>
                {personality === 'QUICK' && (
                  <div className="mt-2 text-orange-600 font-semibold text-xs">
                    ✓ Đang sử dụng
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Divider className="my-4" />

          {/* Current Selection Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg text-center">
            <Text className="text-sm">
              💡 <Text strong>Phong cách hiện tại:</Text>{' '}
              <span className="text-lg font-bold">
                {personality === 'PROFESSIONAL' ? '👔 Chuyên Nghiệp' :
                 personality === 'EXPERT' ? '🧠 Chuyên Gia' :
                 personality === 'QUICK' ? '⚡ Nhanh Gọn' :
                 '😊 Thân Thiện'}
              </span>
            </Text>
          </div>
        </div>
      </Modal>
      
      {/* Global styles for animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
}
