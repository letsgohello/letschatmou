/**
 * Compound Chat Interface Component
 * 
 * Proper compound component architecture with clear subcomponents:
 * - ChatInterface.Header
 * - ChatInterface.Messages
 * - ChatInterface.Message
 * - ChatInterface.Input
 * - ChatInterface.EmptyState
 * 
 * Each subcomponent is focused and reusable.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChatStorage } from '@/lib/storage/chat-storage';
import { cn } from '@/lib/utils';
import { Send, Loader2, Copy, Check, Trash2 } from 'lucide-react';

// ============================================================================
// Context
// ============================================================================

interface ChatContextValue {
  chatId: string;
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('Chat components must be used within ChatInterface');
  }
  return context;
}

// ============================================================================
// Main Container Component
// ============================================================================

interface ChatInterfaceProps {
  children: React.ReactNode;
  className?: string;
}

function ChatInterfaceRoot({ children, className }: ChatInterfaceProps) {
  const [chatId] = useState(() => ChatStorage.createChat());
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = ChatStorage.loadMessages(chatId);
    setMessages(stored.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })));
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    ChatStorage.saveMessage(chatId, {
      role: 'user',
      content: content.trim(),
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const text = line.slice(2).replace(/^"(.*)"$/, '$1');
            assistantMessage += text;

            setMessages(prev => {
              const existing = prev.find(m => m.id === assistantId);
              if (existing) {
                return prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: assistantMessage }
                    : m
                );
              } else {
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: 'assistant' as const,
                    content: assistantMessage,
                  },
                ];
              }
            });
          }
        }
      }

      if (assistantMessage) {
        ChatStorage.saveMessage(chatId, {
          role: 'assistant',
          content: assistantMessage,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    ChatStorage.clearChat(chatId);
    setMessages([]);
  };

  const value: ChatContextValue = {
    chatId,
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    bottomRef,
  };

  return (
    <ChatContext.Provider value={value}>
      <div className={cn('flex flex-col h-screen bg-background', className)}>
        {children}
      </div>
    </ChatContext.Provider>
  );
}

// ============================================================================
// Header Subcomponent
// ============================================================================

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-8 overflow-hidden" style={{ width: '32px' }}>
        <Image 
          src="/holly-icon.png" 
          alt="Holly" 
          width={32}
          height={32}
          className="h-8 w-8"
          priority
        />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 leading-none m-0">ChatMOU</h1>
    </div>
  );
}


function Header() {
  const { messages, clearChat } = useChatContext();

  return (
    <header className="border-b bg-white px-6 py-3 flex-shrink-0">
      <div className="max-w-6xl mx-auto">
        {/* Logo unit + Reset button on same line */}
        <div className="flex items-center justify-between mb-1">
          <Logo />
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
              'text-gray-600 hover:bg-gray-100 transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
            Reset chat
          </button>
        </div>
        
        {/* Description on its own line below */}
        <p className="text-sm text-gray-500">
          {messages.length > 0
            ? `${messages.length} message${messages.length === 1 ? '' : 's'}`
            : 'Ask about salary increases, overtime, benefits...'}
        </p>
      </div>
    </header>
  );
}

// ============================================================================
// Messages Container Subcomponent
// ============================================================================

function Messages() {
  const { messages, error, bottomRef } = useChatContext();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-4">
        {messages.map((message) => (
          <Message key={message.id} {...message} />
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">
              Error: {error.message}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ============================================================================
// Individual Message Subcomponent
// ============================================================================

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function Message({ role, content }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if content contains a table (simple heuristic)
  const hasTable = content.includes('|') && content.split('\n').length > 3;

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-start' : 'justify-end')}>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">You</span>
        </div>
      )}

      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[85%]',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        )}
      >
        {hasTable ? (
          <div className="prose prose-sm max-w-none">
            <FormattedContent content={content} />
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        )}

        {!isUser && (
          <button
            onClick={handleCopy}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            aria-label="Copy message"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">AI</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Formatted Content Helper (for tables, etc.)
// ============================================================================

function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const sections: React.ReactNode[] = [];
  let currentSection: string[] = [];
  let inTable = false;

  lines.forEach((line, idx) => {
    if (line.includes('|') && line.split('|').length > 2) {
      if (!inTable) {
        if (currentSection.length > 0) {
          sections.push(
            <p key={`text-${idx}`} className="mb-4">
              {currentSection.join('\n')}
            </p>
          );
          currentSection = [];
        }
        inTable = true;
      }
      currentSection.push(line);
    } else {
      if (inTable && currentSection.length > 0) {
        sections.push(<TableRenderer key={`table-${idx}`} rows={currentSection} />);
        currentSection = [];
        inTable = false;
      }
      if (line.trim()) {
        currentSection.push(line);
      } else if (currentSection.length > 0) {
        sections.push(
          <p key={`text-${idx}`} className="mb-4">
            {currentSection.join('\n')}
          </p>
        );
        currentSection = [];
      }
    }
  });

  if (currentSection.length > 0) {
    if (inTable) {
      sections.push(<TableRenderer key="table-final" rows={currentSection} />);
    } else {
      sections.push(
        <p key="text-final" className="mb-4">
          {currentSection.join('\n')}
        </p>
      );
    }
  }

  return <>{sections}</>;
}

function TableRenderer({ rows }: { rows: string[] }) {
  const headers = rows[0].split('|').map(h => h.trim()).filter(Boolean);
  const dataRows = rows.slice(1).filter(row => !row.includes('---'));

  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {dataRows.map((row, rowIdx) => {
            const cells = row.split('|').map(c => c.trim()).filter(Boolean);
            return (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {cells.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Input Subcomponent
// ============================================================================

function Input() {
  const { isLoading, sendMessage } = useChatContext();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white px-6 py-4 flex-shrink-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a about salary increases, overtime, benefits..."
            disabled={isLoading}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-3',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              'min-h-[48px] max-h-[200px] text-sm',
              'text-black'
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full',
              'bg-blue-600 text-foreground',
              'hover:bg-blue-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300',
              'flex items-center justify-center'
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Subcomponent
// ============================================================================

function EmptyState() {
  const { messages, sendMessage } = useChatContext();

  if (messages.length > 0) return null;

  const suggestions = [
    'What are the salary increases over the next 3 years?',
    'Tell me about overtime policies',
    'What benefits are included?',
  ];

  return (
    <div className="flex-1 flex items-center justify-center px-6 bg-gray-50">
      <div className="max-w-2xl text-center space-y-6">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Ask about your MOU
          </h2>
          <p className="text-gray-600">
            I can help you understand salary increases, benefits, overtime policies, and more.
          </p>
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(suggestion)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all text-sm text-gray-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Exports - Compound Component Pattern
// ============================================================================

/**
 * Main ChatInterface root component
 */
export { ChatInterfaceRoot as ChatInterface };

/**
 * Header component
 */
export { Header as ChatInterfaceHeader };

/**
 * Messages component - Container for message list
 */
export { Messages as ChatInterfaceMessages };

/**
 * Message component
 */
export { Message as ChatInterfaceMessage };

/**
 * Input component - Text input and send button
 */
export { Input as ChatInterfaceInput };

/**
 * EmptyState component
 */
export { EmptyState as ChatInterfaceEmptyState };

// Export types for external use
export type { ChatContextValue };
