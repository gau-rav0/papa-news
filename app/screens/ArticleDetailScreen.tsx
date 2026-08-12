import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, useTheme as useNavTheme, RouteProp } from '@react-navigation/native';
import { Bookmark } from 'lucide-react-native';
import { format } from 'date-fns';

import { RootStackParamList, Article } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBookmarks } from '../contexts/BookmarksContext';

type ArticleDetailRouteProp = RouteProp<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen() {
  const route = useRoute<ArticleDetailRouteProp>();
  const navigation = useNavigation();
  const { colors } = useNavTheme();
  const { theme } = useTheme();
  
  const { article } = route.params;
  const { getFontSizeNumber } = useSettings();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [imageError, setImageError] = useState(false);
  const fontSize = getFontSizeNumber();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => toggleBookmark(article)}>
          <Bookmark 
            color={colors.text} 
            size={24} 
            fill={isBookmarked(article.id) ? colors.text : 'transparent'} 
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, article, isBookmarked, toggleBookmark, colors.text]);

  const pubDate = new Date(article.published_at);
  const formattedDate = format(pubDate, 'dd MMMM yyyy • hh:mm a');

  const openSource = () => {
    if (article.source_url) {
      Linking.openURL(article.source_url).catch(err => {
        console.error("Couldn't load page", err);
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>
          {article.hindi_title || article.original_title}
        </Text>
        
        <View style={styles.metaData}>
          <Text style={[styles.date, { color: theme === 'dark' ? '#aaaaaa' : '#666666' }]}>
            {formattedDate}
          </Text>
          {article.category && (
            <Text style={[styles.category, { color: theme === 'dark' ? '#90caf9' : '#1565c0' }]}>
              {article.category}
            </Text>
          )}
        </View>

        {article.image_url && !imageError && (
          <Image
            source={{ uri: article.image_url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}

        <Text style={[styles.content, { color: colors.text, fontSize, lineHeight: fontSize * 1.5 }]}>
          {article.hindi_content || article.original_content}
        </Text>

        <View style={[styles.sourceContainer, { borderTopColor: theme === 'dark' ? '#333' : '#ddd' }]}>
          <Text style={[styles.sourceText, { color: theme === 'dark' ? '#ccc' : '#444' }]}>
            Source: Lapaas Voice
          </Text>
          <TouchableOpacity style={styles.sourceButton} onPress={openSource}>
            <Text style={styles.sourceButtonText}>Read Original Article →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 36,
  },
  metaData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  date: {
    fontSize: 16,
  },
  category: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#e1e4e8',
  },
  content: {
    // fontSize and lineHeight dynamically set
  },
  sourceContainer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 16,
    marginBottom: 16,
  },
  sourceButton: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  sourceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
