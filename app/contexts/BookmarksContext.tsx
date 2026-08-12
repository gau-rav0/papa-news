import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types';

interface BookmarksContextType {
  bookmarks: Article[];
  toggleBookmark: (article: Article) => void;
  isBookmarked: (id: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('bookmarks').then(savedBookmarks => {
      if (savedBookmarks) {
        try {
          setBookmarks(JSON.parse(savedBookmarks));
        } catch (e) {
          console.error('Failed to parse bookmarks', e);
        }
      }
    });
  }, []);

  const toggleBookmark = (article: Article) => {
    let newBookmarks;
    if (isBookmarked(article.id)) {
      newBookmarks = bookmarks.filter(b => b.id !== article.id);
    } else {
      newBookmarks = [...bookmarks, article];
    }
    setBookmarks(newBookmarks);
    AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const isBookmarked = (id: string) => {
    return bookmarks.some(b => b.id === id);
  };

  return (
    <BookmarksContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarksContext);
  if (!context) throw new Error('useBookmarks must be used within a BookmarksProvider');
  return context;
};
