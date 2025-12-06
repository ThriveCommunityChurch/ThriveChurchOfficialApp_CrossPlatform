/**
 * TagSelector Component
 * Searchable modal-based tag selection interface
 * Shows selected tags as removable chips with "Add Tags" button to open modal
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { MessageTag, getTagDisplayLabel } from '../../types/messageTag';

interface TagSelectorProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagToggle,
  onClearAll,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Get all tag names from MessageTag enum (excluding Unknown)
  const allTags = useMemo(() => {
    return Object.keys(MessageTag)
      .filter((key) => isNaN(Number(key)) && key !== 'Unknown')
      .sort();
  }, []);

  // Filter tags based on search text
  const filteredTags = useMemo(() => {
    if (!searchText.trim()) return allTags;
    
    const searchLower = searchText.toLowerCase();
    return allTags.filter((tag) => {
      const displayLabel = getTagDisplayLabel(tag).toLowerCase();
      return displayLabel.includes(searchLower);
    });
  }, [allTags, searchText]);

  const handleOpenModal = () => {
    setModalVisible(true);
    setSearchText('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSearchText('');
  };

  const handleTagPress = (tag: string) => {
    onTagToggle(tag);
    // Don't close modal - allow multiple selections
  };

  const handleRemoveTag = (tag: string) => {
    onTagToggle(tag);
  };

  const renderTagItem = ({ item }: { item: string }) => {
    const isSelected = selectedTags.includes(item);
    const displayLabel = getTagDisplayLabel(item);

    return (
      <TouchableOpacity
        style={[styles.modalTagItem, isSelected && styles.modalTagItemSelected]}
        onPress={() => handleTagPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.modalTagContent}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.modalTagIcon}
          />
          <Text style={[styles.modalTagText, isSelected && styles.modalTagTextSelected]}>
            {displayLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <View style={styles.selectedTagsHeader}>
            <Text style={styles.selectedTagsCount}>
              {selectedTags.length} {selectedTags.length === 1 ? t('components.tagSelector.tag') : t('components.tagSelector.tags')} {t('components.tagSelector.selected')}
            </Text>
            <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>{t('components.tagSelector.clearAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedTagsScroll}
          >
            {selectedTags.map((tag) => (
              <View key={tag} style={styles.selectedTagChip}>
                <Text style={styles.selectedTagChipText} numberOfLines={1}>
                  {getTagDisplayLabel(tag)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTag(tag)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Add Tags Button */}
      <TouchableOpacity style={styles.addTagsButton} onPress={handleOpenModal} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.addTagsButtonText}>
          {selectedTags.length === 0 ? t('components.tagSelector.selectTags') : t('components.tagSelector.addMoreTags')}
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
            <Text style={styles.modalTitle}>{t('components.tagSelector.modalTitle')}</Text>
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
              placeholder={t('components.tagSelector.searchPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.modalSearchClear}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Count */}
          {selectedTags.length > 0 && (
            <View style={styles.modalSelectedCount}>
              <Text style={styles.modalSelectedCountText}>
                {selectedTags.length} {selectedTags.length === 1 ? t('components.tagSelector.tag') : t('components.tagSelector.tags')} {t('components.tagSelector.selected')}
              </Text>
            </View>
          )}

          {/* Tags List */}
          <View style={styles.modalListContainer}>
            <FlashList
              data={filteredTags}
              renderItem={renderTagItem}
              keyExtractor={(item) => item}
              estimatedItemSize={56}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalListContent}
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.textTertiary} />
                  <Text style={styles.modalEmptyText}>{t('components.tagSelector.noTagsFound')}</Text>
                  <Text style={styles.modalEmptySubtext}>{t('components.tagSelector.tryDifferentSearch')}</Text>
                </View>
              }
            />
          </View>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={handleCloseModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneButtonText}>{t('components.tagSelector.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    // Selected Tags Section
    selectedTagsContainer: {
      marginBottom: 16,
    },
    selectedTagsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    selectedTagsCount: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
    },
    clearAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    clearAllText: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
    },
    selectedTagsScroll: {
      paddingVertical: 4,
    },
    selectedTagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 8,
      paddingLeft: 14,
      paddingRight: 10,
      borderRadius: 20,
      marginRight: 8,
      maxWidth: 200,
    },
    selectedTagChipText: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: '#FFFFFF',
      marginRight: 6,
    },
    // Add Tags Button
    addTagsButton: {
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
    addTagsButtonText: {
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
    modalSelectedCount: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    modalSelectedCountText: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
    },
    modalListContainer: {
      flex: 1,
    },
    modalListContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    modalTagItem: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTagItemSelected: {
      backgroundColor: theme.colors.backgroundSecondary,
    },
    modalTagContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalTagIcon: {
      marginRight: 12,
    },
    modalTagText: {
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.text,
      flex: 1,
    },
    modalTagTextSelected: {
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
    },
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
    modalFooter: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    modalDoneButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalDoneButtonText: {
      fontSize: 17,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: '#FFFFFF',
    },
  });

