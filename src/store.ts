import { create } from 'zustand';
import { BlockData, Suggestion, AttachedFile } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  blocks: BlockData[];
  suggestions: Suggestion[];
  files: AttachedFile[];
  isProactiveLoading: boolean;

  addBlock: (text: string, index?: number) => void;
  updateBlock: (id: string, text: string) => void;
  deleteBlock: (id: string) => void;
  setBlocks: (blocks: BlockData[]) => void;

  addFile: (file: AttachedFile) => void;
  removeFile: (id: string) => void;

  setSuggestions: (suggestions: Suggestion[]) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  setProactiveLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  blocks: [{ id: uuidv4(), text: '' }],
  suggestions: [],
  files: [],
  isProactiveLoading: false,

  addBlock: (text, index) => set((state) => {
    const newBlock = { id: uuidv4(), text };
    if (index !== undefined) {
      const newBlocks = [...state.blocks];
      newBlocks.splice(index, 0, newBlock);
      return { blocks: newBlocks };
    }
    return { blocks: [...state.blocks, newBlock] };
  }),

  updateBlock: (id, text) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, text } : b)
  })),

  deleteBlock: (id) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== id)
  })),

  setBlocks: (blocks) => set({ blocks }),

  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  
  removeFile: (id) => set((state) => ({ files: state.files.filter(f => f.id !== id) })),

  setSuggestions: (suggestions) => set({ suggestions }),

  acceptSuggestion: (id) => set((state) => {
    const suggestion = state.suggestions.find(s => s.id === id);
    if (!suggestion) return state;
    
    // Apply suggestion by finding the snippet in any block and replacing it
    let applied = false;
    const newBlocks = state.blocks.map(b => {
      if (!applied && b.text.includes(suggestion.originalTextSnippet)) {
        applied = true;
        return { ...b, text: b.text.replace(suggestion.originalTextSnippet, suggestion.improvedText) };
      }
      return b;
    });

    return { 
      blocks: newBlocks,
      suggestions: state.suggestions.map(s => s.id === id ? { ...s, status: 'accepted' } : s)
    };
  }),

  rejectSuggestion: (id) => set((state) => ({
    suggestions: state.suggestions.map(s => s.id === id ? { ...s, status: 'rejected' } : s)
  })),

  setProactiveLoading: (loading) => set({ isProactiveLoading: loading }),
}));
