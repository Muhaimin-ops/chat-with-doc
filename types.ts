/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlContextMetadataItem {
  retrievedUrl: string; 
  urlRetrievalStatus: string; 
}

export interface SourceSelectionData {
  originalQuery: string;
  urls: string[];
}

export type FeedbackType = 'positive' | 'negative' | null;

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
  // New fields for the source selection flow
  isSourceConfirmationPending?: boolean;
  sourceSelection?: SourceSelectionData;
  feedback?: FeedbackType;
}

export interface URLGroup {
  id: string;
  name: string;
  urls: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}