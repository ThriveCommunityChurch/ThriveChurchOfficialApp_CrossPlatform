import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';
import { setOnboardingCompleted } from '../../services/storage/storage';
import { logTutorialBegin, logTutorialComplete } from '../../services/analytics/analyticsService';

// Responsive breakpoint: use logical width for device-independent pixels
const SMALL_SCREEN_BREAKPOINT = 414; // iPhone Plus/XR/11 and below use icon design

interface OnboardingPage {
  id: string;
  imageName: string;
  iconName: keyof typeof Ionicons.glyphMap;
  headerText: string;
  bodyText: string;
}

const pages: OnboardingPage[] = [
  {
    id: '1',
    imageName: 'listen_img',
    iconName: 'headset',
    headerText: 'Stream & Download Sermons',
    bodyText: "Never miss a message! Stream sermons in Full HD or download them for offline listening. Whether you're commuting, at the gym, or traveling, take our weekly messages with you wherever you go.",
  },
  {
    id: '2',
    imageName: 'bible_img',
    iconName: 'book',
    headerText: 'Read the Bible Anywhere',
    bodyText: "Access the complete English Standard Version (ESV) Bible powered by YouVersion. Read, search, and explore scripture with an intuitive interface designed for daily devotion and study.",
  },
  {
    id: '3',
    imageName: 'connect_img',
    iconName: 'people',
    headerText: 'Stay Connected with Thrive',
    bodyText: "Get the latest church announcements, upcoming events, and community updates. Connect with our team, submit prayer requests, and stay engaged with everything happening at Thrive Community Church.",
  },
  {
    id: '4',
    imageName: 'search_img',
    iconName: 'search',
    headerText: 'Search & Discover Content',
    bodyText: "Easily find sermons by topic, speaker, or series. Use powerful search and filtering tools to discover messages that speak to your current season and spiritual journey.",
  },
  {
    id: '5',
    imageName: 'final_img',
    iconName: 'heart',
    headerText: 'Welcome to Thrive Community Church',
    bodyText: "You're all set! Dive in and experience everything Thrive has to offer. We're excited to have you join our community and grow in faith together.",
  },
];

// Image assets mapping - will gracefully fallback to icon design if images don't exist
// Note: Images should be placed in ThriveChurchExpo/assets/images/onboarding/
// Expected filenames: listen_img.png, bible_img.png, connect_img.png, search_img.png, final_img_light.png, final_img_dark.png

// Pre-load all available images to avoid dynamic require issues
const imageAssets = {
  listen_img: require('../../../assets/images/onboarding/listen_img.png'),
  bible_img: require('../../../assets/images/onboarding/bible_img.png'),
  final_img_dark: require('../../../assets/images/onboarding/final_img_dark.png'),
  // Images below don't exist yet - will be added later
  // connect_img: require('../../../assets/images/onboarding/connect_img.png'),
  // search_img: require('../../../assets/images/onboarding/search_img.png'),
  // final_img_light: require('../../../assets/images/onboarding/final_img_light.png'),
};

const getImageAsset = (imageName: string, isDarkMode: boolean): any | null => {
  try {
    // Handle theme-aware final image
    if (imageName === 'final_img') {
      if (isDarkMode) {
        return imageAssets.final_img_dark || null;
      } else {
        // Light mode version doesn't exist yet, return null to trigger fallback
        return null; // Will use: imageAssets.final_img_light when available
      }
    }

    // Handle other images
    return (imageAssets as any)[imageName] || null;
  } catch (error) {
    // Image doesn't exist, return null to trigger fallback
    return null;
  }
};

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Component: Animated Icon with Gradient Background (for small screens)
interface AnimatedIconWithGradientProps {
  iconName: keyof typeof Ionicons.glyphMap;
  theme: Theme;
  screenWidth: number;
}

const AnimatedIconWithGradient: React.FC<AnimatedIconWithGradientProps> = ({ iconName, theme, screenWidth }) => {
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

  const iconSize = screenWidth * 0.25; // 25% of screen width
  const containerSize = screenWidth * 0.5; // 50% of screen width

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
          shadowColor: theme.colors.shadowDark,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
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

// Component: Image with Fallback (for large screens)
interface ImageWithFallbackProps {
  imageName: string;
  iconName: keyof typeof Ionicons.glyphMap;
  theme: Theme;
  screenWidth: number;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ imageName, iconName, theme, screenWidth }) => {
  const [imageError, setImageError] = useState(false);
  const imageSource = getImageAsset(imageName, theme.isDark);

  // If image doesn't exist or fails to load, show the icon design
  if (!imageSource || imageError) {
    console.log(`[ImageWithFallback] Falling back to icon for "${imageName}" (isDark: ${theme.isDark}) - imageSource:`, !!imageSource, 'imageError:', imageError);
    return <AnimatedIconWithGradient iconName={iconName} theme={theme} screenWidth={screenWidth} />;
  }

  console.log(`[ImageWithFallback] Rendering image for "${imageName}" (isDark: ${theme.isDark})`);

  return (
    <Image
      source={imageSource}
      style={{
        width: screenWidth * 0.6,
        height: screenWidth * 0.6,
        borderRadius: 20,
      }}
      resizeMode="contain"
      onError={() => setImageError(true)}
    />
  );
};

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Track screen dimensions dynamically
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const styles = createStyles(theme, screenDimensions.width, screenDimensions.height);
  const isSmallScreen = screenDimensions.width < SMALL_SCREEN_BREAKPOINT;

  // Listen for dimension changes (e.g., rotation)
  useEffect(() => {
    // Log initial dimensions for debugging
    console.log('[Onboarding] Screen dimensions:', screenDimensions);
    console.log('[Onboarding] Is small screen?', isSmallScreen);
    console.log('[Onboarding] Breakpoint:', SMALL_SCREEN_BREAKPOINT);

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log('[Onboarding] Dimensions changed:', window);
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, [screenDimensions, isSmallScreen]);

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

  const renderPage = useCallback(({ item }: { item: OnboardingPage }) => {
    console.log(`[renderPage] Rendering "${item.headerText}" - isSmallScreen:`, isSmallScreen);
    return (
      <View style={styles.page}>
        <View style={styles.imageContainer}>
          {isSmallScreen ? (
            // Small screens: Animated Icon with Gradient Background
            <AnimatedIconWithGradient
              iconName={item.iconName}
              theme={theme}
              screenWidth={screenDimensions.width}
            />
          ) : (
            // Large screens: Display images (with fallback to icon design)
            <ImageWithFallback
              imageName={item.imageName}
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
        </View>
      </View>
    );
  }, [theme, isSmallScreen, screenDimensions.width]);

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
            {currentIndex > 0 ? 'PREV' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[theme.typography.caption as any, styles.skipButtonText]}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={[theme.typography.body as any, styles.nextButtonText]}>
            {currentIndex === pages.length - 1 ? 'DONE' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, width: number, height: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  page: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  imageContainer: {
    flex: 0.7,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 40,
  },
  imagePlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  headerText: {
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  bodyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: theme.colors.primary, // ← ONLY COLOR CHANGED
  },
  inactiveDot: {
    backgroundColor: theme.colors.textTertiary, // ← ONLY COLOR CHANGED
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  previousButton: {
    minWidth: 60,
  },
  previousButtonText: {
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  disabledButtonText: {
    opacity: 0,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: theme.colors.textTertiary, // ← ONLY COLOR CHANGED
  },
  nextButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  nextButtonText: {
    color: theme.colors.primary, // ← ONLY COLOR CHANGED
    fontWeight: 'bold',
  },
});

