import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function OffersScreen() {
    const { data, isLoading } = useQuery({
        queryKey: ['mobileOffers'],
        queryFn: async () => {
            const res = await api.get('/mobile/offers');
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    const globalOffers = data?.globalOffers || [];
    const clinicOffers = data?.clinicOffers || [];

    return (
        <View className="flex-1 bg-gray-50 pt-16">
            <View className="px-6 mb-4">
                <Text className="text-3xl font-bold text-gray-800">Ofertas Exclusivas</Text>
                <Text className="text-gray-500 mt-1">Descuentos de Localipet y tu Clínica</Text>
            </View>

            <ScrollView className="flex-1">
                {/* Oferta de Localipet (Admin) */}
                <View className="px-6 py-4">
                    <Text className="text-lg font-bold text-gray-800 mb-3">De parte de Localipet</Text>
                    {globalOffers.length === 0 ? (
                        <Text className="text-gray-500 italic">No hay ofertas globales en este momento.</Text>
                    ) : (
                        globalOffers.map((offer: any) => (
                            <View key={offer.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
                                <View className="h-32 bg-brand-500 items-center justify-center">
                                    <Ionicons name="shield-checkmark" size={48} color="white" />
                                </View>
                                <View className="p-4">
                                    <View className="bg-brand-100 self-start px-2 py-1 rounded-full mb-2">
                                        <Text className="text-xs font-bold text-brand-700">{offer.tag || 'Promoción'}</Text>
                                    </View>
                                    <Text className="text-xl font-bold text-gray-800">{offer.title}</Text>
                                    <Text className="text-gray-500 mt-1 mb-3">
                                        {offer.description}
                                    </Text>
                                    <TouchableOpacity className="bg-brand-600 rounded-lg py-3 items-center">
                                        <Text className="text-white font-bold">Obtener Promoción {offer.discount}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Oferta de la Clínica Vinculada */}
                <View className="px-6 py-4 mb-8">
                    <Text className="text-lg font-bold text-gray-800 mb-3">En tu Clínica</Text>
                    {clinicOffers.length === 0 ? (
                        <Text className="text-gray-500 italic">No hay ofertas de tu clínica.</Text>
                    ) : (
                        clinicOffers.map((campaign: any) => (
                            <View key={campaign.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
                                <View className="h-32 bg-blue-500 items-center justify-center">
                                    <Ionicons name="medical" size={48} color="white" />
                                </View>
                                <View className="p-4">
                                    <View className="bg-blue-100 self-start px-2 py-1 rounded-full mb-2">
                                        <Text className="text-xs font-bold text-blue-700">Campaña Activa</Text>
                                    </View>
                                    <Text className="text-xl font-bold text-gray-800">{campaign.title}</Text>
                                    <Text className="text-gray-500 mt-1 mb-3">
                                        {campaign.description}
                                    </Text>
                                    <TouchableOpacity className="bg-blue-600 rounded-lg py-3 items-center">
                                        <Text className="text-white font-bold">Aprovechar {campaign.discountCode ? `(${campaign.discountCode})` : ''}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
