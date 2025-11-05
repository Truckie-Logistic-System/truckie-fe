import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Spin,
  Button,
  Tag,
  Descriptions,
  Alert,
  Space,
  message,
  Modal,
  Typography,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';
import issueService from '@/services/issue/issueService';
import { getIssueStatusColor, getIssueStatusLabel, getIssueCategoryLabel, getIssueCategoryColor } from '@/models/Issue';
import { useAuth } from '@/context/AuthContext';
import SealReplacementDetail from './components/SealReplacementDetail';

const { Title, Text } = Typography;
const { confirm } = Modal;

const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch issue details
  useEffect(() => {
    if (id) {
      fetchIssueDetail();
    }
  }, [id]);

  const fetchIssueDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await issueService.getIssueById(id);
      console.log('[IssueDetailPage] 📊 Fetched issue data:', data);
      console.log('[IssueDetailPage] 🏷️ Issue category:', data.issueCategory);
      console.log('[IssueDetailPage] 🔍 Is SEAL_REPLACEMENT?', data.issueCategory === 'SEAL_REPLACEMENT');
      setIssue(data);
    } catch (err: any) {
      console.error('Error fetching issue:', err);
      setError(err.message || 'Không thể tải thông tin sự cố');
      message.error('Không thể tải thông tin sự cố');
    } finally {
      setLoading(false);
    }
  };

  // Handle assign self to issue
  const handleAssignSelf = () => {
    if (!issue || !user) return;

    const isReplacing = issue?.staff;
    confirm({
      title: isReplacing ? 'Xác nhận nhận xử lý sự cố (thay thế)' : 'Xác nhận nhận xử lý sự cố',
      content: isReplacing 
        ? `Bạn có chắc muốn nhận xử lý sự cố này thay cho ${issue.staff?.fullName || 'nhân viên hiện tại'}?`
        : 'Bạn có chắc muốn nhận xử lý sự cố này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setActionLoading(true);
        try {
          const updated = await issueService.assignStaffToIssue(issue.id, user.id);
          setIssue(updated);
          message.success(isReplacing ? 'Đã nhận xử lý sự cố (thay thế) thành công!' : 'Đã nhận xử lý sự cố thành công!');
        } catch (err: any) {
          console.error('Error assigning staff:', err);
          message.error(err.message || 'Không thể nhận xử lý sự cố');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Handle mark as resolved
  const handleMarkResolved = () => {
    if (!issue) return;

    confirm({
      title: 'Xác nhận đã giải quyết',
      content: 'Bạn có chắc sự cố này đã được giải quyết? Trạng thái của các chuyến hàng sẽ được khôi phục về trước khi gặp sự cố.',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setActionLoading(true);
        try {
          const updated = await issueService.resolveIssue(issue.id);
          setIssue(updated);
          message.success('Đã giải quyết sự cố thành công! Trạng thái các chuyến hàng đã được khôi phục.');
        } catch (err: any) {
          console.error('Error resolving issue:', err);
          message.error(err.message || 'Không thể giải quyết sự cố');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-6">
        <Alert message="Lỗi" description={error || 'Không tìm thấy sự cố'} type="error" showIcon />
        <Button type="primary" onClick={() => navigate('/staff/issues')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/staff/issues')}
          className="mb-4"
        >
          Quay lại
        </Button>

        <div className="flex items-center justify-between">
          <Title level={2} className="m-0">
            Chi tiết sự cố
          </Title>

          <Space>
            {issue.status === 'OPEN' && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleAssignSelf}
                loading={actionLoading}
              >
                {issue.staff ? 'Nhận xử lý (thay thế)' : 'Nhận xử lý'}
              </Button>
            )}

            {/* Hide resolve button for SEAL_REPLACEMENT - auto-resolved when driver confirms */}
            {issue.status === 'IN_PROGRESS' && 
             issue.staff?.id === user?.id && 
             issue.issueCategory !== 'SEAL_REPLACEMENT' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkResolved}
                loading={actionLoading}
                danger
              >
                Đánh dấu đã giải quyết
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Status Alert */}
      {issue.status === 'OPEN' && (
        <Alert
          message="Sự cố đang chờ xử lý"
          description="Sự cố này chưa có nhân viên phụ trách. Vui lòng nhận xử lý để tiếp tục."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      {issue.status === 'IN_PROGRESS' && (
        <Alert
          message="Đang xử lý"
          description={`Sự cố đang được xử lý bởi ${issue.staff?.fullName || 'N/A'}`}
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {issue.status === 'RESOLVED' && (
        <Alert
          message="Đã giải quyết"
          description="Sự cố này đã được giải quyết thành công"
          type="success"
          showIcon
          className="mb-4"
        />
      )}

      {/* Main Info Card */}
      <Card title="Thông tin sự cố" className="mb-4">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Phân loại">
            <Tag color={getIssueCategoryColor(issue.issueCategory)}>
              {getIssueCategoryLabel(issue.issueCategory)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            <Tag color={getIssueStatusColor(issue.status)}>
              {getIssueStatusLabel(issue.status)}
            </Tag>
          </Descriptions.Item>

          {issue.issueTypeEntity && (
            <Descriptions.Item label="Loại sự cố">
              <Tag color="blue">{issue.issueTypeEntity.issueTypeName}</Tag>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Mô tả">{issue.description}</Descriptions.Item>

          <Descriptions.Item label="Thời gian báo cáo">
            {issue.reportedAt ? new Date(issue.reportedAt).toLocaleString('vi-VN') : 'N/A'}
          </Descriptions.Item>

          {issue.resolvedAt && (
            <Descriptions.Item label="Thời gian giải quyết">
              {new Date(issue.resolvedAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          )}

          {issue.staff && (
            <Descriptions.Item label="Nhân viên xử lý">{issue.staff.fullName}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Seal Replacement Details - Only show for SEAL_REPLACEMENT category */}
      {(() => {
        console.log('[IssueDetailPage] 🔍 Checking seal replacement render condition');
        console.log('[IssueDetailPage] issue.issueCategory:', issue.issueCategory);
        console.log('[IssueDetailPage] Should render?', issue.issueCategory === 'SEAL_REPLACEMENT');
        return issue.issueCategory === 'SEAL_REPLACEMENT' ? (
          <div className="mb-4">
            <SealReplacementDetail issue={issue} onUpdate={setIssue} />
          </div>
        ) : null;
      })()}

      {/* Vehicle & Driver Info */}
      {issue.vehicleAssignment && (
        <Card title="Thông tin phương tiện & Tài xế" className="mb-4">
          <Descriptions column={2} bordered>
            {issue.vehicleAssignment.vehicle && (
              <>
                <Descriptions.Item label="Biển số xe">
                  {issue.vehicleAssignment.vehicle.licensePlateNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Model">
                  {issue.vehicleAssignment.vehicle.model || 'N/A'}
                </Descriptions.Item>
              </>
            )}

            {issue.vehicleAssignment.driver1 && (
              <>
                <Descriptions.Item label="Tài xế 1">
                  {issue.vehicleAssignment.driver1.fullName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {issue.vehicleAssignment.driver1.phoneNumber || 'N/A'}
                </Descriptions.Item>
              </>
            )}

            {issue.vehicleAssignment.driver2 && (
              <>
                <Descriptions.Item label="Tài xế 2">
                  {issue.vehicleAssignment.driver2.fullName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {issue.vehicleAssignment.driver2.phoneNumber || 'N/A'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Location Card */}
      {issue.locationLatitude && issue.locationLongitude && (
        <Card
          title={
            <Space>
              <EnvironmentOutlined />
              <span>Vị trí sự cố</span>
            </Space>
          }
          className="mb-4"
        >
          <div className="text-gray-700">
            <div>
              <Text strong>Latitude:</Text> {issue.locationLatitude}
            </div>
            <div>
              <Text strong>Longitude:</Text> {issue.locationLongitude}
            </div>

            <Divider />

            <Button
              type="link"
              href={`https://www.google.com/maps?q=${issue.locationLatitude},${issue.locationLongitude}`}
              target="_blank"
              icon={<EnvironmentOutlined />}
            >
              Xem trên Google Maps
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default IssueDetailPage;
