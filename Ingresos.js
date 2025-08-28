import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { auth, db } from './firebase';
import { collection, addDoc, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Ingresos({ navigation }) {
    const [inputValue, setInputValue] = useState('');
    const [inputTexto, setInputTexto] = useState('');
    const [ingresosList, setIngresosList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [totalIngresos, setTotalIngresos] = useState(0);

    const getMonthBounds = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return { startOfMonth, endOfMonth };
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUserId) {
            setIngresosList([]);
            setTotalIngresos(0);
            return;
        }

        const { startOfMonth, endOfMonth } = getMonthBounds();
        const ingresosCollectionRef = collection(db, 'users', currentUserId, 'ingresos');

        let unsubscribeRecent = () => {};
        let unsubscribeTotal = () => {};

        const qCurrentMonth = query(
            ingresosCollectionRef,
            where('creadoEn', '>=', startOfMonth),
            where('creadoEn', '<=', endOfMonth),
            orderBy('creadoEn', 'desc')
        );

        unsubscribeRecent = onSnapshot(qCurrentMonth, (snapshot) => {
            const fetchedIngresos = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedIngresos.push({
                    id: doc.id,
                    ...data,
                    fecha: data.creadoEn?.toDate ? data.creadoEn.toDate().toLocaleDateString('es-CO') : 'Fecha desconocida'
                });
            });
            setIngresosList(fetchedIngresos);
        }, (error) => {
            console.error("Error al obtener ingresos del mes de Firestore:", error);
            Alert.alert("Error", "No se pudieron cargar tus ingresos del mes. Inténtalo de nuevo.");
        });

        const qTotalCurrentMonth = query(
            ingresosCollectionRef,
            where('creadoEn', '>=', startOfMonth),
            where('creadoEn', '<=', endOfMonth)
        );

        unsubscribeTotal = onSnapshot(qTotalCurrentMonth, (snapshot) => {
            let sum = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                sum += parseFloat(data.cantidad || 0);
            });
            setTotalIngresos(sum);
        }, (error) => {
            console.error("Error al calcular total de ingresos del mes de Firestore:", error);
            Alert.alert("Error", "No se pudo calcular el total de tus ingresos del mes. Inténtalo de nuevo.");
        });

        return () => {
            unsubscribeRecent();
            unsubscribeTotal();
        };
    }, [currentUserId]);

    const handleAddIngreso = async () => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay un usuario logueado para registrar ingresos.');
            return;
        }
        if (!inputTexto.trim() || !inputValue.trim()) {
            Alert.alert('Error', 'Por favor, ingresa una descripción y una cantidad.');
            return;
        }
        const cantidad = parseFloat(inputValue.trim());
        if (isNaN(cantidad) || cantidad <= 0) {
            Alert.alert('Error', 'La cantidad debe ser un número positivo.');
            return;
        }

        setLoading(true);

        try {
            const addDocPromise = addDoc(collection(db, 'users', currentUserId, 'ingresos'), {
                descripcion: inputTexto.trim(),
                cantidad: cantidad,
                creadoEn: new Date(),
            });

            const TIMEOUT_DURATION = 15000;
            const timeoutPromise = new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error('La operación de agregar ingreso tomó demasiado tiempo. Inténtalo de nuevo.'));
                }, TIMEOUT_DURATION);
            });

            await Promise.race([addDocPromise, timeoutPromise]);

            setLoading(false);
            setTimeout(() => {
                Alert.alert('Éxito', 'Ingreso agregado correctamente.');
                setInputValue('');
                setInputTexto('');
            }, 0);

        } catch (error) {
            console.error('Error al agregar ingreso (catch block):', error);
            let errorMessage = 'No se pudo agregar el ingreso. Inténtalo de nuevo.';
            if (error && typeof error === 'object' && error.message && error.message.includes('La operación de agregar ingreso tomó demasiado tiempo.')) {
                errorMessage = 'Problema de conexión: La operación tardó mucho. El ingreso podría haberse guardado. Revisa la tabla o intenta de nuevo.';
            }

            Alert.alert('Error', errorMessage);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="auto" />
            <View style={styles.container}>
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="leftcircleo" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.bienvenida}>
                    <Text style={styles.bienvenidatext}>Ingresos</Text>
                </View>
                <View style={styles.valores}>
                    <Text style={styles.numero}>$</Text>
                    <Text style={styles.numero}>{totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
                <View style={styles.formulario}>
                    <View style={styles.labelsRow}>
                        <Text style={styles.label}>Tipo de ingreso</Text>
                        <Text style={styles.label}>Cantidad</Text>
                    </View>
                    <View style={styles.inputsRow}>
                        <TextInput
                            placeholder="Escribe un texto"
                            value={inputTexto}
                            onChangeText={setInputTexto}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Ingrese la cantidad"
                            value={inputValue}
                            onChangeText={setInputValue}
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleAddIngreso}
                        style={styles.boton}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.botonTexto}>Agregar Ingreso</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.tabla}>
                    <View style={styles.infos}>
                        <Text>Cantidad</Text>
                        <Text>Descripción</Text>
                        <Text>Fecha</Text>
                    </View>
                    {ingresosList.length > 0 ? (
                        ingresosList.map((ingreso) => (
                            <View style={styles.info} key={ingreso.id}>
                                <View style={styles.infoRow}>
                                    <Text>$</Text>
                                    <Text>{ingreso.cantidad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text>{ingreso.descripcion}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text>{ingreso.fecha}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No hay ingresos para este mes.</Text>
                    )}
                </ScrollView>
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
        paddingBottom: 50,
        backgroundColor: '#fff',
        flex: 1,
    },
    nav: {
        alignItems: 'center',
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        height: 70,
    },
    bienvenida: {
        width: '100%',
        marginTop: 20,
        marginLeft: 20,
    },
    bienvenidatext: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
    },
    valores: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 100,
        marginTop: 20,
    },
    numero: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
        padding: 10,
    },
    formulario: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    inputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        width: '48%',
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    boton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    botonTexto: {
        color: '#fff',
        fontSize: 16,
    },
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 5,
    },
    label: {
        width: '48%',
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
    },
    tabla: {
        width: '90%',
        marginTop: 20,
        borderRadius: 10,
        backgroundColor: '#f8f8f8',
        alignSelf: 'center',
        maxHeight: 350,
    },
    infos: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
    },
    info: {
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
        width: '100%',
        justifyContent: 'space-between',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginTop: 10,
        backgroundColor: '#fff',
    },
    infoRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginHorizontal: 2,
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    }
});
