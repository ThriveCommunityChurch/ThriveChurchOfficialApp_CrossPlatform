import React, { useCallback, useMemo } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../services/api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import OfflineBanner from '../../components/OfflineBanner';
import { SermonSeriesSummary, SermonsSummaryPagedResponse } from '../../types/api';

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

export default function ListenScreen({ onSeriesPress }: ListenScreenProps) {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;
  const isLandscape = width > height;

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

  // Group series into rows based on column count
  const rows = useMemo(() => chunkArray(allSeries, columns), [allSeries, columns]);

  // Calculate card dimensions
  const cardDimensions = useMemo(() => {
    const totalGaps = (columns - 1) * CARD_GAP;
    const availableWidth = width - (HORIZONTAL_PADDING * 2) - totalGaps;
    const cardWidth = availableWidth / columns;
    const cardHeight = cardWidth * CARD_ASPECT;
    return { cardWidth, cardHeight };
  }, [width, columns]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onEndReached = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  const renderRow = useCallback(({ item: row }: { item: SermonSeriesSummary[] }) => {
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
          <TouchableOpacity
            key={series.Id}
            style={{
              width: cardDimensions.cardWidth,
              height: cardDimensions.cardHeight,
              backgroundColor: 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={() => onSeriesPress(series.Id, series.ArtUrl)}
            activeOpacity={0.8}
          >
            <FastImage
              source={{ uri: series.ArtUrl }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.darkGrey,
                borderRadius: 12,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [cardDimensions, onSeriesPress]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }, [isFetchingNextPage]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.almostBlack, alignItems: 'center', justifyContent: 'center' }}>
        <OfflineBanner />
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.almostBlack, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <OfflineBanner />
        <Text style={[typography.h2, { textAlign: 'center', marginBottom: 16 }]}>
          An error occurred while loading content
        </Text>
        <Text style={[typography.body, { textAlign: 'center', color: colors.lessLightLightGray }]}>
          Check your internet connection and try again
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.almostBlack }}>
      <OfflineBanner />
      <FlashList
        data={rows}
        renderItem={renderRow}
        estimatedItemSize={cardDimensions.cardHeight + CARD_GAP}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8, paddingBottom: 8 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={1 - PRELOAD_THRESHOLD}
        ListFooterComponent={renderFooter}
        keyExtractor={(_item, index) => `row-${index}`}
      />
    </View>
  );
}

