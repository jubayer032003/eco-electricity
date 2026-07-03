import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Trash2, Copy, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: string;
  timestamp: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const AIAssistantChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      parts: 'Hello! I am EBot, your AI Operations Assistant. Ask me anything about the office power consumption, active alerts, cost estimations, or efficiency scores!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      parts: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Map history payload format for Gemini API structure
      const historyPayload = messages.map((m) => ({
        role: m.role,
        parts: m.parts
      }));

      const res = await fetch(`${BACKEND_URL}/ai-assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyPayload })
      });

      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        parts: data.response || 'I apologize, I could not calculate that query. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error('[AI Chat] Failed to post message:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        parts: 'Sorry, I am having trouble connecting to the operations hub. Please check if the backend is active.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        parts: 'Conversation reset. How can I help you manage office energy metrics now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const suggestedPrompts = [
    'Office Summary',
    'Current Alerts',
    'Highest Power Room',
    'Active Devices',
    'Energy Cost',
    'Efficiency Score'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-bounce"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Modern Chat Window */}
      {isOpen && (
        <div className="w-[360px] h-[500px] rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-in-out scale-100 origin-bottom-right">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-600/20 text-sky-400 rounded-lg">
                <Sparkles size={14} className="animate-pulse" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white">EBot Operations Assistant</h3>
                <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online context
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                title="Clear Chat History"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Log Panel */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] p-3 rounded-2xl relative group transition-all duration-300 ${
                  m.role === 'user'
                    ? 'self-end bg-sky-600 text-white rounded-br-none'
                    : 'self-start bg-slate-900 text-slate-200 border border-slate-850 rounded-bl-none'
                }`}
              >
                <p className="text-[11px] leading-relaxed whitespace-pre-line">{m.parts}</p>
                
                <div className="flex justify-between items-center mt-1.5 text-[8px] text-slate-500 font-medium">
                  <span>{m.timestamp}</span>
                  {m.role === 'model' && (
                    <button
                      onClick={() => handleCopyText(m.parts)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-white rounded"
                      title="Copy response"
                    >
                      <Copy size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Bouncing Dots Typing Indicator */}
            {isTyping && (
              <div className="self-start bg-slate-900 text-slate-400 border border-slate-850 p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Clickable Suggested Prompts */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-950 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 text-[9px] font-bold text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-lg hover:text-white transition-all duration-300 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-slate-900 bg-slate-900/60 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask EBot about operations..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <button
              type="submit"
              className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors flex items-center justify-center"
            >
              <Send size={12} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
