/**
 * SpeakerSelector Component
 * Searchable modal-based speaker selection interface
 * Shows selected speaker as a removable chip with "Select Speaker" button to open modal
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { getSpeakers } from '../../services/api/sermonSearchService';

interface SpeakerSelectorProps {
  selectedSpeaker: string | null;
  onSpeakerSelect: (speaker: string) => void;
  onClearSpeaker: () => void;
}

export const SpeakerSelector: React.FC<SpeakerSelectorProps> = ({
  selectedSpeaker,
  onSpeakerSelect,
  onClearSpeaker,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  // Track when list container has been laid out (FlashList needs explicit dimensions)
  const [listLayoutReady, setListLayoutReady] = useState(false);

  // Fetch speakers list using React Query
  const { data: speakers = [], isLoading, isError } = useQuery({
    queryKey: ['speakers'],
    queryFn: getSpeakers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  // Filter speakers based on search text
  const filteredSpeakers = useMemo(() => {
    if (!searchText.trim()) return speakers;
    
    const searchLower = searchText.toLowerCase();
    return speakers.filter((speaker) => 
      speaker.toLowerCase().includes(searchLower)
    );
  }, [speakers, searchText]);

  // Sort speakers alphabetically
  const sortedSpeakers = useMemo(() => {
    return [...filteredSpeakers].sort((a, b) => a.localeCompare(b));
  }, [filteredSpeakers]);

  const handleOpenModal = () => {
    setListLayoutReady(false); // Reset layout state when opening
    setModalVisible(true);
    setSearchText('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSearchText('');
  };

  // Handle list container layout - FlashList needs explicit dimensions to render correctly
  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    // Only mark as ready when we have a meaningful height
    if (height > 0) {
      setListLayoutReady(true);
    }
  }, []);

  const handleSpeakerPress = (speaker: string) => {
    onSpeakerSelect(speaker);
    handleCloseModal(); // Close modal after selection (single-select behavior)
  };

  const renderSpeakerItem = ({ item }: { item: string }) => {
    const isSelected = selectedSpeaker === item;

    return (
      <TouchableOpacity
        style={[styles.modalSpeakerItem, isSelected && styles.modalSpeakerItemSelected]}
        onPress={() => handleSpeakerPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.modalSpeakerContent}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'person-circle-outline'}
            size={24}
            color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.modalSpeakerIcon}
          />
          <Text style={[styles.modalSpeakerText, isSelected && styles.modalSpeakerTextSelected]}>
            {item}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected Speaker */}
      {selectedSpeaker && (
        <View style={styles.selectedSpeakerContainer}>
          <View style={styles.selectedSpeakerChip}>
            <Ionicons name="person" size={16} color="#FFFFFF" style={styles.speakerChipIcon} />
            <Text style={styles.selectedSpeakerChipText} numberOfLines={1}>
              {selectedSpeaker}
            </Text>
            <TouchableOpacity
              onPress={onClearSpeaker}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select Speaker Button */}
      <TouchableOpacity style={styles.selectSpeakerButton} onPress={handleOpenModal} activeOpacity={0.7}>
        <Ionicons name="person-add-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.selectSpeakerButtonText}>
          {selectedSpeaker ? t('components.speakerSelector.changeSpeaker') : t('components.speakerSelector.selectSpeaker')}
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('components.speakerSelector.modalTitle')}</Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.modalSearchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.modalSearchIcon}
            />
            <TextInput
              style={styles.modalSearchInput}
              placeholder={t('components.speakerSelector.searchPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.modalSearchClear}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Speakers List */}
          <View style={styles.modalListContainer} onLayout={handleListLayout}>
            {isLoading ? (
              // Loading State
              <View style={styles.modalLoadingState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.modalLoadingText}>{t('components.speakerSelector.loading')}</Text>
              </View>
            ) : isError ? (
              // Error State
              <View style={styles.modalErrorState}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                <Text style={styles.modalErrorText}>{t('components.speakerSelector.loadFailed')}</Text>
                <Text style={styles.modalErrorSubtext}>{t('components.speakerSelector.tryAgainLater')}</Text>
              </View>
            ) : listLayoutReady ? (
              // Speakers List - only render after layout is ready
              <FlashList
                data={sortedSpeakers}
                renderItem={renderSpeakerItem}
                keyExtractor={(item) => item}
                estimatedItemSize={56}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalListContent}
                ListEmptyComponent={
                  <View style={styles.modalEmptyState}>
                    <Ionicons name="search-outline" size={48} color={theme.colors.textTertiary} />
                    <Text style={styles.modalEmptyText}>
                      {searchText ? t('components.speakerSelector.noSpeakersFound') : t('components.speakerSelector.noSpeakersAvailable')}
                    </Text>
                    <Text style={styles.modalEmptySubtext}>
                      {searchText ? t('components.speakerSelector.tryDifferentSearch') : t('components.speakerSelector.checkBackLater')}
                    </Text>
                  </View>
                }
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      // Removed flex: 1 to prevent layout issues
    },
    // Selected Speaker Section
    selectedSpeakerContainer: {
      marginBottom: 16,
    },
    selectedSpeakerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingLeft: 14,
      paddingRight: 10,
      borderRadius: 20,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    speakerChipIcon: {
      marginRight: 6,
    },
    selectedSpeakerChipText: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: '#FFFFFF',
      marginRight: 6,
      flex: 1,
    },
    // Select Speaker Button
    selectSpeakerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    selectSpeakerButtonText: {
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
      marginLeft: 8,
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalSearchIcon: {
      marginRight: 8,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.text,
    },
    modalSearchClear: {
      padding: 4,
    },
    modalListContainer: {
      flex: 1,
      minHeight: 0, // Allows flex container to shrink properly
    },
    modalListContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    modalSpeakerItem: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalSpeakerItemSelected: {
      backgroundColor: theme.colors.backgroundSecondary,
    },
    modalSpeakerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalSpeakerIcon: {
      marginRight: 12,
    },
    modalSpeakerText: {
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.text,
      flex: 1,
    },
    modalSpeakerTextSelected: {
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
    },
    // Loading State
    modalLoadingState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    modalLoadingText: {
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    // Error State
    modalErrorState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    modalErrorText: {
      fontSize: 18,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.error,
      marginTop: 16,
    },
    modalErrorSubtext: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textTertiary,
      marginTop: 8,
    },
    // Empty State
    modalEmptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    modalEmptyText: {
      fontSize: 18,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    modalEmptySubtext: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textTertiary,
      marginTop: 8,
    },
  });

