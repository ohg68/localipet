import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ProfileScreen() {
    const router = useRouter();

    const { data: user, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await api.get('/mobile/profile');
            return response.data.user;
        }
    });

    const handleLogout = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro que deseas salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('userToken');
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-gray-500 mt-4 font-medium">Cargando tu perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 px-6">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text className="text-xl font-bold text-gray-800 mt-4">Error</Text>
                <Text className="text-gray-500 text-center mt-2">No pudimos cargar tu perfil. Revisa tu conexión.</Text>
                <TouchableOpacity className="mt-6 bg-brand-500 px-6 py-3 rounded-full" onPress={handleLogout}>
                    <Text className="text-white font-bold">Cerrar Sesión (Emergencia)</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email?.split('@')[0];

    return (
        <View className="flex-1 bg-gray-50 px-6 pt-16">
            <Text className="text-3xl font-bold text-gray-800 mb-8">Mi Perfil</Text>

            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center justify-center">
                <View className="w-24 h-24 bg-brand-100 rounded-full items-center justify-center mb-4 overflow-hidden border-4 border-brand-50">
                    {user?.profile?.avatar ? (
                        <Image source={{ uri: user.profile.avatar }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <Ionicons name="person" size={48} color="#10b981" />
                    )}
                </View>
                <Text className="text-2xl font-bold mt-2 text-gray-800">{displayName}</Text>
                <Text className="text-brand-600 font-bold mt-1 tracking-wider uppercase text-xs">{(user?.profile?.role || "Dueño").replace("OWNER", "Dueño de Mascota")}</Text>
                <Text className="text-gray-400 mt-2">{user?.email}</Text>
                {user?.profile?.city && (
                    <View className="flex-row items-center mt-3 bg-gray-50 px-3 py-1 rounded-full">
                        <Ionicons name="location" size={14} color="#9ca3af" />
                        <Text className="text-gray-500 text-xs ml-1 font-medium">{user.profile.city}, {user.profile.country}</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity className="mt-6 bg-white py-4 px-6 rounded-2xl flex-row items-center justify-between border border-gray-100 shadow-sm">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-brand-50 rounded-full items-center justify-center mr-3">
                        <Ionicons name="settings-outline" size={20} color="#10b981" />
                    </View>
                    <Text className="text-gray-800 font-bold text-base">Ajustes de Cuenta</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity className="mt-4 bg-white py-4 px-6 rounded-2xl flex-row items-center justify-between border border-gray-100 shadow-sm">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                        <Ionicons name="help-circle-outline" size={20} color="#3b82f6" />
                    </View>
                    <Text className="text-gray-800 font-bold text-base">Soporte y Ayuda</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
                className="mt-12 bg-red-50 py-4 px-6 rounded-2xl flex-row justify-center items-center mb-10"
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text className="text-red-500 font-bold ml-2 text-lg">Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );
}
