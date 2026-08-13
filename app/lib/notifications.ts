import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export async function registerForPushNotifications(): Promise<void> {
  try {
    if (!Device.isDevice) return; // Push tokens are unavailable in emulators

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return; // Permission denied — app still works fully

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined as any,
    );
    const token = tokenData.data;

    // Upsert: unique constraint + ignoreDuplicates means re-registration is a no-op
    await supabase.from('device_tokens').upsert(
      { expo_push_token: token },
      { onConflict: 'expo_push_token', ignoreDuplicates: true },
    );

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  } catch (error) {
    console.warn('Push notification registration failed (non-fatal):', error);
  }
}
