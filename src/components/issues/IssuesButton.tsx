import React from 'react';
import { Badge, Tooltip } from 'antd';
import { AlertOutlined, LoadingOutlined } from '@ant-design/icons';
import { useIssuesContext } from '@/context/IssuesContext';

const IssuesButton: React.FC = () => {
  const { toggleIssues, issues, isConnected, isLoading } = useIssuesContext();

  // Count urgent issues (OPEN status)
  const urgentCount = issues.filter((issue) => issue.status === 'OPEN').length;

  return (
    <div className="fixed bottom-4 right-24 z-50">
      <Tooltip title={isConnected ? 'Danh sách sự cố' : 'Đang kết nối...'} placement="left">
        <Badge count={urgentCount} overflowCount={99} offset={[-5, 5]}>
          <div
            onClick={toggleIssues}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center 
              shadow-lg cursor-pointer transition-all duration-200
              ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400 hover:bg-gray-500'}
              ${urgentCount > 0 ? 'animate-pulse' : ''}
            `}
          >
            {isLoading ? (
              <LoadingOutlined style={{ fontSize: '24px', color: 'white' }} spin />
            ) : (
              <AlertOutlined style={{ fontSize: '24px', color: 'white' }} />
            )}
          </div>
        </Badge>
      </Tooltip>

      {/* Connection indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white">
        <div
          className={`
            w-full h-full rounded-full
            ${isConnected ? 'bg-green-400' : 'bg-gray-400'}
          `}
        />
      </div>
    </div>
  );
};

export default IssuesButton;
