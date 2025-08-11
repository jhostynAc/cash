import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

// Importa Firebase
import { auth, db } from './firebase'; 
import { collection, addDoc, query, orderBy, where, onSnapshot } from 'firebase/firestore'; // ¡Añadimos 'where'!
import { onAuthStateChanged } from 'firebase/auth'; 

export default function Salidas({ navigation }) {
    const [inputValue, setInputValue] = useState(''); // Cantidad de la salida
    const [inputTexto, setInputTexto] = useState(''); // Descripción de la salida
    const [salidasList, setSalidasList] = useState([]); // Lista de salidas para mostrar (las del mes actual)
    const [loading, setLoading] = useState(false); // Estado de carga para el botón de agregar
    const [currentUserId, setCurrentUserId] = useState(null); // UID del usuario actual
    const [totalSalidas, setTotalSalidas] = useState(0); // Suma total de todas las salidas del mes

    // --- Helper para calcular el inicio y fin del mes actual ---
    const getMonthBounds = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed (0 para enero, 11 para diciembre)

        // Inicio del mes: primer día del mes actual, 00:00:00.000
        const startOfMonth = new Date(year, month, 1);
        // Fin del mes: último día del mes actual, 23:59:59.999
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); 
        
        return { startOfMonth, endOfMonth };
    };

    // --- Parte 1: Obtener el UID del usuario actual ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                // Si el usuario no está logueado, puedes redirigirlo
                // navigation.replace('Login'); 
            }
        });
        return () => unsubscribeAuth(); 
    }, []);

    // --- Parte 2: Escuchar cambios en las salidas del usuario (real-time) para el mes actual ---
    useEffect(() => {
        if (!currentUserId) {
            setSalidasList([]); // Limpia la lista si no hay usuario
            setTotalSalidas(0); // Reinicia el total
            return; 
        }

        const { startOfMonth, endOfMonth } = getMonthBounds();
        // *** Colección para 'salidas' ***
        const salidasCollectionRef = collection(db, 'users', currentUserId, 'salidas');
        
        let unsubscribeRecent = () => {}; 
        let unsubscribeTotal = () => {}; 

        // Listener 1: Consulta para obtener *todas* las salidas del mes actual, ordenadas por fecha descendente
        // *** Usamos 'where' para filtrar por rango de fechas ***
        const qCurrentMonth = query(
            salidasCollectionRef, 
            where('fecha', '>=', startOfMonth), 
            where('fecha', '<=', endOfMonth),   
            orderBy('fecha', 'desc')            
        );

        unsubscribeRecent = onSnapshot(qCurrentMonth, (snapshot) => { 
            const fetchedSalidas = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedSalidas.push({
                    id: doc.id,
                    ...data,
                    // Convierte el Timestamp de Firestore a un objeto Date y lo formatea
                    fecha: data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString('es-CO') : 'Fecha desconocida'
                });
            });
            setSalidasList(fetchedSalidas);
        }, (error) => {
            console.error("Error al obtener salidas del mes de Firestore:", error);
            Alert.alert("Error", "No se pudieron cargar tus salidas del mes. Inténtalo de nuevo.");
        });

        // Listener 2: Consulta para calcular el total acumulado de *todas* las salidas del mes actual
        // *** También aplicamos el filtro de fecha al total ***
        const qTotalCurrentMonth = query(
            salidasCollectionRef,
            where('fecha', '>=', startOfMonth),
            where('fecha', '<=', endOfMonth)
        ); 

        unsubscribeTotal = onSnapshot(qTotalCurrentMonth, (snapshot) => { 
            let sum = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                sum += parseFloat(data.cantidad || 0); 
            });
            setTotalSalidas(sum);
        }, (error) => {
            console.error("Error al calcular total de salidas del mes de Firestore:", error);
            Alert.alert("Error", "No se pudo calcular el total de tus salidas del mes. Inténtalo de nuevo.");
        });

        // Limpia AMBOS listeners de Firestore cuando el componente se desmonte o el UID cambie
        return () => {
            unsubscribeRecent();
            unsubscribeTotal();
        };
    }, [currentUserId]); // Este efecto se vuelve a ejecutar si el UID del usuario cambia

    // --- Parte 3: Función para guardar una nueva salida en Firestore ---
    const handleAddSalida = async () => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay un usuario logueado para registrar salidas.');
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
            // *** Colección para 'salidas' ***
            const addDocPromise = addDoc(collection(db, 'users', currentUserId, 'salidas'), {
                descripcion: inputTexto.trim(),
                cantidad: cantidad,
                fecha: new Date(), 
            });

            const TIMEOUT_DURATION = 15000; 
            const timeoutPromise = new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error('La operación de agregar salida tomó demasiado tiempo. Inténtalo de nuevo.'));
                }, TIMEOUT_DURATION);
            });

            await Promise.race([addDocPromise, timeoutPromise]);
            
            setLoading(false); 
            setTimeout(() => {
                Alert.alert('Éxito', 'Salida agregada correctamente.');
                setInputValue(''); 
                setInputTexto(''); 
            }, 0); 

        } catch (error) {
            console.error('Error al agregar salida (catch block):', error);
            let errorMessage = 'No se pudo agregar la salida. Inténtalo de nuevo.';
            if (error && typeof error === 'object' && error.message && error.message.includes('La operación de agregar salida tomó demasiado tiempo.')) {
                errorMessage = 'Problema de conexión: La operación tardó mucho. La salida podría haberse guardado. Revisa la tabla o intenta de nuevo.';
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
                    <Text style={styles.bienvenidatext}>Salidas</Text>
                </View>
                <View style={styles.valores}>
                    <Text style={styles.numero}>$</Text>
                    {/* Muestra el total de TODAS las salidas del mes, formateado a moneda local */}
                    <Text style={styles.numero}>{totalSalidas.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text> 
                </View>
                <View style={styles.formulario}>
                    <View style={styles.labelsRow}>
                        <Text style={styles.label}>Tipo de salida</Text> 
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
                        onPress={handleAddSalida} 
                        style={styles.boton}
                        disabled={loading} 
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" /> 
                        ) : (
                            <Text style={styles.botonTexto}>Agregar Salida</Text> 
                        )}
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.tabla}> 
                    <View style={styles.infos}>
                        <Text>Cantidad</Text>
                        <Text>Descripción</Text>
                        <Text>Fecha</Text> 
                    </View>
                    {salidasList.length > 0 ? (
                        salidasList.map((salida) => (
                            <View style={styles.info} key={salida.id}> 
                                <View style={styles.infoRow}>
                                    <Text>$</Text>
                                    <Text>{salida.cantidad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text>{salida.descripcion}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text>{salida.fecha}</Text> 
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No hay salidas para este mes.</Text>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView >
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
        backgroundColor: '#DC3545', 
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
