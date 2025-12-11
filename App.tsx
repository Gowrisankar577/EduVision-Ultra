import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Settings, BookOpen, GraduationCap, X, Loader2, Sparkles, BrainCircuit, Trophy, Star, Medal, Crown } from 'lucide-react';
import { Message, GradeLevel, UserSettings } from './types';
import { sendMessageToGemini } from './services/geminiService';
import MessageItem from './components/MessageItem';

function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm EduVision Ultra. I can help you understand any topic, solve problems, or prepare for exams.\n\nUpload an image of a diagram, ask a question, or paste text to get started! How can I help you learn today?",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  const handleSend = async () => {
    if ((!inputValue.trim() && selectedImages.length === 0) || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      images: selectedImages,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      // Pass XP and Rank to service for Adaptive Difficulty
      const responseText = await sendMessageToGemini(
        messages, 
        newMessage.text, 
        newMessage.images || [], 
        settings,
        { xp, rank, level }
      );
      
      // Check for XP in response
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
        text: responseText, // The MessageItem component cleans up the [XP] tag for display
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "I encountered an error processing your request. Please check your connection or API key.",
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
      case 'Master': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'Advanced': return <Medal className="w-5 h-5 text-purple-400" />;
      case 'Intermediate': return <Star className="w-5 h-5 text-blue-400" />;
      default: return <Trophy className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* Header */}
      <header className="flex-none h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-teal-400 p-2 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 hidden md:block">
              EduVision Ultra
            </h1>
            <h1 className="text-xl font-bold text-white md:hidden">EduVision</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* XP / Gamification Display */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-full px-4 py-1.5 border border-slate-700">
             <div className="relative flex items-center gap-2">
                {getRankIcon()}
                <span className={`text-sm font-bold hidden sm:inline ${
                  rank === 'Master' ? 'text-yellow-500' :
                  rank === 'Advanced' ? 'text-purple-400' :
                  rank === 'Intermediate' ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {rank}
                </span>
                {showXpGain && (
                   <span className="absolute -top-6 -right-2 text-green-400 font-bold text-sm animate-bounce shadow-black drop-shadow-md">
                     +{lastXpGain} XP
                   </span>
                )}
             </div>
             <div className="h-4 w-px bg-slate-600 mx-1"></div>
             <div className="flex flex-col w-24">
               <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  <span>Lvl {level}</span>
                  <span>{xp} XP</span>
               </div>
               <div className="w-full h-1.5 bg-slate-700 rounded-full mt-0.5 overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-1000 ease-out" 
                   style={{ width: `${(xp % 500) / 5}%` }} 
                 />
               </div>
             </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {messages.map(msg => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-3 text-slate-500 ml-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-teal-900/50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal-500" />
              </div>
              <span className="text-sm font-medium">EduVision is analyzing learning style & crafting response...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-10 pb-6 px-4 z-10">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 flex flex-col gap-2">
          
          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="flex gap-2 px-2 pt-2 overflow-x-auto">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group flex-shrink-0">
                  <img src={img} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Upload Image"
            >
              <ImageIcon className="w-6 h-6" />
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
              placeholder="Ask a question, upload a diagram, or say '3 days until exam'..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 resize-none outline-none py-3 max-h-32 overflow-y-auto"
              rows={1}
            />

            <button 
              onClick={handleSend}
              disabled={isLoading || (!inputValue.trim() && selectedImages.length === 0)}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          EduVision Ultra • Powered by Gemini 3 Pro
        </p>
      </div>

      {/* Settings Modal/Sidebar */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end transition-opacity" onClick={() => setIsSettingsOpen(false)}>
          <div 
            className="w-full md:w-80 h-full bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="text-blue-400" /> Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Teacher Mode Toggle */}
            <div className="mb-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
               <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300">Teacher Mode</span>
                  <button 
                    onClick={() => setSettings(prev => ({ ...prev, isTeacherMode: !prev.isTeacherMode }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.isTeacherMode ? 'bg-teal-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.isTeacherMode ? 'translate-x-6' : ''}`} />
                  </button>
               </div>
               <p className="text-xs text-slate-500">
                 Activates Content Quality Checker to analyze and improve lesson notes.
               </p>
            </div>

            {/* Grade Level */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Grade Level</h3>
              <div className="space-y-2">
                {Object.values(GradeLevel).map((level) => (
                  <label key={level} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.gradeLevel === level 
                      ? 'bg-blue-900/30 border-blue-500 text-blue-100' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="gradeLevel" 
                      className="hidden"
                      checked={settings.gradeLevel === level}
                      onChange={() => setSettings(prev => ({ ...prev, gradeLevel: level }))}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      settings.gradeLevel === level ? 'border-blue-400' : 'border-slate-500'
                    }`}>
                      {settings.gradeLevel === level && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Learning Mode</h3>
              <select 
                value={settings.selectedMode}
                onChange={(e) => setSettings(prev => ({ ...prev, selectedMode: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500"
              >
                <option>Standard Tutor</option>
                <option>Problem Solver (Step-by-Step)</option>
                <option>Exam Booster</option>
                <option>Socratic Method (Teach-Back)</option>
                <option>Explain Like I'm 5</option>
                <option>Career/Real-World Application</option>
              </select>
            </div>

            {/* Language */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Language</h3>
              <select 
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500"
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
            </div>

            <div className="mt-auto border-t border-slate-800 pt-6">
               <button 
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  onClick={() => {
                    setMessages([]);
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