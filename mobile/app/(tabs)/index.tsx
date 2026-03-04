import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  // Consulta a la nueva API /api/mobile/dashboard
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['mobileDashboard'],
    queryFn: async () => {
      const res = await api.get('/mobile/dashboard');
      return res.data;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const user = dashboardData?.user;
  const animals = dashboardData?.animals || [];
  const stats = dashboardData?.stats;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* Header */}
      <View className="bg-brand-600 px-6 pt-16 pb-6 rounded-b-3xl shadow-sm">
        <Text className="text-brand-100 text-lg font-medium">{t('dashboard.greeting')}</Text>
        <Text className="text-white text-3xl font-bold mt-1">
          {user?.firstName || 'Usuario'}
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row px-6 mt-6 space-x-4 gap-x-4">
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center">
          <Ionicons name="paw" size={24} color="#10b981" />
          <Text className="text-2xl font-bold text-gray-800 mt-2">{stats?.pets || 0}</Text>
          <Text className="text-xs text-gray-500 mt-1">{t('dashboard.stats.pets')}</Text>
        </View>
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center">
          <Ionicons name="scan" size={24} color="#3b82f6" />
          <Text className="text-2xl font-bold text-gray-800 mt-2">{stats?.scans || 0}</Text>
          <Text className="text-xs text-gray-500 mt-1">{t('dashboard.stats.scans')}</Text>
        </View>
      </View>

      {/* Recent Pets Section */}
      <View className="px-6 mt-8 mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">{t('dashboard.recentPets')}</Text>
          <TouchableOpacity>
            <Text className="text-brand-600 font-medium">{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {animals.length > 0 ? (
          <View className="space-y-3 gap-y-3">
            {animals.slice(0, 3).map((animal: any) => (
              <TouchableOpacity
                key={animal.id}
                className="bg-white p-4 rounded-xl flex-row items-center justify-between shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-brand-50 rounded-full items-center justify-center mr-4">
                    <Ionicons name={animal.species === 'CAT' ? 'logo-octocat' : 'paw'} size={24} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-gray-800">{animal.name}</Text>
                    <Text className="text-sm text-gray-500">
                      {animal.breed || t('animals.noBreed')}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-white p-8 rounded-xl items-center border border-gray-100 border-dashed">
            <Ionicons name="sad-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-4">
              {t('dashboard.noPets')}
            </Text>
            <TouchableOpacity className="mt-4 bg-brand-50 px-6 py-2 rounded-lg">
              <Text className="text-brand-600 font-bold">{t('dashboard.addNew')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
}
