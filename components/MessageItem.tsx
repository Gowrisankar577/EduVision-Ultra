import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, InteractiveBlock } from '../types';
import QuizComponent from './QuizData';
import FlashcardsComponent from './Flashcards';
import WhiteboardComponent from './Whiteboard';
import StudyPlanComponent from './StudyPlan';
import { User, Bot, AlertTriangle, Volume2, StopCircle } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean text for speech: remove code blocks, JSON, and markdown symbols
    const speakableText = message.text
      .replace(/```[\s\S]*?```/g, ' Code block omitted. ') // Skip code blocks
      .replace(/\[XP:\s*\+\d+\]/g, '') // Skip XP
      .replace(/[#*`_]/g, '') // Remove markdown syntax
      .replace(/\n+/g, '. '); // Pause on newlines

    const utterance = new SpeechSynthesisUtterance(speakableText);
    utterance.rate = 1.05; 
    utterance.pitch = 1.0;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google voices, or a natural English voice
    const preferredVoice = voices.find(v => 
      (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          isUser ? 'bg-blue-600' : 'bg-teal-600'
        }`}>
          {isUser ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
        </div>

        {/* Content Container */}
        <div className="flex flex-col w-full min-w-0">
          <div className={`flex flex-col rounded-2xl p-5 shadow-md ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
          }`}>
            
            {/* Images if user uploaded */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.images.map((img, idx) => (
                  <img key={idx} src={img} alt="User upload" className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-600 object-cover" />
                ))}
              </div>
            )}

            {/* Text Content */}
            <div className="markdown-body text-sm md:text-base leading-relaxed break-words">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.text}</p>
              ) : (
                <>
                  {content.textParts.map((part, idx) => (
                    <ReactMarkdown key={idx}>{part}</ReactMarkdown>
                  ))}
                </>
              )}
            </div>

            {/* Error Indicator */}
            {message.isError && (
              <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Failed to send message.</span>
              </div>
            )}
          </div>

          {/* Widgets rendered OUTSIDE the bubble for full width/better layout */}
          {!isUser && content.widgets.length > 0 && (
            <div className="mt-2 space-y-4 w-full animate-fade-in pl-1">
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
          
          {/* Action Bar (TTS) */}
          {!isUser && (
             <div className="flex gap-2 mt-1 ml-1">
               <button 
                onClick={handleSpeak}
                className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs font-medium ${
                  isSpeaking ? 'bg-teal-500/20 text-teal-300' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
                title="Read Aloud (AI Voice Explanation Mode)"
               >
                 {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                 {isSpeaking ? 'Stop Voice' : 'Voice Explanation'}
               </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MessageItem;