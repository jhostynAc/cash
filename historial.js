import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { auth, db } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Historial({ navigation }) {
    const [search, setSearch] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [combinedHistory, setCombinedHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);

    // useRef para mantener los datos más recientes de cada colección sin causar re-renders excesivos
    const dataSources = useRef({
        ingresos: [],
        salidas: [],
        metas: []
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                setLoading(false);
                Alert.alert("Error", "Necesitas iniciar sesión para ver el historial.");
                // Navegar al login si no hay usuario autenticado
                navigation.replace('Login'); 
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUserId) {
            setCombinedHistory([]);
            setFilteredHistory([]);
            return;
        }

        setLoading(true);

        // Función para actualizar la historia combinada después de cada snapshot
        const updateCombinedHistory = (newData, type) => {
            dataSources.current[type] = newData;
            const allData = [
                ...dataSources.current.ingresos,
                ...dataSources.current.salidas,
                ...dataSources.current.metas
            ];
            // Ordenar por fecha (más reciente primero)
            allData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setCombinedHistory(allData);
            setLoading(false);
        };

        // Escucha en tiempo real para ingresos
        const unsubscribeIncome = onSnapshot(
            query(collection(db, 'users', currentUserId, 'ingresos'), orderBy('creadoEn', 'desc')),
            (snapshot) => {
                const incomes = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        type: 'ingreso',
                        // Solución: Aseguramos que 'descripcion' siempre exista para los ingresos
                        // Usamos la que viene de Firestore, o una categoría, o un texto por defecto
                        descripcion: data.descripcion || data.categoria || 'Ingreso General', 
                        cantidad: parseFloat(data.cantidad || 0), // Almacenamos la cantidad numérica para la búsqueda numérica
                        ...data, // Incluimos el resto de los datos originales
                        timestamp: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(),
                        displayAmount: `+$${parseFloat(data.cantidad || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    };
                });
                updateCombinedHistory(incomes, 'ingresos');
            },
            (error) => {
                console.error("Error al obtener ingresos:", error);
                Alert.alert("Error", "No se pudieron cargar los ingresos.");
                setLoading(false);
            }
        );

        // Escucha en tiempo real para salidas
        const unsubscribeOutcome = onSnapshot(
            query(collection(db, 'users', currentUserId, 'salidas'), orderBy('creadoEn', 'desc')),
            (snapshot) => {
                const outcomes = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        type: 'salida',
                        descripcion: data.descripcion || data.categoria || 'Gasto General', // También aseguramos descripción
                        cantidad: parseFloat(data.cantidad || 0), // Almacenamos la cantidad numérica
                        ...data,
                        timestamp: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(),
                        displayAmount: `-$${parseFloat(data.cantidad || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    };
                });
                updateCombinedHistory(outcomes, 'salidas');
            },
            (error) => {
                console.error("Error al obtener salidas:", error);
                Alert.alert("Error", "No se pudieron cargar las salidas.");
                setLoading(false);
            }
        );

        // Escucha en tiempo real para metas
        const unsubscribeGoals = onSnapshot(
            query(collection(db, 'users', currentUserId, 'metas'), orderBy('creadoEn', 'desc')),
            (snapshot) => {
                const goals = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        type: 'meta',
                        // Solución: Usamos el nombre de la meta como descripción para la búsqueda
                        descripcion: `Meta: ${data.nombre || 'Sin nombre'}`,
                        cantidad: parseFloat(data.aporte || 0), // Las metas se registran con 'aporte'
                        ...data,
                        timestamp: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(),
                        displayAmount: `$${parseFloat(data.aporte || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Meta)`,
                    };
                });
                updateCombinedHistory(goals, 'metas');
            },
            (error) => {
                console.error("Error al obtener metas:", error);
                Alert.alert("Error", "No se pudieron cargar las metas.");
                setLoading(false);
            }
        );

        return () => {
            unsubscribeIncome();
            unsubscribeOutcome();
            unsubscribeGoals();
        };
    }, [currentUserId]);

    // Efecto para filtrar la historia cuando el término de búsqueda o la historia combinada cambian
    useEffect(() => {
        if (search.trim() === '') {
            setFilteredHistory(combinedHistory);
        } else {
            const lowercasedSearch = search.toLowerCase();
            
            // Intentamos parsear el término de búsqueda como un número para comparaciones numéricas
            // Reemplazamos la coma por el punto para manejar ambos separadores decimales comunes
            const searchNumeric = parseFloat(lowercasedSearch.replace(',', '.'));
            const isNumericSearch = !isNaN(searchNumeric); // Bandera para saber si la búsqueda es numérica

            const filtered = combinedHistory.filter(item => {
                // Ahora, 'item.descripcion' siempre estará disponible y será el valor a buscar
                const itemDescription = (item.descripcion || '').toLowerCase();
                
                // Búsqueda en la cadena del monto ya formateado (ej. "+$1.234,56")
                const formattedAmountText = (item.displayAmount || '').toLowerCase();

                // Coincidencia de la descripción, del monto formateado, o del monto numérico crudo
                const descriptionMatch = itemDescription.includes(lowercasedSearch);
                const formattedAmountMatch = formattedAmountText.includes(lowercasedSearch);
                
                // Coincidencia numérica: solo si el término de búsqueda es un número válido y coincide con la cantidad numérica del ítem
                const rawAmountMatch = isNumericSearch && item.cantidad !== undefined && item.cantidad === searchNumeric;

                return descriptionMatch || formattedAmountMatch || rawAmountMatch;
            });
            setFilteredHistory(filtered);
        }
    }, [combinedHistory, search]);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('es-CO', options);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.loadingContainer]}>
                    <ActivityIndicator size="large" color="#007BFF" />
                    <Text style={{ marginTop: 10 }}>Cargando historial...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="auto" />
            <View style={styles.container}>
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="left-circle" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.bienvenida}>
                    <Text style={styles.bienvenidatext}>Historial</Text>
                </View>
                <View style={styles.barraBusquedaContenedor}>
                    <TextInput
                        style={styles.barraBusqueda}
                        placeholder="Buscar..."
                        value={search}
                        onChangeText={setSearch}
                    />
                    <TouchableOpacity
                        style={styles.botonBuscar}
                        onPress={() => {}} // Este botón no necesita acción si onChangeText ya filtra
                    >
                        <AntDesign name="search" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.tabla}>
                    <View style={styles.infos}>
                        <Text style={styles.headerText}>Tipo</Text>
                        <Text style={styles.headerText}>Cantidad</Text>
                        <Text style={styles.headerText}>Descripción</Text>
                        <Text style={styles.headerText}>Fecha</Text>
                    </View>
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                            <View 
                                key={item.id} 
                                // Usamos item.type para aplicar los estilos de fondo
                                style={[
                                    styles.info, 
                                    item.type === 'ingreso' ? styles.ingresoBackground : 
                                    item.type === 'salida' ? styles.salidaBackground : 
                                    styles.metaBackground
                                ]}
                            >
                                <Text style={styles.itemText}>{item.type === 'ingreso' ? 'Ingreso' : item.type === 'salida' ? 'Salida' : 'Meta'}</Text>
                                <Text style={[styles.itemText, item.type === 'ingreso' ? styles.ingresoColor : styles.salidaColor]}>
                                    {item.displayAmount}
                                </Text>
                                {/* Ahora item.descripcion contiene la descripción correcta para todos */}
                                <Text style={styles.itemText}>{item.descripcion}</Text>
                                <Text style={styles.itemText}>{formatDate(item.timestamp)}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No hay datos en el historial para mostrar.</Text>
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
        flex: 1,
        alignItems: 'center',
        paddingBottom: 50,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
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
    barraBusquedaContenedor: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    barraBusqueda: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    botonBuscar: {
        marginLeft: 8,
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 8,
        justifyContent: 'center',
    },
    tabla: {
        width: '90%',
        marginTop: 20,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#f8f8f8',
        flex: 1,
    },
    infos: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 5,
    },
    headerText: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
    },
    info: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 8,
        borderColor: '#e0e0e0',
    },
    itemText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        color: '#333',
    },
    ingresoColor: {
        color: '#28a745',
        fontWeight: 'bold',
    },
    salidaColor: {
        color: '#dc3545',
        fontWeight: 'bold',
    },
    ingresoBackground: {
        backgroundColor: '#e6ffe6',
    },
    salidaBackground: {
        backgroundColor: '#ffe6e6',
    },
    metaBackground: {
        backgroundColor: '#e6f2ff',
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
        fontSize: 16,
    },
});
