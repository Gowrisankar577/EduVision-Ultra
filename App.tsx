import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Settings, BookOpen, GraduationCap, X, Loader2, Sparkles, BrainCircuit, Trophy, Star, Medal, Crown, Calculator, Atom, Clock, Languages, ChevronRight, Wand2, Palette, MessageSquare, Video } from 'lucide-react';
import { Message, GradeLevel, UserSettings, ImageSize, VideoAspectRatio } from './types';
import { sendMessageToGemini, generateImage, editImage, generateVideo } from './services/geminiService';
import MessageItem from './components/MessageItem';

type AppMode = 'chat' | 'generate_image' | 'edit_image' | 'generate_video';

function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "# Welcome to EduVision Ultra X \nI'm your advanced AI ecosystem powered by **Gemini 3 Pro**. \n\nI can create **Study Plans**, solve **Math Problems** step-by-step, generate **Quizzes**, **Images**, and **Veo Videos**.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App Modes
  const [appMode, setAppMode] = useState<AppMode>('chat');
  const [generationSize, setGenerationSize] = useState<ImageSize>('1K');
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');

  // Gamification State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [rank, setRank] = useState('Beginner');
  const [showXpGain, setShowXpGain] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  
  // Settings
  const [settings, setSettings] = useState<UserSettings>({
    gradeLevel: GradeLevel.HighSchool,
    language: 'English',
    selectedMode: 'Standard Tutor',
    isTeacherMode: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested Prompts
  const SUGGESTED_PROMPTS = [
    { label: "Math Helper", icon: <Calculator className="w-5 h-5 text-blue-400" />, prompt: "Help me solve this quadratic equation step-by-step: 2x^2 + 5x - 3 = 0" },
    { label: "Exam Prep", icon: <Clock className="w-5 h-5 text-purple-400" />, prompt: "I have a Physics exam in 3 days. Create a detailed study plan." },
    { label: "Video Gen", icon: <Video className="w-5 h-5 text-red-400" />, prompt: "A cinematic drone shot of a futuristic library in the clouds." },
    { label: "Image Gen", icon: <Palette className="w-5 h-5 text-pink-400" />, prompt: "Generate a futuristic classroom on Mars." },
  ];

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Level & Rank Logic
  useEffect(() => {
    const newLevel = Math.floor(xp / 500) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }

    if (xp < 500) setRank('Beginner');
    else if (xp < 1500) setRank('Intermediate');
    else if (xp < 3000) setRank('Advanced');
    else setRank('Master');

  }, [xp, level]);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if ((!textToSend.trim() && selectedImages.length === 0) || isLoading) return;

    // Special logic for Image/Video Generation prompt from suggestions
    if (textOverride && textOverride.startsWith("Generate")) {
        if (textOverride.includes("video") || textOverride.includes("shot")) {
             setAppMode('generate_video');
        } else {
             setAppMode('generate_image');
        }
    } else if (textOverride && textOverride.includes("shot")) {
        setAppMode('generate_video');
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      images: selectedImages,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      if (appMode === 'generate_image') {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) await window.aistudio.openSelectKey();
        }

        let imageUrl: string;
        try {
            imageUrl = await generateImage(textToSend, generationSize);
        } catch (error: any) {
             if (error.status === 403 || error.message?.includes('403')) {
                 if (window.aistudio) {
                     await window.aistudio.openSelectKey(); 
                     imageUrl = await generateImage(textToSend, generationSize); 
                 } else throw error;
             } else throw error;
        }

        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: `Here is your **${generationSize}** generated image for: *"${textToSend}"*`,
            generatedImage: imageUrl,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMessage]);
        
        setXp(prev => prev + 20);
        setLastXpGain(20);
        setShowXpGain(true);
        setTimeout(() => setShowXpGain(false), 3000);

      } else if (appMode === 'edit_image') {
        if (!newMessage.images || newMessage.images.length === 0) throw new Error("Please upload an image to edit.");
        
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) await window.aistudio.openSelectKey();
        }
        
        let editedImageUrl: string;
        try {
            editedImageUrl = await editImage(textToSend, newMessage.images[0]);
        } catch (error: any) {
             if (error.status === 403 || error.message?.includes('403')) {
                 if (window.aistudio) {
                     await window.aistudio.openSelectKey(); 
                     editedImageUrl = await editImage(textToSend, newMessage.images[0]); 
                 } else throw error;
             } else throw error;
        }

        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: `I've edited the image based on your request: *"${textToSend}"*`,
            generatedImage: editedImageUrl,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMessage]);

      } else if (appMode === 'generate_video') {
         if (window.aistudio) {
             const hasKey = await window.aistudio.hasSelectedApiKey();
             if (!hasKey) await window.aistudio.openSelectKey();
         }

         let videoUrl: string;
         try {
             // Pass optional image for image-to-video
             const image = newMessage.images && newMessage.images.length > 0 ? newMessage.images[0] : undefined;
             videoUrl = await generateVideo(textToSend, videoAspectRatio, image);
         } catch (error: any) {
              if (error.status === 403 || error.message?.includes('403')) {
                  if (window.aistudio) {
                      await window.aistudio.openSelectKey();
                      const image = newMessage.images && newMessage.images.length > 0 ? newMessage.images[0] : undefined;
                      videoUrl = await generateVideo(textToSend, videoAspectRatio, image);
                  } else throw error;
              } else throw error;
         }

         const botMessage: Message = {
             id: (Date.now() + 1).toString(),
             role: 'model',
             text: `Here is your **${videoAspectRatio}** generated video for: *"${textToSend}"*`,
             generatedVideo: videoUrl,
             timestamp: Date.now()
         };
         setMessages(prev => [...prev, botMessage]);
         
         setXp(prev => prev + 50);
         setLastXpGain(50);
         setShowXpGain(true);
         setTimeout(() => setShowXpGain(false), 3000);

      } else {
        // Standard Chat Mode
        const responseText = await sendMessageToGemini(
            messages, 
            newMessage.text, 
            newMessage.images || [], 
            settings,
            { xp, rank, level }
        );
        
        const xpMatch = responseText.match(/\[XP:\s*\+(\d+)\]/);
        if (xpMatch) {
            const xpGain = parseInt(xpMatch[1], 10);
            setXp(prev => prev + xpGain);
            setLastXpGain(xpGain);
            setShowXpGain(true);
            setTimeout(() => setShowXpGain(false), 3000);
        }

        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText, 
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMessage]);
      }

    } catch (error: any) {
      let errorMessage = "I encountered an error processing your request.";
      if (error instanceof Error) errorMessage = error.message;

      if (
        (error.message && (error.message.includes('403') || error.message.includes('permission') || error.message.includes('Requested entity was not found'))) ||
        (error.status === 403)
      ) {
         errorMessage = "Access denied. Please select a valid API Key from a paid project.";
         if (window.aistudio) {
             await window.aistudio.openSelectKey();
         }
      }
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: `⚠️ ${errorMessage}`,
          timestamp: Date.now(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRankIcon = () => {
    switch (rank) {
      case 'Master': return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />;
      case 'Advanced': return <Medal className="w-5 h-5 text-purple-400 fill-purple-400/20" />;
      case 'Intermediate': return <Star className="w-5 h-5 text-blue-400 fill-blue-400/20" />;
      default: return <Trophy className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-screen text-slate-100 overflow-hidden relative selection:bg-teal-500/30">
      
      {/* Header */}
      <header className="flex-none h-16 glass-panel border-b border-slate-800/50 flex items-center justify-between px-4 md:px-6 z-20 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
            <div className="relative bg-gradient-to-tr from-slate-900 to-slate-800 p-2 rounded-xl border border-slate-700/50">
              <BrainCircuit className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-200 to-white hidden md:block tracking-tight">
              EduVision Ultra X
            </h1>
            <h1 className="text-xl font-bold text-white md:hidden">EduVision X</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/40 rounded-full px-4 py-1.5 border border-slate-700/50 shadow-inner">
             <div className="relative flex items-center gap-2">
                {getRankIcon()}
                <span className={`text-sm font-bold hidden sm:inline ${
                  rank === 'Master' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]' :
                  rank === 'Advanced' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]' :
                  rank === 'Intermediate' ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {rank}
                </span>
                {showXpGain && (
                   <span className="absolute -top-8 -right-2 text-green-400 font-bold text-sm animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                     +{lastXpGain} XP
                   </span>
                )}
             </div>
             <div className="h-4 w-px bg-slate-700 mx-1"></div>
             <div className="flex flex-col w-24">
               <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  <span>Lvl {level}</span>
                  <span className="text-slate-300">{xp} XP</span>
               </div>
               <div className="w-full h-1.5 bg-slate-800 rounded-full mt-0.5 overflow-hidden ring-1 ring-slate-700/50">
                 <div 
                   className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(45,212,191,0.4)]" 
                   style={{ width: `${Math.min((xp % 500) / 5, 100)}%` }} 
                 />
               </div>
             </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 hover:bg-slate-800/80 rounded-full transition-all text-slate-400 hover:text-white border border-transparent hover:border-slate-700 active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-48 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map(msg => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          {messages.length === 1 && !isLoading && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 animate-fade-in-up">
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-blue-500/50 transition-all text-left group"
                  >
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm group-hover:text-blue-300 transition-colors">{item.label}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.prompt}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-3 ml-1 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-900 to-slate-900 border border-teal-800/50 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-sm font-medium text-slate-400">
                {appMode === 'generate_image' ? 'Generating 4K artwork...' : 
                 appMode === 'edit_image' ? 'Editing image...' : 
                 appMode === 'generate_video' ? 'Generating video with Veo...' :
                 'EduVision Ultra X is thinking...'}
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pt-10 pb-6 px-4 z-10 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto flex flex-col gap-2">
          
          <div className="flex items-center justify-between px-2">
             <div className="flex bg-slate-900/80 backdrop-blur-md rounded-lg p-1 border border-slate-700/50 shadow-lg">
                <button 
                  onClick={() => setAppMode('chat')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${appMode === 'chat' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                   <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button 
                  onClick={() => setAppMode('generate_image')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${appMode === 'generate_image' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                   <Palette className="w-3.5 h-3.5" /> Image
                </button>
                <button 
                  onClick={() => setAppMode('edit_image')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${appMode === 'edit_image' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                   <Wand2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  onClick={() => setAppMode('generate_video')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${appMode === 'generate_video' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                   <Video className="w-3.5 h-3.5" /> Video
                </button>
             </div>

             {appMode === 'generate_image' && (
               <div className="flex bg-slate-900/80 backdrop-blur-md rounded-lg p-1 border border-slate-700/50 shadow-lg animate-in fade-in slide-in-from-bottom-1">
                  {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setGenerationSize(size)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${generationSize === size ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {size}
                    </button>
                  ))}
               </div>
             )}

             {appMode === 'generate_video' && (
               <div className="flex bg-slate-900/80 backdrop-blur-md rounded-lg p-1 border border-slate-700/50 shadow-lg animate-in fade-in slide-in-from-bottom-1">
                  {(['16:9', '9:16'] as VideoAspectRatio[]).map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setVideoAspectRatio(ratio)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${videoAspectRatio === ratio ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {ratio}
                    </button>
                  ))}
               </div>
             )}
          </div>

          <div className="relative group rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 transition-all focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] overflow-hidden">
            {selectedImages.length > 0 && (
              <div className="flex gap-3 px-4 pt-4 overflow-x-auto pb-2">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative group/img flex-shrink-0 animate-in fade-in zoom-in duration-200">
                    <img src={img} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-600 shadow-lg" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 text-white shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-1 p-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl transition-all ${
                    (appMode === 'edit_image' || appMode === 'generate_video') && selectedImages.length === 0 
                    ? appMode === 'edit_image' ? 'text-purple-400 bg-purple-500/10 animate-pulse ring-1 ring-purple-500/50' : 'text-slate-400' 
                    : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                }`}
                title="Upload Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload}
              />

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                    appMode === 'generate_image' ? "Describe the image you want to generate..." : 
                    appMode === 'edit_image' ? "Describe how to edit the uploaded image..." : 
                    appMode === 'generate_video' ? "Describe the video you want Veo to create..." :
                    "Ask a question..."
                }
                className="flex-1 bg-transparent text-white placeholder-slate-500 resize-none outline-none py-3 px-2 max-h-32 overflow-y-auto font-medium"
                rows={1}
                style={{ minHeight: '44px' }}
              />

              <button 
                onClick={() => handleSend()}
                disabled={isLoading || (!inputValue.trim() && selectedImages.length === 0)}
                className={`p-3 rounded-xl text-white shadow-lg transition-all active:scale-95 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    appMode === 'generate_image' ? 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 shadow-pink-500/20' :
                    appMode === 'edit_image' ? 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 shadow-purple-500/20' :
                    appMode === 'generate_video' ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-red-500/20' :
                    'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)]'
                }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 appMode === 'generate_image' ? <Sparkles className="w-5 h-5" /> : 
                 appMode === 'edit_image' ? <Wand2 className="w-5 h-5" /> :
                 appMode === 'generate_video' ? <Video className="w-5 h-5" /> :
                 <Send className="w-5 h-5" />
                }
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-1 font-medium tracking-wide uppercase">
            EduVision Ultra X • Powered by Gemini 3 Pro • Veo • Nano Banana
          </p>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300" onClick={() => setIsSettingsOpen(false)}>
          <div 
            className="w-full md:w-80 h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="text-blue-400" /> Study Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:border-teal-500/30 transition-colors group">
               <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                     Teacher Mode
                     {settings.isTeacherMode && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>}
                  </span>
                  <button 
                    onClick={() => setSettings(prev => ({ ...prev, isTeacherMode: !prev.isTeacherMode }))}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${settings.isTeacherMode ? 'bg-teal-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.isTeacherMode ? 'translate-x-5' : ''}`} />
                  </button>
               </div>
               <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                 Activates Content Quality Checker.
               </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Grade Level</h3>
              <div className="space-y-2">
                {Object.values(GradeLevel).map((level) => (
                  <label key={level} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    settings.gradeLevel === level 
                      ? 'bg-blue-900/20 border-blue-500/50 text-blue-200' 
                      : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="gradeLevel" 
                      className="hidden"
                      checked={settings.gradeLevel === level}
                      onChange={() => setSettings(prev => ({ ...prev, gradeLevel: level }))}
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      settings.gradeLevel === level ? 'border-blue-400' : 'border-slate-600'
                    }`}>
                      {settings.gradeLevel === level && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                    <span className="text-sm font-medium">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Learning Mode</h3>
              <div className="relative">
                <select 
                  value={settings.selectedMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, selectedMode: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 appearance-none text-sm font-medium transition-all hover:bg-slate-750"
                >
                  <option>Standard Tutor</option>
                  <option>Problem Solver (Step-by-Step)</option>
                  <option>Exam Booster</option>
                  <option>Socratic Method (Teach-Back)</option>
                  <option>Explain Like I'm 5</option>
                  <option>Career/Real-World Application</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                  <Settings className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Language</h3>
              <div className="relative">
                <select 
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 appearance-none text-sm font-medium hover:bg-slate-750"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                  <option>Mandarin</option>
                  <option>Arabic</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                   <Languages className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
               <button 
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-semibold"
                  onClick={() => {
                    setMessages([messages[0]]);
                    setIsSettingsOpen(false);
                    setXp(0);
                    setLevel(1);
                    setRank('Beginner');
                  }}
               >
                 <BookOpen className="w-4 h-4" /> Reset Session
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;