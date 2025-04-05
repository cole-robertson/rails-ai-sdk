/**
 * Type definitions for database models
 */

export interface Vote {
  id: string;
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: 'private' | 'public';
  createdAt: string;
  updatedAt: string;
} 