import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ClinicChatScreen() {
    const [message, setMessage] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['mobileClinicChat'],
        queryFn: async () => {
            const res = await api.get('/mobile/clinic-chat');
            return res.data;
        },
        refetchInterval: 5000 // Polling every 5 seconds for MVP
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            return api.post('/mobile/clinic-chat', {
                sessionId: data?.session?.id,
                content
            });
        },
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['mobileClinicChat'] });
        }
    });

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    const session = data?.session;
    const organization = session?.organization;
    const messages = session?.messages || [];

    return (
        <View className="flex-1 bg-gray-50 pt-16">
            {/* Header Info */}
            <View className="px-6 mb-4 flex-row items-center justify-between border-b pb-4 border-gray-200">
                <View>
                    <Text className="text-2xl font-bold text-gray-800">{organization?.name || 'Clínica Veterinaria'}</Text>
                    <Text className="text-brand-600 font-medium">Chat Interactivo</Text>
                </View>
                <View className="flex-row">
                    <TouchableOpacity className="w-10 h-10 bg-brand-50 rounded-full items-center justify-center mr-2">
                        <Ionicons name="call" size={20} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-10 h-10 bg-brand-100 rounded-full items-center justify-center">
                        <Ionicons name="location" size={20} color="#10b981" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Acciones Rápidas */}
            <View className="px-6 py-2 flex-row gap-x-2 space-x-2">
                <TouchableOpacity className="bg-brand-600 px-4 py-2 rounded-full flex-row items-center shadow-sm">
                    <Ionicons name="calendar" size={16} color="white" />
                    <Text className="text-white font-bold ml-2">Agendar Turno</Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-full flex-row items-center shadow-sm ml-2">
                    <Ionicons name="cart" size={16} color="white" />
                    <Text className="text-white font-bold ml-2">Comprar Alimento</Text>
                </TouchableOpacity>
            </View>

            {/* Área de Chat (Conversaciones) */}
            <ScrollView
                className="flex-1 px-4 mt-4"
                contentContainerStyle={{ paddingBottom: 20 }}
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                <View className="items-center my-4">
                    <Text className="text-xs text-gray-400 font-medium">Inicio del chat con la clínica</Text>
                </View>

                {messages.length === 0 ? (
                    <View className="items-center mt-10">
                        <Text className="text-gray-400 text-center">Todavía no hay mensajes.{'\n'}¡Escríbele a tu clínica ahora!</Text>
                    </View>
                ) : (
                    messages.map((msg: any) => {
                        const isUser = msg.senderType === 'USER';
                        return (
                            <View key={msg.id} className={`flex-row mb-4 ${isUser ? 'justify-end w-full' : 'max-w-[85%]'}`}>
                                {!isUser && (
                                    <View className="w-8 h-8 bg-brand-100 rounded-full items-center justify-center mr-2">
                                        <Ionicons name="medical" size={16} color="#10b981" />
                                    </View>
                                )}
                                <View className={`${isUser ? 'bg-brand-500 rounded-2xl rounded-tr-none' : 'bg-white rounded-2xl rounded-tl-none border border-gray-100'} p-3 shadow-sm max-w-[85%]`}>
                                    <Text className={isUser ? "text-white" : "text-gray-800"}>{msg.content}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Input de Chat */}
            <View className="bg-white border-t border-gray-200 px-4 py-3 pb-8 flex-row items-center">
                <TouchableOpacity className="mr-3">
                    <Ionicons name="add-circle" size={28} color="#9ca3af" />
                </TouchableOpacity>

                <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3 flex-row items-center">
                    <TextInput
                        className="flex-1 text-base text-gray-800"
                        placeholder="Escribe un mensaje..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    className="w-10 h-10 bg-brand-500 rounded-full items-center justify-center"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    onPress={() => sendMessageMutation.mutate(message)}
                    style={{ opacity: message.trim() ? 1 : 0.5 }}
                >
                    {sendMessageMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Ionicons name="send" size={18} color="white" style={{ marginLeft: 2 }} />
                    )}
                </TouchableOpacity>
            </View>

        </View>
    );
}
