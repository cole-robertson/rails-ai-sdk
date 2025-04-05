'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  messages: overrideMessages,
  setMessages: overrideSetMessages,
  handleSubmit: overrideHandleSubmit,
  input: overrideInput,
  setInput: overrideSetInput,
  append: overrideAppend,
  isLoading: overrideIsLoading,
  stop: overrideStop,
  reload: overrideReload,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  messages?: Array<Message>;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  handleSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  input?: string;
  setInput?: (input: string) => void;
  append?: (message: Message) => Promise<void>;
  isLoading?: boolean;
  stop?: () => void;
  reload?: () => Promise<void>;
}) {
  const { mutate } = useSWRConfig();

  const {
    messages: defaultMessages,
    setMessages: defaultSetMessages,
    handleSubmit: defaultHandleSubmit,
    input: defaultInput,
    setInput: defaultSetInput,
    append: defaultAppend,
    isLoading: defaultIsLoading,
    stop: defaultStop,
    reload: defaultReload,
  } = useChat({
    id,
    body: { id, modelId: selectedModelId },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const messages = overrideMessages || defaultMessages;
  const setMessages = overrideSetMessages || defaultSetMessages;
  const handleSubmit = overrideHandleSubmit || defaultHandleSubmit;
  const input = overrideInput ?? defaultInput;
  const setInput = overrideSetInput || defaultSetInput;
  const append = overrideAppend || defaultAppend;
  const isLoading = overrideIsLoading ?? defaultIsLoading;
  const stop = overrideStop || defaultStop;
  const reload = overrideReload || defaultReload;

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
