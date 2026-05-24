import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Block } from './Block';
import { AlertCircle, FileText, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function Editor() {
  const { 
    blocks, 
    suggestions, 
    isProactiveLoading, 
    setSuggestions, 
    acceptSuggestion, 
    rejectSuggestion, 
    setProactiveLoading 
  } = useStore();

  const handleProactiveSuggest = async () => {
    const documentText = blocks.map(b => b.text).join('\\n\\n');
    if (!documentText.trim()) return;

    setProactiveLoading(true);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText }),
      });
      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      
      const newSuggestions = (data.suggestions || []).map((s: any) => ({
        ...s,
        id: uuidv4(),
        status: 'pending'
      }));
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setProactiveLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50/50">
      
      {/* Editor Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-8 py-16">
          <header className="mb-12">
            <h1 className="text-4xl font-serif font-medium text-gray-900 tracking-tight">Untitled Draft</h1>
            <p className="text-gray-500 mt-2 font-sans font-light">Magic Quill is your thought partner.</p>
          </header>

          <div className="flex flex-col">
            {blocks.map((block, index) => (
              <Block key={block.id} block={block} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Proactive Feedback Sidebar */}
      <div className="w-full md:w-80 border-l border-gray-100 bg-white h-full flex flex-col pt-6 pb-4 px-4 overflow-y-auto shadow-sm shadow-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> AI Feedback
          </h2>
          <button 
            onClick={handleProactiveSuggest} 
            disabled={isProactiveLoading}
            className="text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded cursor-pointer transition border border-gray-200"
          >
            {isProactiveLoading ? 'Scanning...' : 'Scan Draft'}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {suggestions.length === 0 && !isProactiveLoading && (
             <div className="text-sm text-gray-400 text-center py-10 flex flex-col items-center gap-2">
               <FileText className="w-8 h-8 opacity-20" />
               <p>No suggestions yet.<br/>Write something and scan for feedback.</p>
             </div>
          )}
          
          {suggestions.filter(s => s.status === 'pending').map(suggestion => (
            <div key={suggestion.id} className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-sm animate-in fade-in slide-in-from-right-4">
              <p className="font-semibold text-amber-800 mb-1">{suggestion.reason}</p>
              
              <div className="mt-2 space-y-1">
                <p className="text-xs font-mono text-rose-600/80 bg-rose-50/50 p-1.5 rounded line-through">
                  {suggestion.originalTextSnippet}
                </p>
                <p className="text-xs font-mono text-emerald-700 bg-emerald-50/50 p-1.5 rounded">
                  {suggestion.improvedText}
                </p>
              </div>

              <div className="mt-3 flex gap-2 justify-end">
                <button 
                  onClick={() => rejectSuggestion(suggestion.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded bg-white hover:bg-gray-100 shadow-sm border border-gray-200"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => acceptSuggestion(suggestion.id)}
                  className="p-1 text-emerald-600 hover:text-white rounded bg-white hover:bg-emerald-500 shadow-sm border border-gray-200 hover:border-emerald-500 transition-colors"
                  title="Accept"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
