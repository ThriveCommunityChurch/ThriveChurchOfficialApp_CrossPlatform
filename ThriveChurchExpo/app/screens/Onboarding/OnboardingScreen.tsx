import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { setOnboardingCompleted } from '../../services/storage/storage';
import { logTutorialBegin, logTutorialComplete } from '../../services/analytics/analyticsService';

// Responsive breakpoints: use logical width for device-independent pixels
const SMALL_SCREEN_BREAKPOINT = 414; // iPhone Plus/XR/11 and below use icon design
const XL_TABLET_BREAKPOINT = 768; // Large tablets (13" iPad) use icon design with larger sizing

interface OnboardingPage {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  headerText: string;
  bodyText: string;
  bodyTextExtended?: string; // Additional text for XL tablets
}

// Function to get pages with translations
const getPages = (t: (key: string) => string): OnboardingPage[] => [
  {
    id: '1',
    iconName: 'headset',
    headerText: t('onboarding.page1Header'),
    bodyText: t('onboarding.page1Body'),
    bodyTextExtended: t('onboarding.page1BodyExtended'),
  },
  {
    id: '2',
    iconName: 'book',
    headerText: t('onboarding.page2Header'),
    bodyText: t('onboarding.page2Body'),
    bodyTextExtended: t('onboarding.page2BodyExtended'),
  },
  {
    id: '3',
    iconName: 'people',
    headerText: t('onboarding.page3Header'),
    bodyText: t('onboarding.page3Body'),
    bodyTextExtended: t('onboarding.page3BodyExtended'),
  },
  {
    id: '4',
    iconName: 'search',
    headerText: t('onboarding.page4Header'),
    bodyText: t('onboarding.page4Body'),
    bodyTextExtended: t('onboarding.page4BodyExtended'),
  },
  {
    id: '5',
    iconName: 'heart',
    headerText: t('onboarding.page5Header'),
    bodyText: t('onboarding.page5Body'),
    bodyTextExtended: t('onboarding.page5BodyExtended'),
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Component: Animated Icon with Gradient Background (for small screens and XL tablets)
interface AnimatedIconWithGradientProps {
  iconName: keyof typeof Ionicons.glyphMap;
  theme: Theme;
  screenWidth: number;
  isXLTablet?: boolean;
}

const AnimatedIconWithGradient: React.FC<AnimatedIconWithGradientProps> = ({ iconName, theme, screenWidth, isXLTablet = false }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  // Create gradient colors from primary to a lighter version
  const gradientColors: [string, string] = [
    theme.colors.primary,
    theme.colors.primaryLight,
  ];

  // XL tablets get smaller icons - focus is on text content, not visuals
  const iconSize = isXLTablet ? Math.min(screenWidth * 0.08, 80) : screenWidth * 0.25;
  const containerSize = isXLTablet ? Math.min(screenWidth * 0.18, 180) : screenWidth * 0.5;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          // iOS shadow only - Android elevation causes hex outline artifact on LinearGradient
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.shadowDark,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              // No elevation - it doesn't render correctly with borderRadius on LinearGradient
            },
          }),
        }}
      >
        <Ionicons
          name={iconName}
          size={iconSize}
          color={theme.colors.textInverse}
        />
      </LinearGradient>
    </Animated.View>
  );
};

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Get pages with translations
  const pages = getPages(t);

  // Track screen dimensions dynamically
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const isSmallScreen = screenDimensions.width < SMALL_SCREEN_BREAKPOINT;
  const isXLTablet = screenDimensions.width >= XL_TABLET_BREAKPOINT;
  const styles = createStyles(theme, screenDimensions.width, screenDimensions.height, isXLTablet);

  // Track pending scroll after rotation
  const pendingScrollRef = useRef<{ index: number; width: number } | null>(null);

  // Listen for dimension changes (e.g., rotation)
  useEffect(() => {
    // Log initial dimensions for debugging
    console.log('[Onboarding] Screen dimensions:', screenDimensions);
    console.log('[Onboarding] Is small screen?', isSmallScreen);
    console.log('[Onboarding] Is XL tablet?', isXLTablet);
    console.log('[Onboarding] Breakpoints:', { small: SMALL_SCREEN_BREAKPOINT, xl: XL_TABLET_BREAKPOINT });

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log('[Onboarding] Dimensions changed:', window);
      // Store the pending scroll info before state update
      // Use ref to avoid stale closure issues with currentIndex
      pendingScrollRef.current = { index: currentIndex, width: window.width };
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, [currentIndex, isSmallScreen, isXLTablet]);

  // Handle scroll after layout completes following a rotation
  const handleFlatListLayout = useCallback(() => {
    if (pendingScrollRef.current) {
      const { index, width } = pendingScrollRef.current;
      console.log('[Onboarding] FlatList layout complete, scrolling to index:', index, 'with width:', width);

      // Use scrollToOffset for more reliable positioning across platforms
      // This avoids scrollToIndex issues where the item layout might not be ready
      flatListRef.current?.scrollToOffset({
        offset: index * width,
        animated: false,
      });

      pendingScrollRef.current = null;
    }
  }, []);

  // Log tutorial begin on mount
  useEffect(() => {
    logTutorialBegin();
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  }, [currentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, []);

  const handleComplete = useCallback(async () => {
    // Log tutorial complete
    await logTutorialComplete();

    await setOnboardingCompleted(true);
    onComplete();
  }, [onComplete]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Determine if we should use icons (small screens OR XL tablets)
  const useIconDesign = isSmallScreen || isXLTablet;

  const renderPage = useCallback(({ item }: { item: OnboardingPage }) => {
    console.log(`[renderPage] Rendering "${item.headerText}" - isSmallScreen:`, isSmallScreen, 'isXLTablet:', isXLTablet, 'useIconDesign:', useIconDesign);
    return (
      <View style={styles.page}>
        <View style={styles.imageContainer}>
          {useIconDesign ? (
            // Small screens & XL tablets: Animated Icon with Gradient Background
            <AnimatedIconWithGradient
              iconName={item.iconName}
              theme={theme}
              screenWidth={screenDimensions.width}
              isXLTablet={isXLTablet}
            />
          ) : (
            // Medium/large screens (tablets but not XL): Use icon design
            <AnimatedIconWithGradient
              iconName={item.iconName}
              theme={theme}
              screenWidth={screenDimensions.width}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[theme.typography.h1 as any, styles.headerText]}>
            {item.headerText}
          </Text>
          <Text style={[theme.typography.body as any, styles.bodyText]}>
            {item.bodyText}
          </Text>
          {/* Show extended text only on XL tablets */}
          {isXLTablet && item.bodyTextExtended && (
            <Text style={[theme.typography.body as any, styles.bodyTextExtended]}>
              {item.bodyTextExtended}
            </Text>
          )}
        </View>
      </View>
    );
  }, [theme, isSmallScreen, isXLTablet, useIconDesign, screenDimensions.width, styles]);

  const renderDots = useCallback(() => {
    return (
      <View style={styles.dotsContainer}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        onLayout={handleFlatListLayout}
      />

      {renderDots()}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.previousButton}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text
            style={[
              theme.typography.body as any,
              styles.previousButtonText,
              currentIndex === 0 && styles.disabledButtonText,
            ]}
          >
            {currentIndex > 0 ? t('common.prev') : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[theme.typography.caption as any, styles.skipButtonText]}>
            {t('onboarding.skip')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={[theme.typography.body as any, styles.nextButtonText]}>
            {currentIndex === pages.length - 1 ? t('onboarding.done') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, width: number, height: number, isXLTablet: boolean = false) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  page: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingHorizontal: isXLTablet ? 64 : 32,
  },
  imageContainer: {
    // XL tablets: no flex, just natural size centered
    // Small/medium: use flex for layout
    flex: isXLTablet ? undefined : 0.7,
    alignItems: 'center',
    justifyContent: isXLTablet ? 'flex-end' : 'center',
    marginTop: isXLTablet ? 0 : 40,
    marginBottom: isXLTablet ? 24 : 0, // Bring icon closer to text on XL
  },
  imagePlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    // XL tablets: no flex, just natural size centered
    // Small/medium: use flex for layout
    flex: isXLTablet ? undefined : 1.3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: isXLTablet ? 0 : 40,
    maxWidth: isXLTablet ? 650 : undefined,
    overflow: 'visible',
  },
  headerText: {
    textAlign: 'center',
    marginBottom: isXLTablet ? 24 : 16,
    color: theme.colors.text,
    fontSize: isXLTablet ? 28 : undefined, // Larger header on XL tablets
    lineHeight: isXLTablet ? 40 : undefined, // Ensure enough line height to prevent clipping
  },
  bodyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    lineHeight: isXLTablet ? 28 : 24,
    fontSize: isXLTablet ? 17 : undefined,
    paddingHorizontal: isXLTablet ? 20 : 0,
  },
  bodyTextExtended: {
    textAlign: 'center',
    color: theme.colors.textTertiary,
    lineHeight: 26,
    fontSize: 16,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isXLTablet ? 30 : 20,
  },
  dot: {
    width: isXLTablet ? 12 : 10,
    height: isXLTablet ? 12 : 10,
    borderRadius: isXLTablet ? 6 : 5,
    marginHorizontal: isXLTablet ? 8 : 5,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    backgroundColor: theme.colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isXLTablet ? 64 : 32,
    paddingBottom: isXLTablet ? 60 : 40,
  },
  previousButton: {
    minWidth: isXLTablet ? 80 : 60,
  },
  previousButtonText: {
    color: theme.colors.textSecondary,
    fontSize: isXLTablet ? 18 : undefined,
  },
  disabledButtonText: {
    opacity: 0,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: theme.colors.textTertiary,
    fontSize: isXLTablet ? 16 : undefined,
  },
  nextButton: {
    minWidth: isXLTablet ? 80 : 60,
    alignItems: 'flex-end',
  },
  nextButtonText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: isXLTablet ? 18 : undefined,
  },
});

