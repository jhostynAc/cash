import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                setLoading(false);
                Alert.alert("Error", "Necesitas iniciar sesión para ver el historial.");
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

        const unsubscribeIncome = onSnapshot(
            query(collection(db, 'users', currentUserId, 'ingresos'), orderBy('creadoEn', 'desc')),
            (snapshot) => {
                const incomes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'ingreso',
                    ...doc.data(),
                    timestamp: doc.data().creadoEn?.toDate ? doc.data().creadoEn.toDate() : new Date(),
                    displayAmount: `+$${parseFloat(doc.data().cantidad || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                }));
                updateCombinedHistory(incomes, 'ingresos');
            },
            (error) => {
                console.error("Error al obtener ingresos:", error);
                Alert.alert("Error", "No se pudieron cargar los ingresos.");
                setLoading(false);
            }
        );

        const unsubscribeOutcome = onSnapshot(
            query(collection(db, 'users', currentUserId, 'salidas'), orderBy('creadoEn', 'desc')),
            (snapshot) => {
                const outcomes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'salida',
                    ...doc.data(),
                    timestamp: doc.data().creadoEn?.toDate ? doc.data().creadoEn.toDate() : new Date(),
                    displayAmount: `-$${parseFloat(doc.data().cantidad || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                }));
                updateCombinedHistory(outcomes, 'salidas');
            },
            (error) => {
                console.error("Error al obtener salidas:", error);
                Alert.alert("Error", "No se pudieron cargar las salidas.");
                setLoading(false);
            }
        );

        const unsubscribeGoals = onSnapshot(
            query(collection(db, 'users', currentUserId, 'metas'), orderBy('creadoEn', 'desc')),
            (snapshot) => {
                const goals = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'meta',
                    ...doc.data(),
                    timestamp: doc.data().creadoEn?.toDate ? doc.data().creadoEn.toDate() : new Date(),
                    displayAmount: `$${parseFloat(doc.data().cantidad || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Meta)`,
                    displayDescription: `Meta: ${doc.data().nombre || 'Sin nombre'}`,
                }));
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

    const dataSources = React.useRef({
        ingresos: [],
        salidas: [],
        metas: []
    });

    const updateCombinedHistory = (newData, type) => {
        dataSources.current[type] = newData;
        const allData = [
            ...dataSources.current.ingresos,
            ...dataSources.current.salidas,
            ...dataSources.current.metas
        ];
        allData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setCombinedHistory(allData);
        setLoading(false);
    };

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredHistory(combinedHistory);
        } else {
            const lowercasedSearch = search.toLowerCase();
            const filtered = combinedHistory.filter(item => {
                const description = item.type === 'meta' ? item.displayDescription : (item.descripcion || '').toLowerCase();
                const amount = item.displayAmount || '';
                const name = item.nombre || '';
                return description.includes(lowercasedSearch) ||
                       amount.includes(lowercasedSearch) ||
                       name.toLowerCase().includes(lowercasedSearch);
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
                        <AntDesign name="leftcircleo" size={30} color="black" />
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
                        onPress={() => {}}
                    >
                        <AntDesign name="search1" size={20} color="#fff" />
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
                            <View key={item.id} style={[styles.info, item.type === 'ingreso' ? styles.ingresoBackground : item.type === 'salida' ? styles.salidaBackground : styles.metaBackground]}>
                                <Text style={styles.itemText}>{item.type === 'ingreso' ? 'Ingreso' : item.type === 'salida' ? 'Salida' : 'Meta'}</Text>
                                <Text style={[styles.itemText, item.type === 'ingreso' ? styles.ingresoColor : styles.salidaColor]}>
                                    {item.displayAmount}
                                </Text>
                                <Text style={styles.itemText}>
                                    {item.type === 'meta' ? item.displayDescription : item.descripcion}
                                </Text>
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
