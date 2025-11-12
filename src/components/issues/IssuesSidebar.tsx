import React, { useEffect } from 'react';
import { Drawer, List, Tag, Button, Empty, Spin, Radio, Typography, Badge } from 'antd';
import { 
  CloseOutlined, 
  EyeOutlined, 
  AlertOutlined,
  CarOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useIssuesContext } from '@/context/IssuesContext';
import { getIssueStatusColor, getIssueStatusLabel } from '@/models/Issue';
import type { Issue } from '@/models/Issue';

const { Title, Text, Paragraph } = Typography;

const IssuesSidebar: React.FC = () => {
  const navigate = useNavigate();
  const {
    issues,
    isOpen,
    isLoading,
    statusFilter,
    error,
    toggleIssues,
    setStatusFilter,
    fetchIssues,
  } = useIssuesContext();

  // Fetch issues on mount
  useEffect(() => {
    if (isOpen) {
      fetchIssues();
    }
  }, [isOpen, fetchIssues]);

  // Filter issues based on status
  const filteredIssues = React.useMemo(() => {
    if (statusFilter === 'ALL') return issues;
    return issues.filter((issue) => issue.status === statusFilter);
  }, [issues, statusFilter]);

  // Calculate urgency score for highlighting
  const getUrgencyScore = (issue: Issue): number => {
    if (issue.status === 'OPEN') return 3;
    if (issue.status === 'IN_PROGRESS') return 2;
    return 1;
  };

  // Navigate to issue detail
  const handleViewDetail = (issueId: string) => {
    navigate(`/staff/issues/${issueId}`);
    toggleIssues();
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <AlertOutlined className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-lg">Danh sách sự cố</div>
            <div className="text-white/80 text-xs">Theo dõi và xử lý sự cố</div>
          </div>
          <Badge 
            count={filteredIssues.length} 
            showZero
            style={{ backgroundColor: '#fff', color: '#dc2626', fontWeight: 'bold' }}
          />
        </div>
      }
      placement="right"
      onClose={toggleIssues}
      open={isOpen}
      width={480}
      closeIcon={<CloseOutlined className="text-white" />}
      headerStyle={{
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        borderBottom: 'none',
        padding: '16px 24px'
      }}
      extra={
        <Button 
          type="default" 
          onClick={() => navigate('/staff/issues')}
          className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-white/50"
        >
          Xem tất cả
        </Button>
      }
    >
      {/* Status Filter */}
      <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
        <div className="text-xs font-semibold text-red-600 mb-2">Lọc theo trạng thái</div>
        <Radio.Group
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          buttonStyle="solid"
          size="middle"
          className="w-full"
        >
          <div className="grid grid-cols-2 gap-2">
            <Radio.Button value="ALL" className="text-center">
              <CheckCircleOutlined className="mr-1" />
              Tất cả
            </Radio.Button>
            <Radio.Button value="OPEN" className="text-center">
              <ClockCircleOutlined className="mr-1" />
              Chờ xử lý
            </Radio.Button>
            <Radio.Button value="IN_PROGRESS" className="text-center">
              <SyncOutlined className="mr-1" />
              Đang xử lý
            </Radio.Button>
            <Radio.Button value="RESOLVED" className="text-center">
              <CheckCircleOutlined className="mr-1" />
              Đã giải quyết
            </Radio.Button>
          </div>
        </Radio.Group>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-2">
            <AlertOutlined className="text-red-500" />
            <Text type="danger" className="font-medium">{error}</Text>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredIssues.length === 0 && (
        <Empty
          description={
            statusFilter === 'ALL'
              ? 'Chưa có sự cố nào'
              : `Không có sự cố ${getIssueStatusLabel(statusFilter)}`
          }
        />
      )}

      {/* Issues list */}
      {!isLoading && filteredIssues.length > 0 && (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const urgency = getUrgencyScore(issue);
            const isUrgent = urgency === 3;

            return (
              <div
                key={issue.id}
                className={`
                  relative rounded-xl p-4 transition-all duration-300 cursor-pointer
                  hover:shadow-lg hover:-translate-y-0.5
                  ${isUrgent 
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-400 shadow-lg' 
                    : 'bg-white border border-gray-200 shadow-sm hover:border-red-300'
                  }
                `}
                onClick={() => handleViewDetail(issue.id)}
              >
                {/* Urgent Badge */}
                {isUrgent && (
                  <div className="absolute -top-2 -right-2">
                    <Badge 
                      count="KHẨN CẤP" 
                      className="animate-pulse"
                      style={{ 
                        backgroundColor: '#dc2626',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                      }} 
                    />
                  </div>
                )}

                {/* Issue Type - Nổi bật */}
                <div className="mb-3">
                  {issue.issueTypeEntity ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                        <AlertOutlined className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="font-bold text-red-700 text-base">
                          {issue.issueTypeEntity.issueTypeName}
                        </div>
                        <div className="text-xs text-red-500">Loại sự cố</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-sm">
                        <AlertOutlined className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 text-base">
                          Sự cố không xác định
                        </div>
                        <div className="text-xs text-gray-500">Loại sự cố</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status - Góc phải */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    {/* Description */}
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      className="text-gray-800 font-medium text-sm mb-0 leading-relaxed"
                    >
                      {issue.description}
                    </Paragraph>
                  </div>
                  <div className="ml-3">
                    <Tag 
                      color={getIssueStatusColor(issue.status)}
                      className="font-semibold px-3 py-1 rounded-full shadow-sm"
                    >
                      {getIssueStatusLabel(issue.status)}
                    </Tag>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-2 mb-3">
                  {/* Vehicle Info */}
                  {issue.vehicleAssignment?.vehicle && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <CarOutlined className="text-blue-600 text-xs" />
                      </div>
                      <Text className="text-gray-600">
                        <span className="font-semibold text-gray-800">Xe:</span> {issue.vehicleAssignment.vehicle.licensePlateNumber}
                      </Text>
                    </div>
                  )}

                  {/* Driver Info */}
                  {issue.vehicleAssignment?.driver1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <UserOutlined className="text-green-600 text-xs" />
                      </div>
                      <Text className="text-gray-600">
                        <span className="font-semibold text-gray-800">Tài xế:</span> {issue.vehicleAssignment.driver1.fullName || 'N/A'}
                      </Text>
                    </div>
                  )}

                  {/* Staff Info */}
                  {issue.staff && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <TeamOutlined className="text-purple-600 text-xs" />
                      </div>
                      <Text className="text-gray-600">
                        <span className="font-semibold text-gray-800">Xử lý:</span> {issue.staff.fullName}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    className="bg-red-600 hover:bg-red-700 border-none shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(issue.id);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default IssuesSidebar;
