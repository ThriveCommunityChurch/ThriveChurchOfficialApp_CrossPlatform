/**
 * SearchScreen Component
 * Main search screen for finding sermon series and messages by tags
 */

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';
import { SearchTarget, SortDirection, SermonSeries, SermonMessage } from '../../types/api';
import { searchContent } from '../../services/api/sermonSearchService';
import { SearchTypeToggle } from '../../components/Search/SearchTypeToggle';
import { TagSelector } from '../../components/Search/TagSelector';
import { SearchResultsList } from '../../components/Search/SearchResultsList';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

type NavigationProp = NativeStackNavigationProp<any>;

export const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();

  // State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTarget, setSearchTarget] = useState<SearchTarget>(SearchTarget.Series);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Descending);
  const [debouncedTags, setDebouncedTags] = useState<string[]>([]);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if device is tablet in landscape
  const isTabletLandscape = width >= 1024;

  // Handle sort direction toggle
  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection((prev) =>
      prev === SortDirection.Descending ? SortDirection.Ascending : SortDirection.Descending
    );
  }, []);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('SearchScreen', 'Search');
  }, []);

  // Set navigation header button
  useLayoutEffect(() => {
    const isDescending = sortDirection === SortDirection.Descending;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSortDirectionToggle}
          style={{ marginRight: 16 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isDescending ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, sortDirection, handleSortDirectionToggle, theme.colors.text]);

  // Debounce selected tags changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedTags(selectedTags);
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedTags]);

  // React Query for search results
  const { data: results, isLoading } = useQuery({
    queryKey: ['search', searchTarget, sortDirection, debouncedTags.sort().join(',')],
    queryFn: async () => {
      if (debouncedTags.length === 0) return [];

      console.log('[SearchScreen] Fetching results:', {
        searchTarget,
        sortDirection,
        tagCount: debouncedTags.length,
      });

      // Use the new searchContent function that supports both Series and Message search
      const data = await searchContent(searchTarget, debouncedTags, sortDirection);

      console.log('[SearchScreen] Results received:', {
        count: data.length,
        sortDirection,
      });

      return data;
    },
    enabled: debouncedTags.length > 0,
    staleTime: 0, // Don't use stale data - always fetch fresh when sort changes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Handle tag toggle
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);

  // Handle clear all tags
  const handleClearAll = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // Handle search target change
  const handleSearchTargetChange = useCallback((target: SearchTarget) => {
    setSearchTarget(target);
  }, []);

  // Handle result press
  const handleResultPress = useCallback(
    (result: SermonSeries | SermonMessage) => {
      if (searchTarget === SearchTarget.Series) {
        const series = result as SermonSeries;
        navigation.navigate('SeriesDetail', {
          seriesId: series.Id,
          seriesArtUrl: series.ArtUrl,
        });
      } else {
        const message = result as SermonMessage;
        navigation.navigate('SermonDetail', {
          message,
          seriesTitle: message.seriesTitle || 'Sermon',
          seriesArtUrl: message.seriesArt || '',
          seriesId: '', // TODO: Add seriesId to message if available
        });
      }
    },
    [navigation, searchTarget]
  );

  // Render empty state when no tags selected
  const renderNoTagsState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons
        name="search-outline"
        size={64}
        color={theme.colors.textTertiary}
      />
      <Text style={styles.emptyStateText}>Select tags to search for content</Text>
      <Text style={styles.emptyStateSubtext}>
        Choose one or more topics to find related messages and series
      </Text>
    </View>
  );

  // Render tablet landscape layout (split view)
  if (isTabletLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.tabletContainer}>
          {/* Left Side - Tags */}
          <View style={styles.tabletLeftPanel}>
            <SearchTypeToggle
              value={searchTarget}
              onChange={handleSearchTargetChange}
            />
            <View style={styles.tabletTagSelectorContainer}>
              <TagSelector
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onClearAll={handleClearAll}
              />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.tabletDivider} />

          {/* Right Side - Results */}
          <View style={styles.tabletRightPanel}>
            {debouncedTags.length === 0 ? (
              renderNoTagsState()
            ) : (
              <SearchResultsList
                key={`results-${searchTarget}-${sortDirection}`}
                results={results || []}
                searchTarget={searchTarget}
                isLoading={isLoading}
                onResultPress={handleResultPress}
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  // Render mobile/tablet portrait layout (vertical scroll)
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <SearchTypeToggle
          value={searchTarget}
          onChange={handleSearchTargetChange}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Topics</Text>
        <TagSelector
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearAll={handleClearAll}
        />
      </View>

      {debouncedTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultsContainer}>
            <SearchResultsList
              key={`results-${searchTarget}-${sortDirection}`}
              results={results || []}
              searchTarget={searchTarget}
              isLoading={isLoading}
              onResultPress={handleResultPress}
            />
          </View>
        </View>
      )}

      {debouncedTags.length === 0 && renderNoTagsState()}
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    resultsContainer: {
      minHeight: 300,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyStateText: {
      fontSize: 20,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textTertiary,
      marginTop: 8,
      textAlign: 'center',
    },
    // Tablet landscape styles
    tabletContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    tabletLeftPanel: {
      width: '40%',
      padding: 16,
    },
    tabletTagSelectorContainer: {
      flex: 1,
      marginTop: 16,
    },
    tabletDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
    },
    tabletRightPanel: {
      flex: 1,
      width: '60%',
    },
  });

