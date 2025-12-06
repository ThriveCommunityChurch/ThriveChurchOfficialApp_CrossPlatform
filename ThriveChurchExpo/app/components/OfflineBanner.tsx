import React from 'react';
import { View, Text } from 'react-native';
import NetInfo, {useNetInfo} from '@react-native-community/netinfo';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

export default function OfflineBanner() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const offline = netInfo.isConnected === false;
  if (!offline) return null;
  return (
    <View style={{ backgroundColor: theme.colors.cardSecondary, paddingVertical: 6, alignItems: 'center' }}>
      <Text style={[theme.typography.label as any, { color: theme.colors.textSecondary }]}>{t('common.offline')}</Text>
    </View>
  );
}

