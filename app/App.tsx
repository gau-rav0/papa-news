import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { BookmarksProvider } from './contexts/BookmarksContext';

import HomeScreen from './screens/HomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import SavedScreen from './screens/SavedScreen';
import SettingsScreen from './screens/SettingsScreen';
import { RootStackParamList } from './types';
import { registerForPushNotifications } from './lib/notifications';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  const { theme } = useTheme();

  useEffect(() => { registerForPushNotifications(); }, []);

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#f8f9fa',
      card: '#ffffff',
      text: '#212529',
    },
  };

  const customDarkTheme = {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: '#121212',
      card: '#1e1e1e',
      text: '#f8f9fa',
    },
  };

  return (
    <NavigationContainer theme={theme === 'dark' ? customDarkTheme : customLightTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Lapaas Hindi News' }} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: '' }} />
        <Stack.Screen name="Saved" component={SavedScreen} options={{ title: 'Saved Articles' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BookmarksProvider>
          <Navigation />
        </BookmarksProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
