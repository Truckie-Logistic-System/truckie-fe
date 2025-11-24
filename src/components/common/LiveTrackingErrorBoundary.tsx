import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card, Alert, Button, Space } from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component specifically for Live Tracking components
 * Prevents entire page crashes when map or WebSocket operations fail
 */
class LiveTrackingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LiveTrackingErrorBoundary] Caught error:', error);
    console.error('[LiveTrackingErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service if available
    // You can integrate with services like Sentry here
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `LiveTracking Error: ${error.message}`,
        fatal: false
      });
    }
  }

  handleRetry = () => {
    // Clear localStorage cache that might be corrupted
    try {
      localStorage.removeItem('vietmap_style_cache');
      localStorage.removeItem('mapbox-gl-style-cache');
    } catch (e) {
      console.warn('[LiveTrackingErrorBoundary] Failed to clear cache:', e);
    }

    // Reset error state - this will remount the component without full page reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // NOTE: Full page reload is kept as last resort option for critical errors
    // that cannot be recovered by component remount alone.
    // This maintains user choice while preferring the SPA-friendly "Thử lại" button.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card className="mb-6 shadow-md rounded-xl">
          <Alert
            message="Lỗi hiển thị bản đồ theo dõi"
            description="Đã xảy ra lỗi khi tải bản đồ theo dõi GPS. Vui lòng thử lại."
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
            className="mb-4"
          />
          
          <div className="text-center">
            <Space direction="vertical" size="middle">
              <div>
                <p className="text-gray-600 mb-2">
                  Bạn có thể thử các cách sau để khắc phục:
                </p>
                <ul className="text-left text-sm text-gray-500 mb-4">
                  <li>• Thử lại để tải lại bản đồ</li>
                  <li>• Kiểm tra kết nối internet</li>
                  <li>• Làm mới trang nếu vẫn gặp lỗi</li>
                </ul>
              </div>
              
              <Space>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleRetry}
                  size="large"
                >
                  Thử lại
                </Button>
                <Button 
                  onClick={this.handleReload}
                  size="large"
                >
                  Làm mới trang
                </Button>
              </Space>
            </Space>
          </div>

          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-gray-50 rounded-lg">
              <summary className="cursor-pointer font-medium text-red-600 mb-2">
                Chi tiết lỗi (Development)
              </summary>
              <div className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                <strong>Error:</strong> {this.state.error.message}
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </div>
            </details>
          )}
        </Card>
      );
    }

    return this.props.children;
  }
}

export default LiveTrackingErrorBoundary;
