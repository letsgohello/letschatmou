import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatStorage, isLocalStorageAvailable } from '@/lib/storage/chat-storage';

describe('Chat Storage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    global.localStorage.clear();
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });
  });

  describe('ChatStorage', () => {
    describe('createChat', () => {
      it('should generate a unique chat ID', () => {
        const id1 = ChatStorage.createChat();
        const id2 = ChatStorage.createChat();

        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toBe(id2);
      });
    });

    describe('getChatTitle', () => {
      it('should use first user message as title', () => {
        const messages = [
          { id: '1', role: 'user' as const, content: 'Hello, how are you?', createdAt: new Date() },
          { id: '2', role: 'assistant' as const, content: 'I am fine', createdAt: new Date() },
        ];

        const title = ChatStorage.getChatTitle(messages);

        expect(title).toBe('Hello, how are you?');
      });

      it('should truncate long titles to 50 characters', () => {
        const longMessage = 'A'.repeat(100);
        const messages = [
          { id: '1', role: 'user' as const, content: longMessage, createdAt: new Date() },
        ];

        const title = ChatStorage.getChatTitle(messages);

        expect(title.length).toBe(53); // 50 + '...'
        expect(title.endsWith('...')).toBe(true);
      });

      it('should return "New Chat" for empty messages', () => {
        const title = ChatStorage.getChatTitle([]);

        expect(title).toBe('New Chat');
      });

      it('should return "New Chat" when no user messages', () => {
        const messages = [
          { id: '1', role: 'assistant' as const, content: 'Hello', createdAt: new Date() },
        ];

        const title = ChatStorage.getChatTitle(messages);

        expect(title).toBe('New Chat');
      });
    });

    describe('saveMessage and loadMessages', () => {
      it('should save message to localStorage', () => {
        const chatId = 'test-chat-1';
        const message = {
          role: 'user' as const,
          content: 'Test message',
        };

        ChatStorage.saveMessage(chatId, message);

        expect(global.localStorage.setItem).toHaveBeenCalled();
      });
    });

    describe('clearChat', () => {
      it('should remove chat from localStorage', () => {
        const chatId = 'test-chat-2';

        ChatStorage.clearChat(chatId);

        expect(global.localStorage.removeItem).toHaveBeenCalled();
      });
    });
  });
});
