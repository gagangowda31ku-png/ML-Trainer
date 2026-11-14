import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Cpu,
  BrainCircuit,
  Database
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ChatTab: React.FC = () => {
  const {
    chatMessages,
    isChatLoading,
    sendChatMessage,
    profile,
    bestModel,
  } = useData();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;
    const text = inputMessage.trim();
    setInputMessage('');
    sendChatMessage(text);
  };

  const handlePromptClick = (question: string) => {
    sendChatMessage(question);
  };

  const suggestedQuestions = [
    "What are the top 3 predictive drivers and how do they impact the target?",
    "Why did the top AutoML model outperform the other candidates?",
    "What data quality or missingness risks should we watch out for?",
    "Provide a strategic business recommendation based on this analysis."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">AI Data Scientist Co-Pilot</h2>
              <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800">
                Gemini 3.7 Flash Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {profile ? `Context: ${profile.datasetName} (${profile.totalRows} rows)` : 'Grounded on active dataset state'}
            </p>
          </div>
        </div>

        {bestModel && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Top Model: {bestModel.name}</span>
          </div>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isUser
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none prose prose-invert max-w-none'
                }`}
              >
                <div className="markdown-body">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {/* Suggested questions if provided */}
                {msg.suggestedQuestions && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 not-prose">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Suggested Inquiries:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePromptClick(q)}
                          className="rounded-lg bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-cyan-300 border border-slate-700/80 transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-500 block mt-2 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isChatLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
              <span>Analyzing dataset context and formulating mathematical response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips (if empty input) */}
      <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800/60 overflow-x-auto flex gap-2">
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handlePromptClick(q)}
            className="whitespace-nowrap rounded-full bg-slate-900 hover:bg-slate-800 px-3 py-1 text-[11px] text-slate-300 border border-slate-800 hover:border-cyan-500/40 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask anything about your dataset, model leaderboard, SHAP values, or recommendations..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isChatLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
