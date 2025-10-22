import React from 'react';
import { View, Text } from 'react-native';
import NetInfo, {useNetInfo} from '@react-native-community/netinfo';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function OfflineBanner() {
  const netInfo = useNetInfo();
  const offline = netInfo.isConnected === false;
  if (!offline) return null;
  return (
    <View style={{ backgroundColor: colors.darkGrey, paddingVertical: 6, alignItems: 'center' }}>
      <Text style={[typography.label, { color: colors.lightGray }]}>You are offline</Text>
    </View>
  );
}

