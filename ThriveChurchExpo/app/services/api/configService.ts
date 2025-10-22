/**
 * Config Service
 * Fetches dynamic configuration settings from backend API
 */

import { api } from './client';
import { ConfigSetting, ConfigType, ConfigKeys } from '../../types/config';
import { saveConfigSetting, getConfigSetting } from '../storage/storage';

interface ConfigResponse {
  Type: string;
  Key: string;
  Value: string;
}

interface ConfigListResponse {
  Configs: ConfigResponse[];
}

/**
 * Check if any configs exist in AsyncStorage
 */
export const hasConfigs = async (): Promise<boolean> => {
  try {
    // Check for a few key configs to determine if configs have been loaded
    const emailConfig = await getConfigSetting(ConfigKeys.EMAIL_MAIN);
    const addressConfig = await getConfigSetting(ConfigKeys.ADDRESS_MAIN);
    const serveConfig = await getConfigSetting(ConfigKeys.SERVE);

    // If at least one config exists, consider configs as loaded
    return !!(emailConfig || addressConfig || serveConfig);
  } catch (error) {
    console.error('Error checking for configs:', error);
    return false;
  }
};

/**
 * Initialize configs with smart caching strategy
 * - Uses cached configs immediately if available
 * - Fetches fresh configs in background
 * - Returns immediately if configs exist (non-blocking)
 */
export const initializeConfigs = async (options?: {
  forceRefresh?: boolean;
  silent?: boolean;
}): Promise<{ usedCache: boolean; fetchedFresh: boolean }> => {
  const { forceRefresh = false, silent = false } = options || {};

  const configsExist = await hasConfigs();

  if (configsExist && !forceRefresh) {
    if (!silent) {
      console.log('Configs already loaded from cache, fetching fresh in background...');
    }

    // Fetch fresh configs in background without blocking
    fetchAndStoreConfigs(true).catch(err => {
      console.warn('Background config refresh failed:', err);
    });

    return { usedCache: true, fetchedFresh: false };
  }

  // No configs exist or force refresh requested - fetch now
  if (!silent) {
    console.log('Fetching configs from API...');
  }

  try {
    await fetchAndStoreConfigs(silent);
    return { usedCache: false, fetchedFresh: true };
  } catch (error) {
    console.error('Failed to initialize configs:', error);

    // If we have cached configs, we can still continue
    if (configsExist) {
      console.log('Using cached configs despite fetch failure');
      return { usedCache: true, fetchedFresh: false };
    }

    throw error;
  }
};

/**
 * Fetch all configs from the API and store in MMKV
 */
export const fetchAndStoreConfigs = async (silent: boolean = false): Promise<void> => {
  try {
    // Build query string with all config keys
    const keys = [
      ConfigKeys.EMAIL_MAIN,
      ConfigKeys.PHONE_MAIN,
      ConfigKeys.ADDRESS_MAIN,
      ConfigKeys.PRAYERS,
      ConfigKeys.SMALL_GROUP,
      ConfigKeys.SERVE,
      ConfigKeys.LIVE,
      ConfigKeys.IM_NEW,
      ConfigKeys.GIVE,
      ConfigKeys.FB_SOCIAL,
      ConfigKeys.TW_SOCIAL,
      ConfigKeys.IG_SOCIAL,
      ConfigKeys.WEBSITE,
      ConfigKeys.TEAM,
      ConfigKeys.LOCATION_NAME,
      ConfigKeys.FB_PAGE_ID,
      ConfigKeys.TW_USERNAME,
      ConfigKeys.IG_USERNAME,
    ];

    const queryParams = keys.map(key => `keys=${key}`).join('&');
    const url = `/api/config/list/?${queryParams}`;

    if (!silent) {
      console.log('Fetching configs from:', url);
    }

    const response = await api.get<ConfigListResponse>(url);

    if (response.data && response.data.Configs) {
      if (!silent) {
        console.log(`Received ${response.data.Configs.length} configs from API`);
      }

      // Store each config in MMKV
      for (const config of response.data.Configs) {
        const configSetting: ConfigSetting = {
          Type: mapConfigType(config.Type),
          Key: config.Key,
          Value: config.Value,
        };

        await saveConfigSetting(config.Key, configSetting);
        if (!silent) {
          console.log(`Saved config: ${config.Key} = ${config.Value}`);
        }
      }

      if (!silent) {
        console.log('All configs saved to MMKV successfully');
      }
    } else {
      console.warn('No configs received from API');
    }
  } catch (error) {
    console.error('Error fetching configs:', error);
    throw error;
  }
};

/**
 * Fetch a single config from the API
 */
export const fetchConfig = async (key: string): Promise<ConfigSetting | null> => {
  try {
    const response = await api.get<ConfigResponse>(`/api/config/?setting=${key}`);

    if (response.data) {
      const configSetting: ConfigSetting = {
        Type: mapConfigType(response.data.Type),
        Key: response.data.Key,
        Value: response.data.Value,
      };

      // Save to AsyncStorage
      await saveConfigSetting(key, configSetting);

      return configSetting;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching config ${key}:`, error);
    return null;
  }
};

/**
 * Map API config type string to ConfigType enum
 */
const mapConfigType = (typeString: string): ConfigType => {
  switch (typeString) {
    case 'Phone':
      return ConfigType.Phone;
    case 'Email':
      return ConfigType.Email;
    case 'Link':
      return ConfigType.Link;
    case 'Social':
      return ConfigType.Social;
    case 'Misc':
    default:
      return ConfigType.Misc;
  }
};

/**
 * Populate AsyncStorage with mock/test configs for development
 */
export const populateMockConfigs = async (): Promise<void> => {
  console.log('Populating AsyncStorage with mock configs...');

  const mockConfigs: Array<{ key: string; config: ConfigSetting }> = [
    {
      key: ConfigKeys.EMAIL_MAIN,
      config: {
        Type: ConfigType.Email,
        Key: ConfigKeys.EMAIL_MAIN,
        Value: 'info@thrive-fl.org',
      },
    },
    {
      key: ConfigKeys.PHONE_MAIN,
      config: {
        Type: ConfigType.Phone,
        Key: ConfigKeys.PHONE_MAIN,
        Value: '2396873430',
      },
    },
    {
      key: ConfigKeys.ADDRESS_MAIN,
      config: {
        Type: ConfigType.Misc,
        Key: ConfigKeys.ADDRESS_MAIN,
        Value: '12650 World Plaza Ln\nFort Myers, FL 33907',
      },
    },
    {
      key: ConfigKeys.PRAYERS,
      config: {
        Type: ConfigType.Link,
        Key: ConfigKeys.PRAYERS,
        Value: 'https://thrive-fl.org/prayer',
      },
    },
    {
      key: ConfigKeys.SMALL_GROUP,
      config: {
        Type: ConfigType.Link,
        Key: ConfigKeys.SMALL_GROUP,
        Value: 'https://thrive-fl.org/smallgroups',
      },
    },
    {
      key: ConfigKeys.SERVE,
      config: {
        Type: ConfigType.Link,
        Key: ConfigKeys.SERVE,
        Value: 'https://thrive-fl.org/serve',
      },
    },
    {
      key: ConfigKeys.GIVE,
      config: {
        Type: ConfigType.Link,
        Key: ConfigKeys.GIVE,
        Value: 'https://thrive-fl.org/give',
      },
    },
    {
      key: ConfigKeys.IM_NEW,
      config: {
        Type: ConfigType.Link,
        Key: ConfigKeys.IM_NEW,
        Value: 'https://thrive-fl.org/im-new',
      },
    },
    {
      key: ConfigKeys.WEBSITE,
      config: {
        Type: ConfigType.Link,
        Key: ConfigKeys.WEBSITE,
        Value: 'https://thrive-fl.org',
      },
    },
    {
      key: ConfigKeys.FB_SOCIAL,
      config: {
        Type: ConfigType.Social,
        Key: ConfigKeys.FB_SOCIAL,
        Value: 'https://facebook.com/thriveccswfl',
      },
    },
    {
      key: ConfigKeys.IG_SOCIAL,
      config: {
        Type: ConfigType.Social,
        Key: ConfigKeys.IG_SOCIAL,
        Value: 'https://instagram.com/thriveccswfl',
      },
    },
    {
      key: ConfigKeys.TW_SOCIAL,
      config: {
        Type: ConfigType.Social,
        Key: ConfigKeys.TW_SOCIAL,
        Value: 'https://twitter.com/thriveccswfl',
      },
    },
  ];

  for (const { key, config } of mockConfigs) {
    await saveConfigSetting(key, config);
    console.log(`Mock config saved: ${key} = ${config.Value}`);
  }

  console.log('Mock configs populated successfully!');
};

