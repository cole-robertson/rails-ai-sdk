import React from 'react';
import { Loader2, MessageSquare, Heart, Repeat, Quote, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming Shadcn UI components

// Define the structure of the transcription result based on the backend response
interface TranscriptionMetadata {
  upload_time?: string;
  comment_count?: number;
  like_count?: number;
  thumbnail?: string;
  retweet_count?: number;
  quote_count?: number;
}

interface TranscriptionSuccess {
  markdown: string;
  metadata: TranscriptionMetadata;
  title: string;
  total_duration: number;
  video_url: string;
}

interface TranscriptionError {
  error: string;
}

// Union type for the result
type TranscribeResult = TranscriptionSuccess | TranscriptionError;

interface TranscribeProps {
  result?: TranscribeResult;
}

// Helper to check if the result is an error
function isError(result: TranscribeResult): result is TranscriptionError {
  return (result as TranscriptionError).error !== undefined;
}

// Helper to format counts
const formatCount = (count?: number): string => {
  if (count === undefined || count === null) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export const Transcribe: React.FC<TranscribeProps> = ({ result }) => {
  // Loading state
  if (!result || (!isError(result) && !result.markdown)) {
    return (
      <div className="p-4 border rounded-md bg-muted flex items-center justify-center space-x-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm text-muted-foreground">Analyzing video...</span>
      </div>
    );
  }

  // Error state
  if (isError(result)) {
    return (
      <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
        Error: {result.error}
      </div>
    );
  }

  // Success state - Render the card
  const { metadata, title, video_url } = result;

  return (
    <Card className="w-full overflow-hidden border rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row bg-card text-card-foreground">
        {metadata.thumbnail && (
          <div className="md:w-48 flex-shrink-0">
            <a href={video_url} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden md:rounded-l-lg md:rounded-r-none rounded-t-lg hover:opacity-90 transition-opacity">
              <img
                src={metadata.thumbnail}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            </a>
          </div>
        )}

        <div className={`p-3 flex flex-col justify-between flex-grow ${metadata.thumbnail ? '' : 'rounded-lg'}`}>
          <div>
            <a href={video_url} target="_blank" rel="noopener noreferrer" className="block hover:underline">
              <h3 className="text-base font-semibold mb-1.5 line-clamp-2">{title || 'Transcription Result'}</h3>
            </a>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
              {metadata.like_count !== undefined && (
                <div className="flex items-center">
                  <Heart className="mr-1 h-3.5 w-3.5" /> {formatCount(metadata.like_count)}
                </div>
              )}
              {metadata.comment_count !== undefined && (
                <div className="flex items-center">
                  <MessageSquare className="mr-1 h-3.5 w-3.5" /> {formatCount(metadata.comment_count)}
                </div>
              )}
              {metadata.retweet_count !== undefined && (
                <div className="flex items-center">
                  <Repeat className="mr-1 h-3.5 w-3.5" /> {formatCount(metadata.retweet_count)}
                </div>
              )}
              {metadata.quote_count !== undefined && (
                 <div className="flex items-center">
                   <Quote className="mr-1 h-3.5 w-3.5" /> {formatCount(metadata.quote_count)}
                 </div>
               )}
            </div>
          </div>

          <div className="mt-auto pt-1">
             <a
               href={video_url}
               target="_blank"
               rel="noopener noreferrer"
               className="text-xs text-blue-600 hover:underline flex items-center"
             >
               View Video <ExternalLink className="ml-1 h-3.5 w-3.5" />
             </a>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Transcribe;
