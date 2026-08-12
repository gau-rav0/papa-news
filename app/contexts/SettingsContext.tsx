import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSize = 'small' | 'medium' | 'large';

interface SettingsContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  getFontSizeNumber: () => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    AsyncStorage.getItem('fontSize').then(savedSize => {
      if (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large') {
        setFontSizeState(savedSize);
      }
    });
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    AsyncStorage.setItem('fontSize', size);
  };

  const getFontSizeNumber = () => {
    switch (fontSize) {
      case 'small': return 16;
      case 'large': return 24;
      case 'medium':
      default: return 20;
    }
  };

  return (
    <SettingsContext.Provider value={{ fontSize, setFontSize, getFontSizeNumber }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
