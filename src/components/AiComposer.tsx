import React, { useState } from 'react';
import { useStore } from '../store';
import { FileUp, Sparkles, X, Loader2 } from 'lucide-react';

export function AiComposer() {
  const { addBlock, files, addFile, removeFile, blocks, setBlocks } = useStore();
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    Array.from(fileList as Iterable<File>).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        // Split data URL: data:image/png;base64,.....
        const base64Data = result.split(',')[1];
        addFile({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && files.length === 0) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, files }),
      });
      if (!response.ok) throw new Error('Failed to draft');
      
      const data = await response.json();
      const generatedText = data.text || '';
      
      // Split into paragraphs/blocks 
      const paragraphs = generatedText.split('\\n\\n').filter((p: string) => p.trim());
      
      const newBlocks = paragraphs.map((p: string) => ({
        id: crypto.randomUUID(),
        text: p
      }));

      // if document is essentially empty (1 empty block), replace it
      if (blocks.length === 1 && blocks[0].text === '') {
        setBlocks(newBlocks.length > 0 ? newBlocks : [{ id: crypto.randomUUID(), text: '' }]);
      } else {
        // Append
        setBlocks([...blocks, ...newBlocks]);
      }
      
      setIsOpen(false);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 md:right-88 bg-gray-900 text-white rounded-full p-4 shadow-lg hover:bg-gray-800 transition-transform hover:scale-105 group flex items-center justify-center"
        title="Draft with AI"
      >
        <Sparkles className="w-6 h-6 group-hover:text-amber-200 transition-colors" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> 
            Magic Composer
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDraft} className="p-6">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="What should we write about? (e.g. Write an introduction for an essay about minimalist design...)"
            className="w-full h-32 resize-none border-0 bg-transparent text-lg outline-none placeholder-gray-300 font-sans"
            autoFocus
            disabled={isGenerating}
          />
          
          {/* Attached Files */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 mb-4">
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-700">
                  <span className="truncate max-w-[150px] font-medium">{f.name}</span>
                  <button type="button" onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
            <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition">
              <FileUp className="w-4 h-4" />
              <span>Attach context</span>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isGenerating} />
            </label>

            <button
              type="submit"
              disabled={isGenerating || (!prompt.trim() && files.length === 0)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
