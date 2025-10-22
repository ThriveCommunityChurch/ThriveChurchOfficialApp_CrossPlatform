/**
 * BibleSelectionScreen
 * Main Bible screen with Traditional and Alphabetical order selection cards
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleOrderType } from '../../types/bible';

type BibleStackParamList = {
  BibleSelection: undefined;
  BookList: { orderType: BibleOrderType; title: string };
};

type NavigationProp = NativeStackNavigationProp<BibleStackParamList>;

interface SelectionCardProps {
  title: string;
  description: string;
  onPress: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ title, description, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const BibleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleTraditionalPress = () => {
    navigation.navigate('BookList', {
      orderType: 'traditional',
      title: 'Bible - Traditional',
    });
  };

  const handleAlphabeticalPress = () => {
    navigation.navigate('BookList', {
      orderType: 'alphabetical',
      title: 'Bible - Alphabetical',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Choose a book order</Text>

        <SelectionCard
          title="Traditional Order"
          description={'Browse books in biblical order\nGenesis → Malachi → Matthew → Revelation'}
          onPress={handleTraditionalPress}
        />

        <SelectionCard
          title="Alphabetical Order"
          description={'Browse books from A to Z\nActs → Amos → Colossians → Daniel'}
          onPress={handleAlphabeticalPress}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(27, 27, 27)', // #1B1B1B
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Avenir-Book',
    color: '#D3D3D3',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgb(40, 40, 40)',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: '#D3D3D3',
    lineHeight: 20,
  },
  chevron: {
    fontSize: 32,
    color: '#D3D3D3',
    marginLeft: 12,
    fontWeight: '300',
  },
});

