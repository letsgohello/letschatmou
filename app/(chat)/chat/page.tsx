/**
 * Chat page - main interface for the job search chatbot.
 * Clean, composable UI with separate components.
 */

import { Metadata } from 'next';
import {
  ChatInterface,
  ChatInterfaceHeader,
  ChatInterfaceEmptyState,
  ChatInterfaceMessages,
  ChatInterfaceInput,
} from '@/components/chat/ChatInterface';

export const metadata: Metadata = {
  title: 'ChatMOU | Job Search Assistant',
  description: 'Ask questions about California county job positions, salaries, and requirements',
};

// Disable static generation for this page since it uses client-side features
export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return (
    <ChatInterface>
      <ChatInterfaceHeader />
      <ChatInterfaceEmptyState />
      <ChatInterfaceMessages />
      <ChatInterfaceInput />
    </ChatInterface>
  );
}
