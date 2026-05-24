export type BlockData = {
  id: string;
  text: string;
};

export type Suggestion = {
  id: string;
  originalTextSnippet: string;
  improvedText: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
};

export type AttachedFile = {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
};
