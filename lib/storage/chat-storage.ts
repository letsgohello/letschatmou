/**
 * localStorage-based chat storage system.
 * Manages chat history, messages, and metadata without requiring a database.
 */

import { nanoid } from 'nanoid';

/**
 * Message stored in localStorage
 */
export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

/**
 * Chat metadata for listing and management
 */
export interface ChatMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

/**
 * Check if localStorage is available in the current environment
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Static class for managing chat storage in localStorage.
 * Uses a key prefix to namespace all storage keys.
 */
export class ChatStorage {
  private static readonly PREFIX = 'job-chatbot';
  private static readonly CHATS_INDEX_KEY = `${ChatStorage.PREFIX}:chats-index`;

  /**
   * Generate a storage key for a specific chat
   */
  private static getChatKey(chatId: string): string {
    return `${ChatStorage.PREFIX}:chat:${chatId}`;
  }

  /**
   * Save a message to a chat's message history
   */
  static saveMessage(chatId: string, message: Omit<StoredMessage, 'id' | 'createdAt'>): void {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available');
      return;
    }

    try {
      const storedMessage: StoredMessage = {
        ...message,
        id: nanoid(),
        createdAt: new Date(),
      };

      const key = ChatStorage.getChatKey(chatId);
      const existingData = window.localStorage.getItem(key);
      const messages: StoredMessage[] = existingData ? JSON.parse(existingData) : [];

      messages.push(storedMessage);

      window.localStorage.setItem(key, JSON.stringify(messages));

      // Update chat index
      ChatStorage.updateChatIndex(chatId, messages);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Cleaning up old chats...');
        ChatStorage.cleanupOldChats(5);
        
        // Try again after cleanup
        try {
          const storedMessage: StoredMessage = {
            ...message,
            id: nanoid(),
            createdAt: new Date(),
          };
          const key = ChatStorage.getChatKey(chatId);
          const existingData = window.localStorage.getItem(key);
          const messages: StoredMessage[] = existingData ? JSON.parse(existingData) : [];
          messages.push(storedMessage);
          window.localStorage.setItem(key, JSON.stringify(messages));
          ChatStorage.updateChatIndex(chatId, messages);
        } catch (retryError) {
          console.error('Failed to save message after cleanup:', retryError);
        }
      } else {
        console.error('Error saving message:', error);
      }
    }
  }

  /**
   * Load all messages for a specific chat
   */
  static loadMessages(chatId: string): StoredMessage[] {
    if (!isLocalStorageAvailable()) {
      return [];
    }

    try {
      const key = ChatStorage.getChatKey(chatId);
      const data = window.localStorage.getItem(key);

      if (!data) {
        return [];
      }

      const messages = JSON.parse(data);

      // Convert date strings back to Date objects
      return messages.map((msg: StoredMessage & { createdAt: string }) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  /**
   * Clear all messages for a specific chat
   */
  static clearChat(chatId: string): void {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      const key = ChatStorage.getChatKey(chatId);
      window.localStorage.removeItem(key);

      // Update chat index
      ChatStorage.updateChatIndex(chatId, []);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  }

  /**
   * List all chats with metadata
   */
  static listChats(): ChatMetadata[] {
    if (!isLocalStorageAvailable()) {
      return [];
    }

    try {
      const data = window.localStorage.getItem(ChatStorage.CHATS_INDEX_KEY);

      if (!data) {
        return [];
      }

      const chats = JSON.parse(data);

      // Convert date strings back to Date objects
      return chats.map((chat: ChatMetadata & { createdAt: string; updatedAt: string }) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
      }));
    } catch (error) {
      console.error('Error listing chats:', error);
      return [];
    }
  }

  /**
   * Create a new chat and return its ID
   */
  static createChat(): string {
    return nanoid();
  }

  /**
   * Get a title for a chat based on its messages
   */
  static getChatTitle(messages: StoredMessage[]): string {
    if (messages.length === 0) {
      return 'New Chat';
    }

    // Use first user message as title
    const firstUserMessage = messages.find(m => m.role === 'user');
    
    if (!firstUserMessage) {
      return 'New Chat';
    }

    // Truncate to 50 characters
    const title = firstUserMessage.content.slice(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }

  /**
   * Update the chat index with metadata for a specific chat
   */
  private static updateChatIndex(chatId: string, messages: StoredMessage[]): void {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      const chats = ChatStorage.listChats();
      const existingChatIndex = chats.findIndex(chat => chat.id === chatId);

      const chatMetadata: ChatMetadata = {
        id: chatId,
        title: ChatStorage.getChatTitle(messages),
        createdAt: existingChatIndex >= 0 ? chats[existingChatIndex].createdAt : new Date(),
        updatedAt: new Date(),
        messageCount: messages.length,
      };

      if (existingChatIndex >= 0) {
        chats[existingChatIndex] = chatMetadata;
      } else {
        chats.push(chatMetadata);
      }

      // Sort by most recent first
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      window.localStorage.setItem(ChatStorage.CHATS_INDEX_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error updating chat index:', error);
    }
  }

  /**
   * Clean up old chats to free up space.
   * Keeps the most recent `keepCount` chats and removes the rest.
   */
  static cleanupOldChats(keepCount: number = 10): void {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      const chats = ChatStorage.listChats();

      // Sort by most recent first
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      // Remove old chats
      const chatsToRemove = chats.slice(keepCount);

      chatsToRemove.forEach(chat => {
        const key = ChatStorage.getChatKey(chat.id);
        window.localStorage.removeItem(key);
      });

      // Update index with remaining chats
      const remainingChats = chats.slice(0, keepCount);
      window.localStorage.setItem(
        ChatStorage.CHATS_INDEX_KEY,
        JSON.stringify(remainingChats)
      );

      console.log(`Cleaned up ${chatsToRemove.length} old chats`);
    } catch (error) {
      console.error('Error cleaning up chats:', error);
    }
  }
}

/**
 * React hook for using chat storage with automatic loading and saving
 */
export function useChatStorage(chatId: string) {
  const loadMessages = () => ChatStorage.loadMessages(chatId);
  const saveMessage = (message: Omit<StoredMessage, 'id' | 'createdAt'>) => 
    ChatStorage.saveMessage(chatId, message);
  const clearChat = () => ChatStorage.clearChat(chatId);

  return {
    loadMessages,
    saveMessage,
    clearChat,
  };
}
