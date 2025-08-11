import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { auth, db } from './firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';

export default function Login({ navigation }) {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!usuario || !contrasena) {
            Alert.alert('Error', 'Por favor, ingresa tu correo y contraseña.');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, usuario, contrasena);
            const user = userCredential.user;
            Alert.alert('Éxito', `¡Bienvenido de nuevo, ${user.email}!`);
            console.log('Usuario ha iniciado sesión:', user.email);
            navigation.navigate('Principal');
        } catch (error) {
            let errorMessage = 'Ocurrió un error inesperado al iniciar sesión. Inténtalo de nuevo.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Correo electrónico o contraseña incorrectos.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'El formato del correo electrónico no es válido.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Has realizado demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
            }
            Alert.alert('Error de Inicio de Sesión', errorMessage);
            console.error('Detalle del error de Firebase:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="auto" />
            <View style={styles.nav}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Cash$</Text>
            </View>
            <View style={styles.container}>
                <View style={styles.cuadroFormulario}>
                    <Text style={styles.titulo}>Inicio de sesión</Text>
                    <View style={styles.formulario}>
                        <Text style={styles.label}>Usuario</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Correo Electrónico"
                            value={usuario}
                            onChangeText={setUsuario}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            value={contrasena}
                            onChangeText={setContrasena}
                            secureTextEntry
                        />
                        <TouchableOpacity
                            style={styles.boton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.botonTexto}>
                                {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => Alert.alert('Funcionalidad en desarrollo', 'Pronto podrás recuperar tu contraseña.')}>
                            <Text style={styles.textoLink}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('registro')}>
                            <Text style={styles.textoLink}>Registrarse</Text>
                        </TouchableOpacity>
                    </View>
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 50,
        backgroundColor: '#fff',
        flex: 1,
    },
    nav: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        height: 70,
        justifyContent: 'flex-start',
    },
    cuadroFormulario: {
        width: '85%',
        backgroundColor: '#f4f8ff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center',
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    formulario: {
        width: '100%',
    },
    label: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 15,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    boton: {
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    botonTexto: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    textoLink: {
        color: '#007BFF',
        textAlign: 'center',
        marginTop: 15,
        textDecorationLine: 'underline',
        fontSize: 15,
    },
});
