import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '@/lib/api';

import { HapticTab } from '@/components/haptic-tab';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      // Need projectId for EAS build, or it defaults to bare expo.
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = tokenResponse.data;
    } catch (e) {
      console.log("Error getting push token", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Custom auth check
  useEffect(() => {
    async function checkAuthAndSetup() {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          router.replace('/login');
        } else {
          setIsReady(true);

          // Auth is fine, now setup Push Notifications
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            // Send token to backend
            api.post('/mobile/push-token', { pushToken }, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(err => console.log('Error saving push token to backend', err));
          }
        }
      } catch (error) {
        router.replace('/login');
      }
    }

    checkAuthAndSetup();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981', // brand-500
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          paddingBottom: 5,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Ofertas',
          tabBarIcon: ({ color }) => <Ionicons size={26} name="pricetag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="clinic-chat"
        options={{
          title: 'Clínica',
          tabBarIcon: ({ color }) => <Ionicons size={26} name="chatbubbles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          href: null, // Hide from bottom tabs but keep routed
        }}
      />
    </Tabs>
  );
}
