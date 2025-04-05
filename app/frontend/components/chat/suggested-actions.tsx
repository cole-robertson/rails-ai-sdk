'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Write a blog post based on a YouTube video',
      label: 'from a longform video URL',
      action: 'I will provide you with a YouTube video URL and you will summarize the video calling the dscribeAnalyze tool.',
    },
    {
      title: "Analyze the trend in the TikTok Video",
      label: `give me insights on what's going on`,
      action: `I will provide you with a TikTok video URL and you will analyze the video calling the dscribeAnalyze tool.`,
    },
    {
      title: 'Pull out the brands shown in the Instagram post',
      label: `to identify the brands shown in the post`,
      action: `I will provide you with an Instagram post URL and you will pull out the brands shown in the post calling the dscribeAnalyze tool.`,
    },
    {
      title: 'Summarize the podcast episode',
      label: 'given a Spotify or Apple Podcast URL',
      action: 'I will provide you with a podcast episode URL and you will summarize the episode calling the dscribeAnalyze tool.',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
