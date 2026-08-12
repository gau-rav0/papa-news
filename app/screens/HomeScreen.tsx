import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useTheme as useNavTheme } from '@react-navigation/native';
import { format } from 'date-fns';
import { Bookmark, Settings, AlertCircle } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { Article, RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useNavTheme();
  const { theme } = useTheme();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('processing_status', 'completed')
        .order('published_at', { ascending: false });

      if (fetchError) throw fetchError;

      const fetchedArticles = data as Article[];
      setArticles(fetchedArticles);

      // Extract unique categories
      const cats = new Set(fetchedArticles.map(a => a.category).filter(Boolean) as string[]);
      setCategories(['All', ...Array.from(cats)]);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError('Unable to load articles. Please check your connection.');
    }
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    await fetchArticles();
    
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
            <Bookmark color={colors.text} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Settings color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors]);

  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  const renderArticle = ({ item }: { item: Article }) => {
    const pubDate = new Date(item.published_at);
    // Rough IST conversion formatting
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
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
            {item.hindi_title || item.original_title}
          </Text>
          <Text style={[styles.date, { color: theme === 'dark' ? '#aaaaaa' : '#666666' }]}>
            {formattedDate}
          </Text>
          <Text style={[styles.readMore, { color: theme === 'dark' ? '#90caf9' : '#1565c0' }]}>
            Read Article →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Categories Filter */}
      {categories.length > 1 && (
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill, 
                  { 
                    backgroundColor: selectedCategory === cat 
                      ? (theme === 'dark' ? '#90caf9' : '#1565c0') 
                      : colors.card,
                    borderColor: theme === 'dark' ? '#333' : '#ddd'
                  }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={{ 
                  color: selectedCategory === cat 
                    ? (theme === 'dark' ? '#000' : '#fff') 
                    : colors.text,
                  fontWeight: '600'
                }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {error ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <AlertCircle color="#ef4444" size={48} style={{ marginBottom: 16 }} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={item => item.id}
          renderItem={renderArticle}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No articles found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoriesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContainer: {
    padding: 16,
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
    height: 180,
    backgroundColor: '#e1e4e8',
  },
  cardContent: {
    padding: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 28,
  },
  date: {
    fontSize: 14,
    marginBottom: 12,
  },
  readMore: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
});
