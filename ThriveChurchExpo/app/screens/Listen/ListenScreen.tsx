import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../services/api/client';
import { useTheme } from '../../hooks/useTheme';
import OfflineBanner from '../../components/OfflineBanner';
import { SermonSeriesSummary, SermonsSummaryPagedResponse } from '../../types/api';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

const CARD_ASPECT = 9 / 16; // 16:9
const PRELOAD_THRESHOLD = 0.8; // Load next page when 80% scrolled
const HORIZONTAL_PADDING = 16;
const CARD_GAP = 16;

interface ListenScreenProps {
  onSeriesPress: (seriesId: string, artUrl: string) => void;
}

// Helper function to chunk array into rows
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Memoized row component to prevent unnecessary re-renders
interface SeriesRowProps {
  row: SermonSeriesSummary[];
  cardWidth: number;
  cardHeight: number;
  onSeriesPress: (seriesId: string, artUrl: string) => void;
  placeholderColor: string;
}

const SeriesRow = React.memo<SeriesRowProps>(({ row, cardWidth, cardHeight, onSeriesPress, placeholderColor }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: CARD_GAP,
        marginBottom: CARD_GAP,
      }}
    >
      {row.map((series) => (
        <View
          key={series.Id}
          style={{
            width: cardWidth,
            height: cardHeight,
          }}
        >
          <TouchableOpacity
            onPress={() => onSeriesPress(series.Id, series.ArtUrl)}
            style={{
              flex: 1,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: placeholderColor, // ← ONLY COLOR CHANGED
            }}
          >
            <FastImage
              source={{ uri: series.ArtUrl, priority: FastImage.priority.normal }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
});

export default function ListenScreen({ onSeriesPress }: ListenScreenProps) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const isTablet = Math.min(width, height) >= 768;
  const isLandscape = width > height;

  // Cache for maintaining stable row references
  const rowCacheRef = useRef<Map<string, SermonSeriesSummary[]>>(new Map());
  const lastColumnsRef = useRef<number>(0);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('ListenScreen', 'Listen');
  }, []);

  // Determine number of columns based on device and orientation
  const columns = useMemo(() => {
    if (!isTablet) return 1; // Mobile: always 1 column
    if (isLandscape) return 3; // Tablet landscape: 3 columns
    return 2; // Tablet portrait: 2 columns
  }, [isTablet, isLandscape]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['sermons'],
    queryFn: async ({ pageParam = 1 }): Promise<SermonsSummaryPagedResponse> => {
      const res = await api.get('api/sermons/paged', { params: { PageNumber: pageParam } });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      return currentPage < lastPage.PagingInfo.TotalPageCount ? currentPage + 1 : undefined;
    },
  });

  const allSeries = data?.pages.flatMap(page => page.Summaries) ?? [];

  // Group series into rows based on column count with stable references
  const rows = useMemo(() => {
    // If columns changed (rotation), clear the cache since rows will be different
    if (lastColumnsRef.current !== columns) {
      rowCacheRef.current.clear();
      lastColumnsRef.current = columns;
    }

    const chunked = chunkArray(allSeries, columns);
    const stableRows: SermonSeriesSummary[][] = [];

    // For each row, check if we already have this exact row cached
    for (const row of chunked) {
      const rowKey = row.map(s => s.Id).join('-');

      if (rowCacheRef.current.has(rowKey)) {
        // Reuse the existing array reference - this prevents React.memo from re-rendering
        stableRows.push(rowCacheRef.current.get(rowKey)!);
      } else {
        // New row, cache it for future use
        rowCacheRef.current.set(rowKey, row);
        stableRows.push(row);
      }
    }

    return stableRows;
  }, [allSeries, columns]);

  // Calculate card dimensions as separate primitive values to avoid object reference changes
  const cardWidth = useMemo(() => {
    const totalGaps = (columns - 1) * CARD_GAP;
    const availableWidth = width - (HORIZONTAL_PADDING * 2) - totalGaps;
    return availableWidth / columns;
  }, [width, columns]);

  const cardHeight = useMemo(() => {
    return cardWidth * CARD_ASPECT;
  }, [cardWidth]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onEndReached = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  // Simplified renderRow that uses the memoized SeriesRow component
  const renderRow = useCallback(({ item: row }: { item: SermonSeriesSummary[] }) => {
    return (
      <SeriesRow
        row={row}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        onSeriesPress={onSeriesPress}
        placeholderColor={theme.colors.border}
      />
    );
  }, [cardWidth, cardHeight, onSeriesPress, theme.colors.border]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, theme.colors.primary]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <OfflineBanner />
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <OfflineBanner />
        <Text style={[theme.typography.h2 as any, { textAlign: 'center', marginBottom: 16 }]}>
          An error occurred while loading content
        </Text>
        <Text style={[theme.typography.body as any, { textAlign: 'center', color: theme.colors.textTertiary }]}>
          Check your internet connection and try again
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <OfflineBanner />
      <FlashList
        key={`flashlist-${columns}`}
        data={rows}
        renderItem={renderRow}
        estimatedItemSize={cardHeight + CARD_GAP}
        drawDistance={800}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8, paddingBottom: 8 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={1 - PRELOAD_THRESHOLD}
        ListFooterComponent={renderFooter}
        keyExtractor={(item) => item.map(series => series.Id).join('-')}
        getItemType={(item) => `row-${item.length}`}
        overrideItemLayout={(layout) => {
          layout.size = cardHeight + CARD_GAP;
        }}
        removeClippedSubviews={false}
      />
    </View>
  );
}

