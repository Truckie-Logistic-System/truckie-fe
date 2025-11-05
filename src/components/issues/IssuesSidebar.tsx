import React, { useEffect } from 'react';
import { Drawer, List, Tag, Button, Empty, Spin, Radio, Typography } from 'antd';
import { CloseOutlined, EyeOutlined } from '@ant-design/icons';
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Title level={4} style={{ margin: 0 }}>
              Danh sách sự cố
            </Title>
            <Tag color="red">{filteredIssues.length}</Tag>
          </div>
        </div>
      }
      placement="right"
      onClose={toggleIssues}
      open={isOpen}
      width={450}
      closeIcon={<CloseOutlined />}
      extra={
        <Button type="primary" onClick={() => navigate('/staff/issues')}>
          Xem tất cả
        </Button>
      }
    >
      {/* Status Filter */}
      <div className="mb-4">
        <Radio.Group
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="ALL">Tất cả</Radio.Button>
          <Radio.Button value="OPEN">Chờ xử lý</Radio.Button>
          <Radio.Button value="IN_PROGRESS">Đang xử lý</Radio.Button>
          <Radio.Button value="RESOLVED">Đã giải quyết</Radio.Button>
        </Radio.Group>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <Text type="danger">{error}</Text>
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
        <List
          dataSource={filteredIssues}
          renderItem={(issue) => {
            const urgency = getUrgencyScore(issue);
            const isUrgent = urgency === 3;

            return (
              <List.Item
                key={issue.id}
                className={`
                  transition-all duration-200 hover:shadow-md rounded p-3 mb-2
                  ${isUrgent ? 'bg-red-50 border-2 border-red-300' : 'bg-white border border-gray-200'}
                `}
              >
                <div className="w-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Tag color={getIssueStatusColor(issue.status)}>
                        {getIssueStatusLabel(issue.status)}
                      </Tag>
                      {issue.issueTypeEntity && (
                        <Tag color="blue">{issue.issueTypeEntity.issueTypeName}</Tag>
                      )}
                    </div>
                    {isUrgent && (
                      <Tag color="red" className="animate-pulse">
                        KHẨN CẤP
                      </Tag>
                    )}
                  </div>

                  {/* Description */}
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ margin: 0 }}
                    className="text-gray-800 font-medium"
                  >
                    {issue.description}
                  </Paragraph>

                  {/* Vehicle Info */}
                  {issue.vehicleAssignment?.vehicle && (
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs">
                        Xe: {issue.vehicleAssignment.vehicle.licensePlateNumber}
                      </Text>
                    </div>
                  )}

                  {/* Driver Info */}
                  {issue.vehicleAssignment?.driver1 && (
                    <div className="mt-1">
                      <Text type="secondary" className="text-xs">
                        Tài xế: {issue.vehicleAssignment.driver1.user?.fullName || 'N/A'}
                      </Text>
                    </div>
                  )}

                  {/* Staff Info */}
                  {issue.staff && (
                    <div className="mt-1">
                      <Text type="secondary" className="text-xs">
                        Đang xử lý: {issue.staff.fullName}
                      </Text>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="primary"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(issue.id)}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
};

export default IssuesSidebar;
