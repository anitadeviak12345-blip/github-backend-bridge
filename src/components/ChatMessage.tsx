import { User, FileText, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface Attachment {
  url: string;
  type: string;
  name: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

const ChatMessage = ({ role, content, attachments }: ChatMessageProps) => {
  const isUser = role === "user";

  const displayContent = content.replace(/\n\n\[Attachments:.*\]$/, '');

  return (
    <div className={cn("flex gap-3 py-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={cn("flex flex-col gap-1", !isUser && "flex-1 min-w-0")}>
        {!isUser && (
          <span className="text-xs font-medium text-primary ml-1">Luvio AI</span>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "max-w-[80%] bg-primary text-primary-foreground"
              : "bg-card border border-border w-full"
          )}
        >
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border/50"
                    />
                  ) : (
                    <div className="flex items-center gap-2 bg-background/20 px-3 py-2 rounded-lg">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs">{attachment.name}</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
          {displayContent && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
