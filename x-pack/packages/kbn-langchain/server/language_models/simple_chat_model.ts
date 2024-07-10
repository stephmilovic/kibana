/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  SimpleChatModel,
  type BaseChatModelParams,
} from '@langchain/core/language_models/chat_models';
import { ReadableStream } from 'web-streams-polyfill';
import type { ActionsClient } from '@kbn/actions-plugin/server';
import { BaseMessage } from '@langchain/core/messages';
import { ChatGenerationChunk } from '@langchain/core/outputs';
import { Logger } from '@kbn/logging';
import { v4 as uuidv4 } from 'uuid';
import { get } from 'lodash/fp';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { PublicMethodsOf } from '@kbn/utility-types';
import { Readable } from 'stream';
import { parseGeminiStream } from '../utils/gemini';
import { parseBedrockStream } from '../utils/bedrock';
// import { IterableReadableStream } from '@langchain/core/dist/utils/stream';
import { parseBedrockIterable } from '..';
import { getDefaultArguments } from './constants';

export const getMessageContentAndRole = (prompt: string, role = 'user') => ({
  content: prompt,
  role: role === 'human' ? 'user' : role,
});

export interface CustomChatModelInput extends BaseChatModelParams {
  actionsClient: PublicMethodsOf<ActionsClient>;
  connectorId: string;
  logger: Logger;
  llmType?: string;
  signal?: AbortSignal;
  model?: string;
  temperature?: number;
  streaming: boolean;
  maxTokens?: number;
}

export class ActionsClientSimpleChatModel extends SimpleChatModel {
  #actionsClient: PublicMethodsOf<ActionsClient>;
  #connectorId: string;
  #logger: Logger;
  #traceId: string;
  #signal?: AbortSignal;
  #maxTokens?: number;
  llmType: string;
  streaming: boolean;
  model?: string;
  temperature?: number;

  constructor({
    actionsClient,
    connectorId,
    llmType,
    logger,
    model,
    temperature,
    signal,
    streaming,
    maxTokens,
  }: CustomChatModelInput) {
    super({});

    this.#actionsClient = actionsClient;
    this.#connectorId = connectorId;
    this.#traceId = uuidv4();
    this.#logger = logger;
    this.#signal = signal;
    this.#maxTokens = maxTokens;
    this.llmType = llmType ?? 'ActionsClientSimpleChatModel';
    this.model = model;
    this.temperature = temperature;
    this.streaming = streaming;
  }

  _llmType() {
    return this.llmType;
  }

  // Model type needs to be `base_chat_model` to work with LangChain OpenAI Tools
  // We may want to make this configurable (ala _llmType) if different agents end up requiring different model types
  // See: https://github.com/langchain-ai/langchainjs/blob/fb699647a310c620140842776f4a7432c53e02fa/langchain/src/agents/openai/index.ts#L185
  _modelType() {
    return 'base_chat_model';
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): AsyncGenerator<ChatGenerationChunk> {
    try {
      const requestBody = formatRequestBodyForKibana({
        messages,
        logger: this.#logger,
        model: this.model,
        connectorId: this.#connectorId,
        traceId: this.#traceId,
        streaming: this.streaming,
        temperature: this.temperature,
        maxTokens: this.#maxTokens,
        llmType: this.llmType,
        stop: options.stop,
      });

      const actionResult = await this.#actionsClient.execute(requestBody);

      if (actionResult.status === 'error') {
        throw new Error(
          `ActionsClientSimpleChatModel: action result status is error: ${actionResult?.message} - ${actionResult?.serviceMessage}`
        );
      }

      const readable = get('data', actionResult) as Readable;

      if (typeof readable?.read !== 'function') {
        throw new Error('Action result status is error: result is not streamable');
      }

      let currentOutput = '';
      let finalOutputIndex = -1;
      const finalOutputStartToken = '"action":"FinalAnswer","action_input":"';
      let streamingFinished = false;
      const finalOutputStopRegex = /(?<!\\)\"/;
      let extraOutput = '';
      const handleLLMNewToken = async function* (token: string) {
        if (finalOutputIndex === -1) {
          // Remove whitespace to simplify parsing
          currentOutput += token.replace(/\s/g, '');
          if (currentOutput.includes(finalOutputStartToken)) {
            finalOutputIndex = currentOutput.indexOf(finalOutputStartToken);
            const contentStartIndex = finalOutputIndex + finalOutputStartToken.length;
            extraOutput = currentOutput.substring(contentStartIndex);
          }
        } else if (!streamingFinished) {
          const finalOutputEndIndex = token.search(finalOutputStopRegex);
          if (finalOutputEndIndex !== -1) {
            extraOutput = token.substring(0, finalOutputEndIndex);
            streamingFinished = true;
            if (extraOutput.length > 0) {
              yield {
                done: true,
                message: { content: extraOutput },
              };
              await runManager?.handleLLMNewToken(extraOutput);
            }
          } else {
            const tokenOutput = `${extraOutput}${token}`;
            extraOutput = '';
            yield {
              done: false,
              message: { content: tokenOutput },
            };
            await runManager?.handleLLMNewToken(tokenOutput);
          }
        }
      };
      const streamParser = this.llmType === 'bedrock' ? parseBedrockStream : parseGeminiStream;

      const parsed = void streamParser(readable, this.#logger, this.#signal, handleLLMNewToken);
      yield* handleLLMNewToken;
      // return parsed; // per the contact of _call, return a string
      // const stream = await this.caller.call(async () =>
      //   createSimpleChatStream({
      //     requestBody,
      //     actionsClient: this.#actionsClient,
      //     llmType: this.llmType,
      //     logger: this.#logger,
      //     runManager,
      //     signal: this.#signal,
      //   })
      // );
      // for await (const chunk of stream) {
      //   console.log('stephhh CHUNK OF STREAM', chunk);
      //   if (!chunk.done) {
      //     yield new ChatGenerationChunk({
      //       text: chunk.message.content,
      //       message: new AIMessageChunk({ content: chunk.message.content }),
      //     });
      //     await runManager?.handleLLMNewToken(chunk.message.content ?? '');
      //   } else {
      //     yield new ChatGenerationChunk({
      //       text: '',
      //       message: new AIMessageChunk({ content: '' }),
      //       // generationInfo: {
      //       //   model: chunk.model,
      //       //   total_duration: chunk.total_duration,
      //       //   load_duration: chunk.load_duration,
      //       //   prompt_eval_count: chunk.prompt_eval_count,
      //       //   prompt_eval_duration: chunk.prompt_eval_duration,
      //       //   eval_count: chunk.eval_count,
      //       //   eval_duration: chunk.eval_duration,
      //       // },
      //     });
      //   }
      // }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw e;
    }
  }

  async _call(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    if (!messages.length) {
      throw new Error('No messages provided.');
    }

    if (!this.streaming) {
      // create a new connector request body with the assistant message:
      const requestBody = formatRequestBodyForKibana({
        messages,
        logger: this.#logger,
        model: this.model,
        connectorId: this.#connectorId,
        traceId: this.#traceId,
        streaming: this.streaming,
        temperature: this.temperature,
        maxTokens: this.#maxTokens,
        llmType: this.llmType,
        stop: options.stop,
      });

      const actionResult = await this.#actionsClient.execute(requestBody);

      if (actionResult.status === 'error') {
        throw new Error(
          `ActionsClientSimpleChatModel: action result status is error: ${actionResult?.message} - ${actionResult?.serviceMessage}`
        );
      }
      const content = get('data.message', actionResult);

      if (typeof content !== 'string') {
        throw new Error(
          `ActionsClientSimpleChatModel: content should be a string, but it had an unexpected type: ${typeof content}`
        );
      }

      return content; // per the contact of _call, return a string
    }

    const chunks = [];
    for await (const chunk of this._streamResponseChunks(messages, options, runManager)) {
      chunks.push(chunk.message.content);
    }
    return chunks.join('');
  }
}
interface KibanaRequest {
  actionId: string;
  params: {
    subAction: string;
    subActionParams: {
      model?: string;
      messages: Array<{ content: string; role: string }>;
      temperature?: number;
      maxTokens?: number;
      stop?: string[] | null;
    };
  };
}

async function* createSimpleChatStream({
  requestBody,
  actionsClient,
  llmType,
  logger,
  runManager,
  signal,
}: {
  requestBody: KibanaRequest;
  actionsClient: PublicMethodsOf<ActionsClient>;
  llmType: string;
  logger: Logger;
  runManager?: CallbackManagerForLLMRun;
  signal?: AbortSignal;
}) {
  const actionResult = await actionsClient.execute(requestBody);

  if (actionResult.status === 'error') {
    throw new Error(
      `ActionsClientSimpleChatModel: action result status is error: ${actionResult?.message} - ${actionResult?.serviceMessage}`
    );
  }

  const readable = get('data', actionResult) as Readable;

  if (typeof readable?.read !== 'function') {
    throw new Error('Action result status is error: result is not streamable');
  }
  //
  // const stream = IterableReadableStream.fromReadableStream(convertNodeReadableToWebReadable(readable))
  const stream = convertNodeReadableToWebReadable(readable);

  let currentOutput = '';
  let finalOutputIndex = -1;
  const finalOutputStartToken = '"action":"FinalAnswer","action_input":"';
  let streamingFinished = false;
  const finalOutputStopRegex = /(?<!\\)\"/;
  let extraOutput = '';
  const handleLLMNewToken = async function* (token: string) {
    if (finalOutputIndex === -1) {
      // Remove whitespace to simplify parsing
      currentOutput += token.replace(/\s/g, '');
      if (currentOutput.includes(finalOutputStartToken)) {
        finalOutputIndex = currentOutput.indexOf(finalOutputStartToken);
        const contentStartIndex = finalOutputIndex + finalOutputStartToken.length;
        extraOutput = currentOutput.substring(contentStartIndex);
      }
    } else if (!streamingFinished) {
      const finalOutputEndIndex = token.search(finalOutputStopRegex);
      if (finalOutputEndIndex !== -1) {
        extraOutput = token.substring(0, finalOutputEndIndex);
        streamingFinished = true;
        if (extraOutput.length > 0) {
          yield {
            done: true,
            message: { content: extraOutput },
          };
          await runManager?.handleLLMNewToken(extraOutput);
        }
      } else {
        const tokenOutput = `${extraOutput}${token}`;
        extraOutput = '';
        yield {
          done: false,
          message: { content: tokenOutput },
        };
        await runManager?.handleLLMNewToken(tokenOutput);
      }
    }
  };
  const streamParser = parseBedrockIterable; // llmType === 'bedrock' ? parseBedrockIterable : parseGeminiStream;

  const parsed = await streamParser(stream, logger, signal, handleLLMNewToken);

  // const decoder = new TextDecoder();
  // let extra = '';
  // for await (const chunk of stream) {
  //   const decoded = extra + decoder.decode(chunk);
  //   const lines = decoded.split('\n');
  //   extra = lines.pop() || '';
  //   for (const line of lines) {
  //     try {
  //       yield JSON.parse(line);
  //     } catch (e) {
  //       console.warn(`Received a non-JSON parseable chunk: ${line}`);
  //     }
  //   }
  // }
}
function formatRequestBodyForKibana({
  messages,
  logger,
  connectorId,
  traceId,
  streaming,
  model,
  temperature,
  maxTokens,
  llmType,
  stop,
}: {
  messages: BaseMessage[];
  logger: Logger;
  connectorId: string;
  traceId: string;
  streaming: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  llmType: string;
  stop?: string[];
}): KibanaRequest {
  const formattedMessages: Array<{ content: string; role: string }> = [];
  messages.forEach((message, i) => {
    if (typeof message.content !== 'string') {
      throw new Error('Multimodal messages are not supported.');
    }
    formattedMessages.push(getMessageContentAndRole(message.content, message._getType()));
  });
  logger.debug(
    () =>
      `ActionsClientSimpleChatModel#_call\ntraceId: ${traceId}\nassistantMessage:\n${JSON.stringify(
        formattedMessages
      )} `
  );
  // create a new connector request body with the assistant message:
  return {
    actionId: connectorId,
    params: {
      subAction: streaming ? 'invokeStream' : 'invokeAI',
      subActionParams: {
        model,
        messages: formattedMessages,
        ...getDefaultArguments(llmType, temperature, stop, maxTokens),
      },
    },
  };
}
function convertNodeReadableToWebReadable(nodeReadable: Readable) {
  return new ReadableStream({
    start(controller) {
      nodeReadable.on('data', (chunk) => {
        controller.enqueue(chunk);
      });

      nodeReadable.on('end', () => {
        controller.close();
      });

      nodeReadable.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      nodeReadable.destroy();
    },
  });
}
