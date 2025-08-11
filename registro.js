import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';

import { auth, db } from './firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';

export default function Registro({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!nombre || !apellidos || !correo || !contrasena) {
            Alert.alert('Error', 'Por favor, completa todos los campos.');
            return;
        }
        if (contrasena.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true); 
        console.log('Inicio de handleRegister. Loading puesto a true.'); 

        try {
            console.log('Intentando crear usuario en Firebase Authentication...'); 
            const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
            const user = userCredential.user;
            console.log('Usuario registrado exitosamente en Auth:', user.email, 'UID:', user.uid); 
            
            console.log('Intentando guardar datos de usuario en Cloud Firestore para UID:', user.uid); 
            
            const writePromise = setDoc(doc(db, 'usuarios', user.uid), {
                nombre: nombre,
                apellidos: apellidos,
                correo: correo,
                createdAt: new Date(),
            });

            const TIMEOUT_DURATION = 30000; 
            const timeoutPromise = new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error('La operación de guardado de datos tomó demasiado tiempo. Inténtalo de nuevo.'));
                }, TIMEOUT_DURATION);
            });

            await Promise.race([writePromise, timeoutPromise]);
            
            console.log('Datos de usuario guardados exitosamente en Firestore para UID:', user.uid); 
            setLoading(false); 
            console.log('Preparando para mostrar alerta de éxito...'); 

            Alert.alert(
                'Éxito', 
                `¡Bienvenido, ${nombre}! Tu cuenta ha sido creada. Ahora puedes iniciar sesión.`, 
                [ 
                    {
                        text: 'OK', 
                        onPress: () => {
                            console.log('Usuario presionó OK en la alerta. Navegando a Login...'); 
                            navigation.navigate('Login'); 
                        }
                    }
                ] 
            );
            console.log('Alerta de éxito invocada.');

        } catch (error) { 
            console.error('Error en el proceso de registro (catch block):', error); 
            let errorMessage = 'Ocurrió un error inesperado al registrarse. Inténtalo de nuevo.';

            if (error && typeof error === 'object' && error.code) { 
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'El correo electrónico ya está registrado.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'El formato del correo electrónico no es válido.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'La contraseña es demasiado débil (debe tener al menos 6 caracteres).';
                } 
            }
            if (error && typeof error === 'object' && error.message && error.message.includes('La operación de guardado de datos tomó demasiado tiempo.')) {
                errorMessage = 'Problema de conexión: Los datos tardaron mucho en guardarse. Tu cuenta puede haberse creado, pero intenta iniciar sesión en un momento.';
            }

            console.log('Preparando para mostrar alerta de error...'); 
            Alert.alert('Error de Registro', errorMessage);
            console.error('Detalle del error de Firebase (para depuración):', error); 
            console.log('Alerta de error invocada.'); 

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
                    <Text style={styles.titulo}>Registro</Text>
                    <View style={styles.formulario}>
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={nombre}
                            onChangeText={setNombre}
                        />
                        <Text style={styles.label}>Apellidos</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Apellidos"
                            value={apellidos}
                            onChangeText={setApellidos}
                        />
                        <Text style={styles.label}>Correo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Correo"
                            value={correo}
                            onChangeText={setCorreo}
                            autoCapitalize="none"
                            keyboardType="email-address"
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
                            onPress={handleRegister}
                            disabled={loading} 
                        >
                            <Text style={styles.botonTexto}>
                                {loading ? 'Registrando...' : 'Registrarse'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.textoLink}>¿Ya tienes cuenta? Inicia sesión</Text>
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
    nav: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        height: 70,
        justifyContent: 'flex-start',
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 50,
        backgroundColor: '#fff',
        flex: 1,
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
