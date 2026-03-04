import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '@/lib/api';

export default function SocialScreen() {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

    // Seleccionar de la galería
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 4],
            quality: 0.5,
            base64: true
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64 || null);
        }
    };

    // Iniciar cámara
    const startCamera = async () => {
        if (!cameraPermission?.granted) {
            const permission = await requestCameraPermission();
            if (!permission.granted) {
                Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para tomar fotos.");
                return;
            }
        }
        setIsCameraActive(true);
    };

    // Tomar la foto dentro del componente de cámara
    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photo = await cameraRef.takePictureAsync({ base64: true, quality: 0.5 });
                if (photo) {
                    setImageUri(photo.uri);
                    setImageBase64(photo.base64 || null);
                    setIsCameraActive(false);
                }
            } catch (error) {
                console.error("Error al tomar foto", error);
            }
        }
    };

    const handleUpload = async () => {
        if (!imageBase64) {
            Alert.alert("Error", "No se encontró la imagen para subir.");
            return;
        }

        setIsUploading(true);
        try {
            await api.post('/mobile/social/upload', {
                imageBase64,
                caption,
                platform: 'Instagram' // Simulamos selección de plataforma
            });
            Alert.alert("¡Publicado!", "La foto se ha guardado en tu perfil y enviado a tus redes conectadas con éxito.");
            setImageUri(null);
            setImageBase64(null);
            setCaption('');
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.error || "Ocurrió un error al subir la foto.");
        } finally {
            setIsUploading(false);
        }
    };

    // Si la cámara está activa, renderizamos a pantalla completa (o casi) el visor
    if (isCameraActive) {
        return (
            <View className="flex-1 bg-black">
                <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    ref={(ref) => setCameraRef(ref)}
                >
                    <View className="flex-1 justify-between p-6">
                        <TouchableOpacity
                            className="bg-black/50 self-start p-3 rounded-full mt-10"
                            onPress={() => setIsCameraActive(false)}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <View className="items-center mb-10">
                            <TouchableOpacity
                                className="w-20 h-20 rounded-full border-4 border-white bg-white/30 items-center justify-center"
                                onPress={takePicture}
                            >
                                <View className="w-16 h-16 bg-white rounded-full"></View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            </View>
        );
    }

    // Modal / Vista de "Imagen Capturada" (Preview antes de publicar a redes)
    if (imageUri) {
        return (
            <View className="flex-1 bg-gray-50 pt-16 px-6">
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity onPress={() => setImageUri(null)}>
                        <Ionicons name="arrow-back" size={28} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Nueva Publicación</Text>
                    <View className="w-8"></View>
                </View>

                <View className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex-1 mb-8">
                    <Image
                        source={{ uri: imageUri }}
                        className="w-full h-80 rounded-2xl mb-4"
                        resizeMode="cover"
                    />
                    <Text className="text-gray-500 mb-2 font-medium">Escribe un pie de foto...</Text>
                    <View className="h-24 bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
                        <TextInput
                            className="flex-1 text-base text-gray-800"
                            placeholder="Ej. ¡Paseando con Max por el parque! 🐶"
                            value={caption}
                            onChangeText={setCaption}
                            multiline
                        />
                    </View>

                    <View className="mt-auto">
                        <Text className="text-gray-700 font-bold mb-3">Compartir en:</Text>
                        <View className="flex-row justify-around mb-6">
                            <TouchableOpacity className="items-center opacity-100">
                                <View className="w-14 h-14 bg-pink-100 rounded-full items-center justify-center mb-1">
                                    <FontAwesome name="instagram" size={24} color="#E1306C" />
                                </View>
                                <Text className="text-xs text-brand-600 font-bold">Activo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="items-center opacity-40">
                                <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center mb-1">
                                    <FontAwesome name="share" size={24} color="black" />
                                </View>
                                <Text className="text-xs text-gray-500">TikTok</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="items-center opacity-40">
                                <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-1">
                                    <FontAwesome name="facebook-official" size={24} color="#1877F2" />
                                </View>
                                <Text className="text-xs text-gray-500">Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            className="bg-brand-500 rounded-xl py-4 items-center flex-row justify-center"
                            onPress={handleUpload}
                            disabled={isUploading}
                            style={{ opacity: isUploading ? 0.7 : 1 }}
                        >
                            {isUploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={20} color="white" />
                                    <Text className="text-white font-bold text-lg ml-2">Publicar Ahora</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 pt-16">
            <View className="px-6 mb-4">
                <Text className="text-3xl font-bold text-gray-800">PetSocial</Text>
                <Text className="text-gray-500 mt-1">Conecta y comparte las aventuras de tu mascota</Text>
            </View>

            <ScrollView className="flex-1">
                {/* Camara / Post Nueva Accion */}
                <View className="px-6 py-4">
                    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 items-center">
                        <View className="mb-4">
                            <View className="w-16 h-16 bg-brand-100 rounded-full items-center justify-center">
                                <Ionicons name="camera" size={32} color="#10b981" />
                            </View>
                        </View>
                        <Text className="text-xl font-bold text-gray-800 text-center">Crear Nueva Publicación</Text>
                        <Text className="text-gray-500 text-center mb-6 mt-2">
                            Toma una foto ahora mismo de tu mascota o elige una de tu galería.
                        </Text>

                        <View className="flex-row space-x-3 w-full">
                            <TouchableOpacity
                                className="flex-1 bg-brand-600 rounded-xl py-4 items-center flex-row justify-center space-x-2"
                                onPress={startCamera}
                            >
                                <Ionicons name="camera-outline" size={20} color="white" />
                                <Text className="text-white font-bold ml-2">Cámara</Text>
                            </TouchableOpacity>

                            <View className="w-4"></View>

                            <TouchableOpacity
                                className="flex-1 bg-gray-100 rounded-xl py-4 items-center flex-row justify-center space-x-2"
                                onPress={pickImage}
                            >
                                <Ionicons name="images-outline" size={20} color="#374151" />
                                <Text className="text-gray-700 font-bold ml-2">Galería</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Conexiones a Redes */}
                <View className="px-6 py-4 mb-8">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Mis Cuentas Vinculadas</Text>

                    {/* Instagram */}
                    <View className="bg-white p-4 rounded-xl flex-row items-center justify-between shadow-sm border border-gray-100 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
                                <FontAwesome name="instagram" size={20} color="#E1306C" />
                            </View>
                            <View>
                                <Text className="text-base font-bold text-gray-800">Instagram</Text>
                                <Text className="text-sm text-green-500 font-medium">@mi_perrito_max</Text>
                            </View>
                        </View>
                        <TouchableOpacity className="bg-gray-100 px-3 py-1.5 rounded-full">
                            <Text className="text-xs font-bold text-gray-600">Conectada</Text>
                        </TouchableOpacity>
                    </View>

                    {/* TikTok */}
                    <View className="bg-white p-4 rounded-xl flex-row items-center justify-between shadow-sm border border-gray-100 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                                <FontAwesome name="share" size={20} color="#000000" />
                            </View>
                            <View>
                                <Text className="text-base font-bold text-gray-800">TikTok</Text>
                                <Text className="text-sm text-gray-400">Sin vincular</Text>
                            </View>
                        </View>
                        <TouchableOpacity className="bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200">
                            <Text className="text-xs font-bold text-brand-600">Vincular</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Facebook */}
                    <View className="bg-white p-4 rounded-xl flex-row items-center justify-between shadow-sm border border-gray-100">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                                <FontAwesome name="facebook-official" size={20} color="#1877F2" />
                            </View>
                            <View>
                                <Text className="text-base font-bold text-gray-800">Facebook Page</Text>
                                <Text className="text-sm text-gray-400">Sin vincular</Text>
                            </View>
                        </View>
                        <TouchableOpacity className="bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200">
                            <Text className="text-xs font-bold text-brand-600">Vincular</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            </ScrollView>
        </View>
    );
}
