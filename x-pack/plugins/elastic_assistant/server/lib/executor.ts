/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get } from 'lodash/fp';
import { KibanaRequest } from '@kbn/core-http-server';
import { PluginStartContract as ActionsPluginStart } from '@kbn/actions-plugin/server';
import { PassThrough, Readable } from 'stream';
import {
  ConnectorExecutionParams,
  ExecuteConnectorRequestBody,
} from '@kbn/elastic-assistant-common';
import { finished } from 'stream/promises';
import { Logger } from '@kbn/logging';
import { EventStreamCodec } from '@smithy/eventstream-codec';
import { fromUtf8, toUtf8 } from '@smithy/util-utf8';

export interface Props {
  abortSignal?: AbortSignal;
  actions: ActionsPluginStart;
  connectorId: string;
  logger: Logger;
  onMessageSent: (content: string) => void;
  params: ConnectorExecutionParams;
  request: KibanaRequest<unknown, unknown, ExecuteConnectorRequestBody>;
}
interface StaticResponse {
  connector_id: string;
  data: string;
  status: string;
}

export const executeAction = async ({
  abortSignal,
  actions,
  connectorId,
  logger,
  onMessageSent,
  params,
  request,
}: Props): Promise<StaticResponse | Readable> => {
  const actionsClient = await actions.getActionsClientWithRequest(request);
  const actionResult = await actionsClient.execute({
    actionId: connectorId,
    params: {
      ...params,
      subActionParams: {
        ...params.subActionParams,
        signal: abortSignal,
      },
    },
  });

  if (actionResult.status === 'error') {
    throw new Error(
      `Action result status is error: ${actionResult?.message} - ${actionResult?.serviceMessage}`
    );
  }
  const content = get('data.message', actionResult);
  if (typeof content === 'string') {
    onMessageSent(content);
    return {
      connector_id: connectorId,
      data: content, // the response from the actions framework
      status: 'ok',
    };
  }
  const readable = get('data', actionResult) as Readable;
  if (typeof readable?.read !== 'function') {
    throw new Error(`Action result status is error: result is not streamable}`);
  }

  const parser = request.body.llmType === 'bedrock' ? parseBedrockStream : parseOpenAIStream;

  parser(readable, logger, abortSignal);

  return readable.pipe(new PassThrough());
};

type StreamParser = (
  responseStream: Readable,
  logger: Logger,
  signal?: AbortSignal
) => Promise<string>;

const parseOpenAIStream: StreamParser = async (responseStream, logger, signal) => {
  let responseBody: string = '';
  const destroyStream = () => {
    // Pause the stream to prevent further data events
    responseStream.pause();
    // Remove the 'data' event listener once the stream is paused
    responseStream.removeListener('data', onData);
    // Manually destroy the stream
    responseStream.emit('close');
    responseStream.destroy();
  };

  const onData = (chunk: string) => {
    // no special encoding, can safely use toString and append to responseBody
    responseBody += chunk.toString();
  };

  responseStream.on('data', onData);

  try {
    // even though the stream is destroyed in the axios request, the response body is still calculated
    // if we do not destroy the stream, the response never resolves
    signal?.addEventListener('abort', destroyStream);
    await finished(responseStream);
  } catch (e) {
    if ('Premature close' !== e.message) logger.error('An error occurred while streaming response');
  }
  return parseOpenAIResponse(responseBody);
};

const parseOpenAIResponse = (responseBody: string) =>
  responseBody
    .split('\n')
    .filter((line) => {
      return line.startsWith('data: ') && !line.endsWith('[DONE]');
    })
    .map((line) => {
      return JSON.parse(line.replace('data: ', ''));
    })
    .filter(
      (
        line
      ): line is {
        choices: Array<{
          delta: { content?: string; function_call?: { name?: string; arguments: string } };
        }>;
      } => {
        return 'object' in line && line.object === 'chat.completion.chunk';
      }
    )
    .reduce((prev, line) => {
      const msg = line.choices[0].delta;
      return prev + (msg.content ?? '');
    }, '');

const parseBedrockStream: StreamParser = async (responseStream, logger) => {
  const responseBuffer: Uint8Array[] = [];
  // do not destroy response stream on abort for bedrock
  // Amazon charges the same tokens whether the stream is destroyed or not, so let it finish to calculate
  responseStream.on('data', (chunk) => {
    // special encoding for bedrock, do not attempt to convert to string
    responseBuffer.push(chunk);
  });
  try {
    await finished(responseStream);
  } catch (e) {
    logger.error('An error occurred while calculating streaming response tokens');
  }
  return parseBedrockBuffer(responseBuffer);
};

/**
 * Parses a Bedrock buffer from an array of chunks.
 *
 * @param {Uint8Array[]} chunks - Array of Uint8Array chunks to be parsed.
 * @returns {string} - Parsed string from the Bedrock buffer.
 */
const parseBedrockBuffer = (chunks: Uint8Array[]): string => {
  // Initialize an empty Uint8Array to store the concatenated buffer.
  let bedrockBuffer: Uint8Array = new Uint8Array(0);

  // Map through each chunk to process the Bedrock buffer.
  return chunks
    .map((chunk) => {
      // Concatenate the current chunk to the existing buffer.
      bedrockBuffer = concatChunks(bedrockBuffer, chunk);
      // Get the length of the next message in the buffer.
      let messageLength = getMessageLength(bedrockBuffer);
      // Initialize an array to store fully formed message chunks.
      const buildChunks = [];
      // Process the buffer until no complete messages are left.
      while (bedrockBuffer.byteLength > 0 && bedrockBuffer.byteLength >= messageLength) {
        // Extract a chunk of the specified length from the buffer.
        const extractedChunk = bedrockBuffer.slice(0, messageLength);
        // Add the extracted chunk to the array of fully formed message chunks.
        buildChunks.push(extractedChunk);
        // Remove the processed chunk from the buffer.
        bedrockBuffer = bedrockBuffer.slice(messageLength);
        // Get the length of the next message in the updated buffer.
        messageLength = getMessageLength(bedrockBuffer);
      }

      const awsDecoder = new EventStreamCodec(toUtf8, fromUtf8);

      // Decode and parse each message chunk, extracting the 'completion' property.
      return buildChunks
        .map((bChunk) => {
          const event = awsDecoder.decode(bChunk);
          const body = JSON.parse(
            Buffer.from(JSON.parse(new TextDecoder().decode(event.body)).bytes, 'base64').toString()
          );
          return body.completion;
        })
        .join('');
    })
    .join('');
};

/**
 * Concatenates two Uint8Array buffers.
 *
 * @param {Uint8Array} a - First buffer.
 * @param {Uint8Array} b - Second buffer.
 * @returns {Uint8Array} - Concatenated buffer.
 */
function concatChunks(a: Uint8Array, b: Uint8Array): Uint8Array {
  const newBuffer = new Uint8Array(a.length + b.length);
  // Copy the contents of the first buffer to the new buffer.
  newBuffer.set(a);
  // Copy the contents of the second buffer to the new buffer starting from the end of the first buffer.
  newBuffer.set(b, a.length);
  return newBuffer;
}

/**
 * Gets the length of the next message from the buffer.
 *
 * @param {Uint8Array} buffer - Buffer containing the message.
 * @returns {number} - Length of the next message.
 */
function getMessageLength(buffer: Uint8Array): number {
  // If the buffer is empty, return 0.
  if (buffer.byteLength === 0) return 0;
  // Create a DataView to read the Uint32 value at the beginning of the buffer.
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  // Read and return the Uint32 value (message length).
  return view.getUint32(0, false);
}
