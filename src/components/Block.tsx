import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { BlockData } from '../types';
import { Sparkles, Wand2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function Block({ block, index }: { key?: React.Key | string | number; block: BlockData; index: number }) {
  const { updateBlock, addBlock, deleteBlock, blocks } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [block.text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('', index + 1);
      // Let the new block grab focus on mount
    }
    if (e.key === 'Backspace' && block.text === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
    }
  };

  const handleAiIterate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    
    setIsGenerating(true);
    try {
      const contextBlocks = blocks.filter(b => b.id !== block.id).map(b => b.text).join('\\n\\n');
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: block.text,
          instruction,
          context: contextBlocks
        }),
      });

      if (!response.ok) throw new Error('Failed to iterate');
      
      const data = await response.json();
      updateBlock(block.id, data.text);
      setAiMenuOpen(false);
      setInstruction('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate. Please check the backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="relative group flex w-full mb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* AI Button - shows on hover or focus */}
      <div className={cn(
        "absolute -left-10 top-1 transition-opacity duration-200",
        isHovered || isFocused || aiMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button
          onClick={() => setAiMenuOpen(!aiMenuOpen)}
          className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 focus:outline-none transition-colors"
          title="Ask AI to iterate"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-w-0 relative">
        <textarea
          ref={textareaRef}
          value={block.text}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Start typing..."
          className={cn(
            "w-full resize-none bg-transparent outline-none py-1 text-lg leading-relaxed text-gray-800 placeholder-gray-300 font-sans",
            isGenerating ? "animate-pulse text-indigo-500" : ""
          )}
          style={{ minHeight: '36px', overflow: 'hidden' }}
          disabled={isGenerating}
        />

        {/* AI Popover */}
        {aiMenuOpen && !isGenerating && (
          <div className="absolute top-10 left-0 w-80 bg-white shadow-xl border border-gray-100 rounded-xl p-3 z-10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Iterate with AI
              </span>
              <button onClick={() => setAiMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAiIterate} className="flex gap-2">
              <input 
                autoFocus
                type="text" 
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Make it sound more professional..."
                className="flex-1 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
              />
              <button 
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
