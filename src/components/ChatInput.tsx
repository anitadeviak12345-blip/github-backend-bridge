import { useState, useRef } from "react";
import { Send, Paperclip, Mic, MicOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChatInputProps {
  onSend: (message: string, attachments?: { url: string; type: string; name: string }[]) => void;
  isLoading: boolean;
}

interface FileAttachment {
  file: File;
  preview: string;
  type: string;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading || isUploading) return;

    try {
      setIsUploading(true);
      const uploadedFiles: { url: string; type: string; name: string }[] = [];

      for (const attachment of attachments) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "Please login to upload files",
            variant: "destructive",
          });
          return;
        }

        const fileExt = attachment.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, attachment.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${attachment.file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          url: publicUrl,
          type: attachment.type,
          name: attachment.file.name
        });
      }

      onSend(input, uploadedFiles.length > 0 ? uploadedFiles : undefined);
      setInput("");
      setAttachments([]);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'file';

      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachments(prev => [...prev, {
            file,
            preview: event.target?.result as string,
            type
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, {
          file,
          preview: '',
          type
        }]);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000;

      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const base64Audio = btoa(binary);

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      return data?.text || null;
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      return null;
    }
  };

  const handleVoiceClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        const transcribedText = await transcribeAudio(audioBlob);

        if (transcribedText) {
          setInput((prev) => prev + (prev ? " " : "") + transcribedText);
          toast({
            title: "Voice transcribed",
            description: "Your voice has been converted to text",
          });
        } else {
          toast({
            title: "Transcription failed",
            description: "Could not convert voice to text. Please try again.",
            variant: "destructive",
          });
        }

        setIsTranscribing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Click the mic button again to stop recording",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type === 'image' ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-border bg-card flex items-center justify-center">
                  <div className="text-center px-1">
                    <span className="text-xs text-muted-foreground truncate block">
                      {attachment.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.txt,.md,.json,.csv,.pdf,.doc,.docx"
          multiple
        />
        <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleFileClick}
            disabled={isUploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Luvio AI"
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            disabled={isLoading || isUploading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
            onClick={handleVoiceClick}
            disabled={isTranscribing || isUploading}
          >
            {isTranscribing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 gradient-primary rounded-full"
            disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
