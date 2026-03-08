import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onTranscript: (text: string) => void;
  textToSpeak?: string;
  className?: string;
}

export function VoiceInput({ onTranscript, textToSpeak, className }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "aborted") {
        toast.error("Voice input error: " + event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback(() => {
    if (!textToSpeak) return;
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-GB";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [textToSpeak]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant={isListening ? "destructive" : "ghost"}
        size="sm"
        className={cn("h-7 w-7 p-0", isListening && "animate-pulse")}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </Button>
      {textToSpeak && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0", isSpeaking && "text-primary")}
          onClick={speak}
          title="Read aloud"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
