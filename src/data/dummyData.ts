export interface Shayari {
  id: string;
  text: string;
  poet: string;
  poetId: string;
  language: 'roman' | 'urdu' | 'hindi' | 'english';
  form: 'Ghazal' | 'Nazm' | 'Sher' | 'Quote' | 'Rubai' | 'Qitta';
  mood: string[];
  topics: string[];
  likes: number;
  saves: number;
  length: 'short' | 'medium' | 'long';
  languages: {
    romanUrdu?: string;
    urdu?: string;
    hindi?: string;
    english?: string;
  };
}

export interface Ebook {
  id: string;
  slug: string;
  poetId: string;
  poetName: string;
  cover: string;
  title: {
    romanUrdu?: string;
    urdu?: string;
    hindi?: string;
    english?: string;
  };
  description: {
    romanUrdu?: string;
    urdu?: string;
    hindi?: string;
    english?: string;
  };
  pages: number;
  fileUrls?: {
    pdf?: string;
    epub?: string;
  };
}

export interface DictionaryEntry {
  id: string;
  wordKey: string;
  wordUrdu?: string;
  wordRoman?: string;
  wordHindi?: string;
  wordEnglish?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  meaningsEnglish: string[];
  meaningsUrdu?: string[];
  notes?: string;
  synonyms?: string[];
  exampleShayariIds?: string[];
}

export interface Poet {
  id: string;
  name: string;
  nameUrdu?: string;
  avatar: string;
  lifespan: string;
  country: string;
  bio: string;
  tagline: string;
  primaryLanguage: string;
  shayariCount: number;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  count: number;
  icon: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  cover: string;
  itemCount: number;
  items: string[];
}

export const poets: Poet[] = [];

export const shayariData: Shayari[] = [];

export const topics: Topic[] = [];

export const collections: Collection[] = [];

export const ebooks: Ebook[] = [];

export const dictionaryEntries: DictionaryEntry[] = [];
