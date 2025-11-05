import React from 'react';
import IssuesButton from './IssuesButton';
import IssuesSidebar from './IssuesSidebar';
import IssueModal from './IssueModal';
import { useIssuesContext } from '@/context/IssuesContext';

/**
 * Main Issues Widget component
 * Combines button, sidebar, and modal for complete Issues UI
 */
const IssuesWidget: React.FC = () => {
  const { isOpen } = useIssuesContext();

  return (
    <>
      {/* Button (always visible) */}
      <IssuesButton />

      {/* Sidebar (shown when button clicked) */}
      {isOpen && <IssuesSidebar />}

      {/* Modal (shown when new issue arrives) */}
      <IssueModal />
    </>
  );
};

export default IssuesWidget;
