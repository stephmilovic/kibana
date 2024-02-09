/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useConversation } from '.';
import { act, renderHook } from '@testing-library/react-hooks';
import { TestProviders } from '../../mock/test_providers/test_providers';
import { welcomeConvo } from '../../mock/conversation';
import React from 'react';
import { ConversationRole } from '../../assistant_context/types';
import { httpServiceMock } from '@kbn/core/public/mocks';
import { WELCOME_CONVERSATION } from './sample_conversations';
import {
  appendConversationMessages as _appendConversationMessagesApi,
  deleteConversation,
  getConversationById as _getConversationById,
  updateConversation,
  createConversation as _createConversationApi,
} from '../api/conversations';

jest.mock('../api/conversations');
const message = {
  content: 'You are a robot',
  role: 'user' as ConversationRole,
  timestamp: '10/04/2023, 1:00:36 PM',
};
const anotherMessage = {
  content: 'I am a robot',
  role: 'assistant' as ConversationRole,
  timestamp: '10/04/2023, 1:00:46 PM',
};

const mockConvo = {
  id: 'new-convo',
  title: 'new-convo',
  messages: [message, anotherMessage],
  apiConfig: { defaultSystemPromptId: 'default-system-prompt' },
};

const appendConversationMessagesApi = _appendConversationMessagesApi as jest.Mock;
const getConversationById = _getConversationById as jest.Mock;
const createConversation = _createConversationApi as jest.Mock;

describe('useConversation', () => {
  let httpMock: ReturnType<typeof httpServiceMock.createSetupContract>;

  beforeEach(() => {
    httpMock = httpServiceMock.createSetupContract();

    jest.clearAllMocks();
  });
  it('should append a message to an existing conversation when called with valid conversationId and message', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
      });
      await waitForNextUpdate();
      appendConversationMessagesApi.mockResolvedValue({
        messages: [message, anotherMessage, message],
      });

      const appendResult = await result.current.appendMessage({
        conversationId: welcomeConvo.id,
        message,
      });
      expect(appendResult).toHaveLength(3);
      expect(appendResult![2]).toEqual(message);
    });
  });

  it('should report telemetry when a message has been sent', async () => {
    await act(async () => {
      const reportAssistantMessageSent = jest.fn();
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders
            providerContext={{
              assistantTelemetry: {
                reportAssistantInvoked: () => {},
                reportAssistantQuickPrompt: () => {},
                reportAssistantSettingToggled: () => {},
                reportAssistantMessageSent,
              },
            }}
          >
            {children}
          </TestProviders>
        ),
      });
      await waitForNextUpdate();

      appendConversationMessagesApi.mockResolvedValue([message, anotherMessage, message]);
      await result.current.appendMessage({
        conversationId: welcomeConvo.id,
        message,
      });
      expect(reportAssistantMessageSent).toHaveBeenCalledWith({
        conversationId: 'Welcome',
        isEnabledKnowledgeBase: false,
        isEnabledRAGAlerts: false,
        role: 'user',
      });
    });
  });

  it('should create a new conversation when called with valid conversationId and message', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders providerContext={{ http: httpMock }}>{children}</TestProviders>
        ),
      });
      await waitForNextUpdate();
      createConversation.mockResolvedValue(mockConvo);

      const createResult = await result.current.createConversation({
        id: mockConvo.id,
        messages: mockConvo.messages,
        apiConfig: { defaultSystemPromptId: 'default-system-prompt' },
        title: mockConvo.title,
      });

      expect(createResult).toEqual(mockConvo);
    });
  });

  it('should delete an existing conversation when called with valid conversationId', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders providerContext={{ http: httpMock }}>{children}</TestProviders>
        ),
      });
      await waitForNextUpdate();

      await result.current.deleteConversation('new-convo');

      expect(deleteConversation).toHaveBeenCalledWith({
        http: httpMock,
        id: 'new-convo',
      });
    });
  });

  it('should update the apiConfig for an existing conversation when called with a valid conversationId and apiConfig', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders providerContext={{ http: httpMock }}>{children}</TestProviders>
        ),
      });
      await waitForNextUpdate();

      await result.current.setApiConfig({
        conversation: WELCOME_CONVERSATION,
        apiConfig: mockConvo.apiConfig,
      });

      expect(createConversation).toHaveBeenCalledWith({
        http: httpMock,
        conversation: { ...WELCOME_CONVERSATION, apiConfig: mockConvo.apiConfig, id: '' },
      });
    });
  });

  it('appends replacements', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders providerContext={{ http: httpMock }}>{children}</TestProviders>
        ),
      });
      await waitForNextUpdate();

      getConversationById.mockResolvedValue(mockConvo);

      await result.current.appendReplacements({
        conversationId: welcomeConvo.id,
        replacements: {
          '1.0.0.721': '127.0.0.1',
          '1.0.0.01': '10.0.0.1',
          'tsoh-tset': 'test-host',
        },
      });

      expect(updateConversation).toHaveBeenCalledWith({
        http: httpMock,
        conversationId: welcomeConvo.id,
        replacements: {
          '1.0.0.721': '127.0.0.1',
          '1.0.0.01': '10.0.0.1',
          'tsoh-tset': 'test-host',
        },
      });
    });
  });

  it('should remove the last message from a conversation when called with valid conversationId', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders providerContext={{ http: httpMock }}>{children}</TestProviders>
        ),
      });
      await waitForNextUpdate();

      getConversationById.mockResolvedValue(mockConvo);

      const removeResult = await result.current.removeLastMessage('new-convo');

      expect(removeResult).toEqual([message]);
    });
  });

  it('amendMessage updates the last message of conversation[] for a given conversationId with provided content', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = renderHook(() => useConversation(), {
        wrapper: ({ children }) => (
          <TestProviders providerContext={{ http: httpMock }}>{children}</TestProviders>
        ),
      });
      await waitForNextUpdate();

      await result.current.amendMessage({
        conversationId: 'new-convo',
        content: 'hello world',
      });

      expect(appendConversationMessagesApi).toHaveBeenCalledWith({
        conversationId: mockConvo.id,
        http: httpMock,
        messages: [
          {
            ...anotherMessage,
            content: 'hello world',
          },
        ],
      });
    });
  });
});
