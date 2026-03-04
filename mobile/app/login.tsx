import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    const [isAppleAvailable, setIsAppleAvailable] = useState(false);

    // Check Apple Auth availability
    useEffect(() => {
        if (Platform.OS === 'ios') {
            AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
        }
    }, []);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com',
        iosClientId: 'TU_IOS_CLIENT_ID.apps.googleusercontent.com',
        androidClientId: 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    });

    // Handle Google Login Response
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleSocialLoginToBackend('google', authentication.accessToken);
            }
        } else if (response?.type === 'error') {
            Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google');
        }
    }, [response]);

    const handleAppleLogin = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const fullName = credential.fullName?.givenName || credential.fullName?.familyName ?
                `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : undefined;

            handleSocialLoginToBackend('apple', credential.identityToken!, fullName);
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // Ignore cancelation
            } else {
                Alert.alert('Error', 'No se pudo iniciar sesión con Apple');
            }
        }
    };

    const handleSocialLoginToBackend = async (provider: 'google' | 'apple', token: string, fullName?: string) => {
        if (!token) return;
        try {
            setIsSocialLoading(true);
            const body: any = { provider, token };

            if (provider === 'apple' && fullName) {
                const [firstName, ...rest] = fullName.split(' ');
                body.firstName = firstName;
                body.lastName = rest.join(' ');
            }

            const res = await api.post('/mobile/social-login', body);

            const { token: appToken } = res.data;
            await SecureStore.setItemAsync('userToken', appToken);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.log(`${provider} backend login error:`, error);
            Alert.alert('Error', `No logramos sincronizar tu cuenta de ${provider === 'apple' ? 'Apple' : 'Google'}.`);
        } finally {
            setIsSocialLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) return;

        try {
            setIsLoading(true);
            // Petición a tu Next.js (el endpoint de mobile/login)
            const res = await api.post('/mobile/login', {
                email,
                password,
            });

            const { token, user } = res.data;

            // Guardar el token de acceso de forma súper segura en Keychain/Keystore
            await SecureStore.setItemAsync('userToken', token);

            // Redirigir al inicio de la app (tabs)
            router.replace('/(tabs)');

        } catch (error: any) {
            console.log('Login error:', error);
            Alert.alert(
                'Error',
                error?.response?.data?.error || 'Credenciales inválidas, intenta nuevamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <View className="items-center mb-10">
                <View className="w-20 h-20 bg-brand-50 rounded-full items-center justify-center mb-4">
                    <Ionicons name="paw" size={40} color="#10b981" />
                </View>
                <Text className="text-3xl font-bold text-gray-800 mb-2">
                    {t('auth.titleLogin') || 'Bienvenido de nuevo'}
                </Text>
                <Text className="text-base text-gray-500 text-center">
                    {t('auth.subtitleLogin') || 'Ingresa tus credenciales para continuar'}
                </Text>
            </View>

            <View className="space-y-4 gap-y-4">
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t('auth.labelEmail') || 'Correo Electrónico'}</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-2xl px-3 bg-gray-50 h-14">
                        <Ionicons name="mail-outline" size={20} color="#9ca3af" className="mr-2" />
                        <TextInput
                            className="flex-1 text-base text-gray-800 ml-2"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                </View>

                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t('auth.labelPass') || 'Contraseña'}</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-2xl px-3 bg-gray-50 h-14">
                        <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" className="mr-2" />
                        <TextInput
                            className="flex-1 text-base text-gray-800 ml-2"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                </View>

                <TouchableOpacity
                    className={`w-full bg-brand-500 rounded-2xl py-4 items-center mt-2 ${isLoading || isSocialLoading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={isLoading || isSocialLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {t('auth.btnLogin') || 'Ingresar'}
                        </Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row items-center my-4">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="max-w-[150px] text-center text-gray-400 font-medium px-4">O continuar con</Text>
                    <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* BOTÓN DE GOOGLE */}
                <TouchableOpacity
                    className={`w-full bg-white border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center shadow-sm ${(isLoading || isSocialLoading || !request) ? 'opacity-70' : ''}`}
                    onPress={() => promptAsync()}
                    disabled={isLoading || isSocialLoading || !request}
                >
                    {isSocialLoading ? (
                        <ActivityIndicator color="#10b981" />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={20} color="#EA4335" />
                            <Text className="text-gray-700 font-bold text-lg ml-3">
                                Continuar con Google
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* BOTÓN DE APPLE (SOLO DISPONIBLE EN IOS) */}
                {isAppleAvailable && (
                    <TouchableOpacity
                        className={`w-full bg-black rounded-2xl py-4 flex-row items-center justify-center shadow-sm mt-3 ${(isLoading || isSocialLoading) ? 'opacity-70' : ''}`}
                        onPress={handleAppleLogin}
                        disabled={isLoading || isSocialLoading}
                    >
                        {isSocialLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="logo-apple" size={20} color="#ffffff" />
                                <Text className="text-white font-bold text-lg ml-3">
                                    Continuar con Apple
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <TouchableOpacity className="mt-4 pb-10">
                    <Text className="text-center text-brand-600 font-bold">¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

