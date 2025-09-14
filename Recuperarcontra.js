import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign'; 
import { sendPasswordResetEmail } from 'firebase/auth'; 
import { auth } from './firebase'; 

export default function Recuperarcontra({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor, ingresa tu correo electrónico.');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                'Correo Enviado',
                'Se ha enviado un correo electrónico a tu dirección para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.',
                [{ text: 'OK', onPress: () => navigation.goBack() }] 
            );
        } catch (error) {
            console.error('Error al enviar correo de restablecimiento:', error.code, error.message);
            let errorMessage = 'Ocurrió un error al intentar restablecer la contraseña. Inténtalo de nuevo.';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'El formato del correo electrónico es inválido.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No existe un usuario con este correo electrónico.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Hemos bloqueado todas las solicitudes de este dispositivo debido a una actividad inusual. Intenta de nuevo más tarde.';
                    break;
                default:
                    errorMessage = `Error: ${error.message}`;
                    break;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="left-circle" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.header}>
                    <Text style={styles.title}>Restablecer Contraseña</Text>
                    <Text style={styles.subtitle}>
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Correo electrónico"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handlePasswordReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Enviar enlace</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    nav: {
        width: '100%',
        paddingTop: 20, 
        alignItems: 'flex-start',
    },
    header: {
        width: '100%',
        marginTop: 40,
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        width: '100%',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007BFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
