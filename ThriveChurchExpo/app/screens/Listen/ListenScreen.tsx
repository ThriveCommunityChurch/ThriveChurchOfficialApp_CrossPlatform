import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, Dimensions, TouchableOpacity, Text } from 'react-native';
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

interface ListenScreenProps {
  onSeriesPress: (seriesId: string, artUrl: string) => void;
}

export default function ListenScreen({ onSeriesPress }: ListenScreenProps) {
  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) >= 768;
  const isLandscape = width > height;
  const columns = isTablet ? (isLandscape && width > 1200 ? 3 : 2) : 1;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onEndReached = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  const renderSeriesCard = useCallback(({ item }: { item: SermonSeriesSummary }) => {
    const totalInterItem = (columns - 1) * 16;
    const avail = width - 16 - 16 - totalInterItem;
    const cardWidth = Math.min(avail / columns, 600);
    const cardHeight = cardWidth * CARD_ASPECT;

    return (
      <TouchableOpacity
        style={{
          width: cardWidth,
          height: cardHeight,
          marginRight: columns > 1 ? 16 : 0,
          backgroundColor: 'transparent',
          // Add shadow for iOS parity
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8, // Android shadow
        }}
        onPress={() => onSeriesPress(item.Id, item.ArtUrl)}
        activeOpacity={0.8}
      >
        <FastImage
          source={{ uri: item.ArtUrl }}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.darkGrey,
            borderRadius: 12,
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
      </TouchableOpacity>
    );
  }, [columns, width, onSeriesPress]);

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
        data={allSeries}
        numColumns={columns}
        key={columns}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={renderSeriesCard}
        onEndReached={onEndReached}
        onEndReachedThreshold={1 - PRELOAD_THRESHOLD} // Trigger at 80% scroll
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

