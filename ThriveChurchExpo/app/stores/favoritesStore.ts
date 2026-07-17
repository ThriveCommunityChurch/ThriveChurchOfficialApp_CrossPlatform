/**
 * Favorites Store
 * Zustand store for managing favorited sermon messages
 * Supports persistence to AsyncStorage (mirrors downloadQueueStore's persist setup)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SermonMessage } from '../types/api';

// Optional metadata that can be supplied alongside a message when favoriting.
// Falls back to fields already present on the message itself when omitted.
export interface FavoriteMeta {
  seriesTitle?: string;
  seriesArt?: string;
}

// A single favorited sermon
export interface FavoriteItem {
  messageId: string;         // Sermon message ID (stable key)
  message: SermonMessage;    // Full message object for rendering/navigation
  seriesTitle?: string;      // Series name (denormalized for list rendering)
  seriesArt?: string;        // Series thumbnail URL (denormalized for list rendering)
  favoritedAt: number;       // Timestamp when favorited
}

interface FavoritesState {
  // Data
  items: FavoriteItem[];

  // Queries
  isFavorite: (messageId: string) => boolean;

  // Actions
  addFavorite: (message: SermonMessage, meta?: FavoriteMeta) => void;
  removeFavorite: (messageId: string) => void;
  toggleFavorite: (message: SermonMessage, meta?: FavoriteMeta) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      // Check if a message is favorited
      isFavorite: (messageId) => {
        return get().items.some((item) => item.messageId === messageId);
      },

      // Add a message to favorites (no-op if already favorited)
      addFavorite: (message, meta) => {
        const messageId = message.MessageId;
        const exists = get().items.some((item) => item.messageId === messageId);
        if (exists) return;

        const newItem: FavoriteItem = {
          messageId,
          message,
          seriesTitle: meta?.seriesTitle ?? message.seriesTitle,
          seriesArt: meta?.seriesArt ?? message.seriesArt,
          favoritedAt: Date.now(),
        };

        set((state) => ({
          items: [newItem, ...state.items],
        }));
      },

      // Remove a message from favorites
      removeFavorite: (messageId) => {
        set((state) => ({
          items: state.items.filter((item) => item.messageId !== messageId),
        }));
      },

      // Toggle favorite state for a message
      toggleFavorite: (message, meta) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(message.MessageId)) {
          removeFavorite(message.MessageId);
        } else {
          addFavorite(message, meta);
        }
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist everything - favorites are all data, no transient UI state
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

// Selector functions for convenience (stable, selector-friendly)
export const selectFavoriteItems = (state: FavoritesState) => state.items;

export const selectFavoriteCount = (state: FavoritesState) => state.items.length;

export const selectFavoriteIds = (state: FavoritesState) =>
  new Set(state.items.map((item) => item.messageId));

export const selectIsFavorite = (messageId: string) => (state: FavoritesState) =>
  state.items.some((item) => item.messageId === messageId);
