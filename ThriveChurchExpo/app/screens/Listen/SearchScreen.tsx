/**
 * SearchScreen Component
 * Main search screen for finding sermon series, messages by tags, and messages by speaker
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
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SearchTarget, SortDirection, SermonSeries, SermonMessage } from '../../types/api';
import { searchContent } from '../../services/api/sermonSearchService';
import { SearchTypeToggle } from '../../components/Search/SearchTypeToggle';
import { TagSelector } from '../../components/Search/TagSelector';
import { SpeakerSelector } from '../../components/Search/SpeakerSelector';
import { SearchResultsList } from '../../components/Search/SearchResultsList';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

type NavigationProp = NativeStackNavigationProp<any>;

export const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();

  // Network status for offline detection
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  // State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
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
  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'search',
      searchTarget,
      sortDirection,
      searchTarget === SearchTarget.Speaker ? selectedSpeaker : debouncedTags.sort().join(','),
    ],
    queryFn: async () => {
      // Handle Speaker search
      if (searchTarget === SearchTarget.Speaker) {
        if (!selectedSpeaker) return [];

        console.log('[SearchScreen] Fetching speaker results:', {
          searchTarget,
          sortDirection,
          speaker: selectedSpeaker,
        });

        const data = await searchContent(searchTarget, [], sortDirection, selectedSpeaker);

        console.log('[SearchScreen] Speaker results received:', {
          count: data.length,
          sortDirection,
        });

        return data;
      }

      // Handle Series/Messages search
      if (debouncedTags.length === 0) return [];

      console.log('[SearchScreen] Fetching tag results:', {
        searchTarget,
        sortDirection,
        tagCount: debouncedTags.length,
      });

      const data = await searchContent(searchTarget, debouncedTags, sortDirection);

      console.log('[SearchScreen] Tag results received:', {
        count: data.length,
        sortDirection,
      });

      return data;
    },
    enabled:
      searchTarget === SearchTarget.Speaker
        ? selectedSpeaker !== null
        : debouncedTags.length > 0,
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

  // Handle speaker selection
  const handleSpeakerSelect = useCallback((speaker: string) => {
    setSelectedSpeaker(speaker);
  }, []);

  // Handle clear speaker
  const handleClearSpeaker = useCallback(() => {
    setSelectedSpeaker(null);
  }, []);

  // Handle search target change
  const handleSearchTargetChange = useCallback((target: SearchTarget) => {
    setSearchTarget(target);

    // Clear opposite selection type when switching tabs (mutually exclusive)
    if (target === SearchTarget.Speaker) {
      // Switching TO Speaker tab: clear tags
      setSelectedTags([]);
    } else {
      // Switching TO Series/Messages tab: clear speaker
      setSelectedSpeaker(null);
    }
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
          seriesId: message.SeriesId || '',
        });
      }
    },
    [navigation, searchTarget]
  );

  // Render empty state when no selection made
  const renderNoTagsState = () => {
    const isSpeakerTab = searchTarget === SearchTarget.Speaker;

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons
          name={isSpeakerTab ? 'person-outline' : 'search-outline'}
          size={64}
          color={theme.colors.textTertiary}
        />
        <Text style={styles.emptyStateText}>
          {isSpeakerTab
            ? t('listen.search.emptySpeaker')
            : t('listen.search.emptyTags')}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {isSpeakerTab
            ? t('listen.search.emptySpeakerSubtext')
            : t('listen.search.emptyTagsSubtext')}
        </Text>
      </View>
    );
  };

  // Render tablet landscape layout (split view)
  if (isTabletLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.tabletContainer}>
          {/* Left Side - Selection */}
          <View style={styles.tabletLeftPanel}>
            <SearchTypeToggle
              value={searchTarget}
              onChange={handleSearchTargetChange}
            />
            <View style={styles.tabletTagSelectorContainer}>
              {searchTarget === SearchTarget.Speaker ? (
                <SpeakerSelector
                  selectedSpeaker={selectedSpeaker}
                  onSpeakerSelect={handleSpeakerSelect}
                  onClearSpeaker={handleClearSpeaker}
                />
              ) : (
                <TagSelector
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onClearAll={handleClearAll}
                />
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.tabletDivider} />

          {/* Right Side - Results */}
          <View style={styles.tabletRightPanel}>
            {((searchTarget === SearchTarget.Speaker && !selectedSpeaker) ||
              (searchTarget !== SearchTarget.Speaker && debouncedTags.length === 0)) ? (
              renderNoTagsState()
            ) : (
              <SearchResultsList
                results={results || []}
                searchTarget={searchTarget}
                isLoading={isLoading}
                isError={isError}
                isOffline={isOffline}
                onResultPress={handleResultPress}
                onRetry={() => refetch()}
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
        <Text style={styles.sectionTitle}>
          {searchTarget === SearchTarget.Speaker ? t('listen.search.selectSpeaker') : t('listen.search.selectTopics')}
        </Text>
        {searchTarget === SearchTarget.Speaker ? (
          <SpeakerSelector
            selectedSpeaker={selectedSpeaker}
            onSpeakerSelect={handleSpeakerSelect}
            onClearSpeaker={handleClearSpeaker}
          />
        ) : (
          <TagSelector
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearAll={handleClearAll}
          />
        )}
      </View>

      {((searchTarget === SearchTarget.Speaker && selectedSpeaker) ||
        (searchTarget !== SearchTarget.Speaker && debouncedTags.length > 0)) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('listen.search.results')}</Text>
          <View style={styles.resultsContainer}>
            <SearchResultsList
              results={results || []}
              searchTarget={searchTarget}
              isLoading={isLoading}
              isError={isError}
              isOffline={isOffline}
              onResultPress={handleResultPress}
              onRetry={() => refetch()}
            />
          </View>
        </View>
      )}

      {((searchTarget === SearchTarget.Speaker && !selectedSpeaker) ||
        (searchTarget !== SearchTarget.Speaker && debouncedTags.length === 0)) &&
        renderNoTagsState()}
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

