import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Usamos IP temporal si estamos en físico, o localhost/10.0.2.2 en simulador.
// Lo ideal es tener esta url como variable de entorno usando .env
const getBaseUrl = () => {
    // Cuando pruebes en dispositivo real, cambia esto por tu IP local de WiFi
    // Ej: "http://192.168.1.5:3000/api"
    const isDev = __DEV__;
    if (!isDev) return "https://localipet.com/api";

    // Asumiendo simulador de iOS (localhost) o Android (10.0.2.2)
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};

export const API_URL = getBaseUrl();

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el JWT (Bearer Token) a todas las peticiones protegidas
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error attaching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
