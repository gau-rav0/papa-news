import React from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme as useNavTheme } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useSettings, FontSize } from '../contexts/SettingsContext';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useSettings();
  const { colors } = useNavTheme();

  const isDarkMode = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        
        <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#333' : '#eee' }]}>
          <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#1565c0' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Text Size</Text>
        <View style={styles.radioGroup}>
          {(['small', 'medium', 'large'] as FontSize[]).map(size => (
            <TouchableOpacity 
              key={size} 
              style={[
                styles.radioOption, 
                { 
                  backgroundColor: colors.card,
                  borderColor: fontSize === size 
                    ? (isDarkMode ? '#90caf9' : '#1565c0')
                    : (isDarkMode ? '#333' : '#eee')
                }
              ]}
              onPress={() => setFontSize(size)}
            >
              <Text style={{ 
                color: colors.text, 
                fontSize: 16,
                fontWeight: fontSize === size ? 'bold' : 'normal'
              }}>
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Text>
              {fontSize === size && (
                <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#90caf9' : '#1565c0' }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 18,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
