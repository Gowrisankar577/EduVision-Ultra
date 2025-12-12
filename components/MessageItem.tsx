import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, InteractiveBlock } from '../types';
import QuizComponent from './QuizData';
import FlashcardsComponent from './Flashcards';
import WhiteboardComponent from './Whiteboard';
import StudyPlanComponent from './StudyPlan';
import { User, Bot, AlertTriangle, Volume2, StopCircle, Copy, Check, Download, Loader2 } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import { generateSpeech } from '../services/geminiService';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Parse text to find JSON blocks for custom widgets
  const content = useMemo(() => {
    // If it's a user message, just return text
    if (isUser) return { textParts: [message.text], widgets: [] };

    const regex = /```json\s*([\s\S]*?)\s*```/g;
    const textParts: string[] = [];
    const widgets: InteractiveBlock[] = [];
    
    let lastIndex = 0;
    let match;

    // We also want to strip out the [XP: +50] tag from display, as it's handled by App state
    const cleanText = message.text.replace(/\[XP:\s*\+\d+\]/g, '');

    while ((match = regex.exec(cleanText)) !== null) {
      if (match.index > lastIndex) {
        textParts.push(cleanText.substring(lastIndex, match.index));
      }
      
      try {
        const json = JSON.parse(match[1]);
        if (json.type === 'quiz') {
            widgets.push({ type: 'quiz', data: json.data });
            textParts.push(""); 
        } else if (json.type === 'flashcards') {
            widgets.push({ type: 'flashcards', data: json.data });
            textParts.push("");
        } else if (json.type === 'whiteboard') {
            widgets.push({ type: 'whiteboard', data: json.data });
            textParts.push("");
        } else if (json.type === 'study_plan') {
            widgets.push({ type: 'study_plan', data: json.data });
            textParts.push("");
        } else {
            textParts.push(`\`\`\`json\n${match[1]}\n\`\`\``);
        }
      } catch (e) {
        textParts.push(`\`\`\`json\n${match[1]}\n\`\`\``);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < cleanText.length) {
      textParts.push(cleanText.substring(lastIndex));
    }

    return { textParts, widgets };
  }, [message.text, isUser]);

  const handleTTS = async () => {
    if (isSpeaking && audioRef) {
      audioRef.pause();
      setIsSpeaking(false);
      return;
    }

    if (isLoadingTTS) return;

    try {
      setIsLoadingTTS(true);
      // Clean text for speech
      const speakableText = message.text
        .replace(/```[\s\S]*?```/g, ' Code block omitted. ') 
        .replace(/\[XP:\s*\+\d+\]/g, '')
        .replace(/[#*`_]/g, '')
        .replace(/\[.*?\]/g, '')
        .slice(0, 500); // Limit length for preview

      const base64Audio = await generateSpeech(speakableText);
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => { setIsSpeaking(false); setIsLoadingTTS(false); };
      
      audio.play();
      setAudioRef(audio);
      setIsSpeaking(true);
    } catch (error) {
      console.error("TTS Playback failed", error);
    } finally {
      setIsLoadingTTS(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-white/10 ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
            : 'bg-gradient-to-br from-teal-500 to-emerald-600'
        }`}>
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </div>

        {/* Content Container */}
        <div className="flex flex-col w-full min-w-0">
          <div className={`flex flex-col rounded-2xl p-5 shadow-xl ${
            isUser 
              ? 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-tr-sm border border-blue-400/20' 
              : 'glass-panel text-slate-100 rounded-tl-sm'
          }`}>
            
            {/* User Uploaded Images */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.images.map((img, idx) => (
                  <img key={idx} src={img} alt="User upload" className="max-w-[200px] max-h-[200px] rounded-lg border border-white/20 object-cover shadow-md" />
                ))}
              </div>
            )}

            {/* AI Generated Image */}
            {message.generatedImage && (
              <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
                <img 
                  src={message.generatedImage} 
                  alt="AI Generated" 
                  className="w-full max-h-[400px] object-contain rounded-xl"
                />
                <a 
                  href={message.generatedImage} 
                  download={`generated-image-${Date.now()}.png`}
                  className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            )}

            {/* AI Generated Video */}
            {message.generatedVideo && (
              <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
                <video 
                  src={message.generatedVideo} 
                  controls
                  className="w-full max-h-[500px] rounded-xl"
                />
                <a 
                  href={message.generatedVideo} 
                  download={`generated-video-${Date.now()}.mp4`}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Download Video"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            )}

            {/* Text Content */}
            <div className={`markdown-body text-sm md:text-base leading-relaxed break-words ${isUser ? 'text-white/95' : ''}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.text}</p>
              ) : (
                <>
                  {content.textParts.map((part, idx) => (
                    <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
                  ))}
                </>
              )}
            </div>

            {/* Error Indicator */}
            {message.isError && (
              <div className="mt-2 flex items-center gap-2 text-red-300 bg-red-900/20 p-2 rounded-lg border border-red-500/20 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Failed to send message.</span>
              </div>
            )}
          </div>

          {/* Widgets rendered OUTSIDE the bubble for full width/better layout */}
          {!isUser && content.widgets.length > 0 && (
            <div className="mt-4 space-y-6 w-full animate-in slide-in-from-bottom-2 fade-in duration-500 pl-1">
              {content.widgets.map((widget, idx) => (
                <div key={idx}>
                  {widget.type === 'quiz' && <QuizComponent data={widget.data} />}
                  {widget.type === 'flashcards' && <FlashcardsComponent data={widget.data} />}
                  {widget.type === 'whiteboard' && <WhiteboardComponent data={widget.data} />}
                  {widget.type === 'study_plan' && <StudyPlanComponent data={widget.data} />}
                </div>
              ))}
            </div>
          )}
          
          {/* Action Bar (TTS & Copy) */}
          {!isUser && (
             <div className="flex gap-2 mt-2 ml-1 opacity-0 hover:opacity-100 transition-opacity duration-300">
               <button 
                onClick={handleTTS}
                disabled={isLoadingTTS}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium border border-transparent ${
                  isSpeaking 
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
                title="AI Voice Explanation"
               >
                 {isLoadingTTS ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                  isSpeaking ? <StopCircle className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                 {isLoadingTTS ? 'Loading...' : isSpeaking ? 'Stop' : 'Listen'}
               </button>
               
               <button 
                 onClick={handleCopy}
                 className="p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300"
               >
                 {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                 {copied ? 'Copied' : 'Copy'}
               </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MessageItem;