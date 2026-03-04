import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { api } from '@/lib/api';

export default function PetsScreen() {
    const [selectedPet, setSelectedPet] = useState<any>(null);
    const [qrModalVisible, setQrModalVisible] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['pets'],
        queryFn: async () => {
            const response = await api.get('/mobile/pets');
            return response.data.pets;
        }
    });

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-gray-500 mt-4 font-medium">Cargando tus mascotas...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 px-6">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text className="text-xl font-bold text-gray-800 mt-4">Error</Text>
                <Text className="text-gray-500 text-center mt-2">No pudimos cargar tus mascotas. Revisa tu conexión a internet e intenta nuevamente.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 pt-16">
            <View className="px-6 mb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-3xl font-bold text-gray-800">Mis Mascotas</Text>
                    <Text className="text-gray-500 mt-1">Gestiona los perfiles de tus peludos</Text>
                </View>
                <TouchableOpacity className="w-10 h-10 bg-brand-100 rounded-full items-center justify-center">
                    <Ionicons name="add" size={24} color="#10b981" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6">
                {(!data || data.length === 0) ? (
                    <View className="bg-white p-6 rounded-3xl border border-gray-100 items-center justify-center mt-10 shadow-sm">
                        <View className="w-16 h-16 bg-brand-50 rounded-full items-center justify-center mb-4">
                            <Ionicons name="paw" size={32} color="#10b981" />
                        </View>
                        <Text className="text-lg font-bold text-gray-800">No tienes mascotas</Text>
                        <Text className="text-gray-500 text-center mt-2 mb-6">
                            Añade a tu primer mascota para empezar a disfrutar de una vida sana para los que más amas.
                        </Text>
                        <TouchableOpacity className="bg-brand-500 py-4 px-8 rounded-full shadow-sm">
                            <Text className="text-white font-bold text-base">Añadir Mascota</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    data.map((pet: any) => (
                        <TouchableOpacity
                            key={pet.id}
                            className="bg-white rounded-3xl p-5 mb-4 border border-gray-100 shadow-sm flex-row items-center"
                        >
                            <View className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden mr-4 shadow-sm border border-gray-100">
                                {pet.photo || (pet.AnimalPhoto && pet.AnimalPhoto.length > 0) ? (
                                    <Image
                                        source={{ uri: pet.photo || (pet.AnimalPhoto[0] && pet.AnimalPhoto[0].image?.startsWith('data:image') ? pet.AnimalPhoto[0].image : "https://via.placeholder.com/150") }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="w-full h-full items-center justify-center bg-brand-50">
                                        <Ionicons name="paw" size={24} color="#10b981" />
                                    </View>
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-gray-800">{pet.name}</Text>
                                <Text className="text-gray-500 uppercase text-xs font-bold mt-1 tracking-wider">
                                    {pet.species === 'DOG' ? 'Perro' : pet.species === 'CAT' ? 'Gato' : pet.species} • {pet.breed || 'Mestizo'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                className="w-10 h-10 bg-brand-50 rounded-full items-center justify-center mr-2 shadow-sm"
                                onPress={() => {
                                    setSelectedPet(pet);
                                    setQrModalVisible(true);
                                }}
                            >
                                <Ionicons name="qr-code-outline" size={20} color="#10b981" />
                            </TouchableOpacity>
                            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View className="h-10" />
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={qrModalVisible}
                onRequestClose={() => {
                    setQrModalVisible(false);
                    setSelectedPet(null);
                }}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 items-center shadow-lg pt-4 pb-10">
                        <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-6" />
                        <Text className="text-2xl font-bold text-gray-800 mb-2">Placa Digital</Text>
                        <Text className="text-gray-500 text-center mb-8 px-4 leading-relaxed">
                            Muestra este código para que puedan ver la ficha médica o contactarte en caso de emergencia.
                        </Text>

                        <View className="p-4 bg-white rounded-3xl border-4 border-brand-100 shadow-sm mb-4">
                            {selectedPet && (
                                <QRCode
                                    value={`https://localipet.com/p/${selectedPet.id}`}
                                    size={200}
                                    color="#1f2937"
                                    backgroundColor="white"
                                />
                            )}
                        </View>

                        <Text className="text-2xl font-bold text-gray-800">{selectedPet?.name}</Text>
                        <Text className="text-brand-600 font-bold uppercase text-xs mt-1 tracking-wider">
                            ID: {selectedPet?.id?.substring(0, 8).toUpperCase()}
                        </Text>

                        <TouchableOpacity
                            className="w-full bg-brand-500 py-4 rounded-2xl mt-8 shadow-sm flex-row justify-center items-center"
                            onPress={() => {
                                setQrModalVisible(false);
                                setSelectedPet(null);
                            }}
                        >
                            <Text className="text-white text-center font-bold text-lg">Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
