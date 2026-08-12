import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';
import { useNavigation, useTheme as useNavTheme } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import { useBookmarks } from '../contexts/BookmarksContext';
import { useTheme } from '../contexts/ThemeContext';
import { Article, RootStackParamList } from '../types';

type SavedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Saved'>;

export default function SavedScreen() {
  const { bookmarks } = useBookmarks();
  const navigation = useNavigation<SavedScreenNavigationProp>();
  const { colors } = useNavTheme();
  const { theme } = useTheme();

  const renderArticle = ({ item }: { item: Article }) => {
    const pubDate = new Date(item.published_at);
    const formattedDate = format(pubDate, 'dd MMM yyyy • hh:mm a');

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      >
        {item.image_url && (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.cardImage} 
            resizeMode="cover"
          />
        )}
        <View style={styles.cardContent}>
          {item.category && (
            <Text style={[styles.category, { color: theme === 'dark' ? '#90caf9' : '#1565c0' }]}>
              {item.category}
            </Text>
          )}
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.hindi_title || item.original_title}
          </Text>
          <Text style={[styles.date, { color: theme === 'dark' ? '#aaaaaa' : '#666666' }]}>
            {formattedDate}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookmarks}
        keyExtractor={item => item.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No saved articles yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e1e4e8',
  },
  cardContent: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  date: {
    fontSize: 14,
  },
});
