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
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { setOnboardingCompleted } from '../../services/storage/storage';
import { logTutorialBegin, logTutorialComplete } from '../../services/analytics/analyticsService';

const { width, height } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  imageName: string;
  headerText: string;
  bodyText: string;
}

const pages: OnboardingPage[] = [
  {
    id: '1',
    imageName: 'listen_img',
    headerText: 'Take us with you on the go!',
    bodyText: "Whether you're traveling or under the weather, you'll never miss a sermon series with our automatic weekly updates. Download sermons for listening in the car, at work or at the gym. You can even stream your favorite messages in Full HD!",
  },
  {
    id: '2',
    imageName: 'bible_img',
    headerText: 'Read The Entire Bible!',
    bodyText: "With the power of YouVersion and bible.com, the entire English Standard Version (ESV) of the bible is available at your fingertips. Take your bible with you, wherever you go.",
  },
  {
    id: '3',
    imageName: 'final_img',
    headerText: 'Ready To Get Started?',
    bodyText: "Tap DONE below to dive in and experience Thrive Community Church",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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
    return (
      <View style={styles.page}>
        <View style={styles.imageContainer}>
          {/* Placeholder for image - in production, use actual images */}
          <View style={styles.imagePlaceholder}>
            <Text style={[typography.h1, { color: colors.mainBlue }]}>📱</Text>
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[typography.h1, styles.headerText]}>
            {item.headerText}
          </Text>
          <Text style={[typography.body, styles.bodyText]}>
            {item.bodyText}
          </Text>
        </View>
      </View>
    );
  }, []);

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
              typography.body,
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
          <Text style={[typography.caption, styles.skipButtonText]}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={[typography.body, styles.nextButtonText]}>
            {currentIndex === pages.length - 1 ? 'DONE' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.almostBlack,
  },
  page: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  imagePlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 20,
    backgroundColor: colors.bgDarkBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  headerText: {
    textAlign: 'center',
    marginBottom: 16,
    color: colors.white,
  },
  bodyText: {
    textAlign: 'center',
    color: colors.lessLightLightGray,
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
    backgroundColor: colors.mainBlue,
  },
  inactiveDot: {
    backgroundColor: colors.bgBlue,
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
    color: colors.lessLightLightGray,
  },
  disabledButtonText: {
    opacity: 0,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: colors.lighterBlueGray,
  },
  nextButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  nextButtonText: {
    color: colors.mainBlue,
    fontWeight: 'bold',
  },
});

