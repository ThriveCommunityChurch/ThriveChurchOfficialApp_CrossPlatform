/**
 * Config Types
 * Dynamic configuration settings from backend
 */

export enum ConfigType {
  Phone = 'Phone',
  Email = 'Email',
  Link = 'Link',
  Misc = 'Misc',
  Social = 'Social',
}

export interface ConfigSetting {
  Type: ConfigType;
  Key: string;
  Value: string;
}

export interface ConnectMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  action: 'contact' | 'directions' | 'announcements' | 'webview';
  config?: ConfigSetting;
}

// Config Keys matching iOS
export const ConfigKeys = {
  LIVE: 'Live_URL',
  EMAIL_MAIN: 'Email_Main',
  PHONE_MAIN: 'Phone_Main',
  SMALL_GROUP: 'SmallGroup_URL',
  ADDRESS_MAIN: 'Address_Main',
  SERVE: 'Serve_URL',
  IM_NEW: 'ImNew_URL',
  GIVE: 'Give_URL',
  FB_SOCIAL: 'FB_Social_URL',
  TW_SOCIAL: 'TW_Social_URL',
  IG_SOCIAL: 'IG_Social_URL',
  WEBSITE: 'Website_URL',
  TEAM: 'Team_URL',
  LOCATION_NAME: 'Location_Name',
  FB_PAGE_ID: 'FB_PageId',
  TW_USERNAME: 'TW_uName',
  IG_USERNAME: 'IG_uName',
  PRAYERS: 'Prayer_URL',
} as const;

