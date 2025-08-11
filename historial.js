import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Historial({ navigation }) {
    const [search, setSearch] = useState('');

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
                        onPress={() => {
                            alert('Buscar: ' + search);
                        }}
                    >
                        <AntDesign name="search1" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.tabla}>
                    <View style={styles.infos}>
                        <Text>Cantidad</Text>
                        <Text>Descripción</Text>
                    </View>
                    <View style={styles.info}>
                        <View style={styles.infoRow}>
                            <Text>$</Text>
                            <Text>1000</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text>salida comida</Text>
                        </View>
                    </View>
                    <View style={styles.info}>
                        <View style={styles.infoRow}>
                            <Text>$</Text>
                            <Text>1000</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text>ingreso trabajo</Text>
                        </View>
                    </View><View style={styles.info}>
                        <View style={styles.infoRow}>
                            <Text>$</Text>
                            <Text>1000</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text>ingreso trabajo</Text>
                        </View>
                    </View><View style={styles.info}>
                        <View style={styles.infoRow}>
                            <Text>$</Text>
                            <Text>1000</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text>ingreso trabajo</Text>
                        </View>
                    </View>
                </View>
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
        justifyContent: 'center',
        paddingBottom: 50,
        backgroundColor: '#fff',
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
    tabla: {
        width: '90%',
        marginTop: 20,
        paddingHorizontal: 20,
        height: 350,
        borderRadius: 10,
        backgroundColor: '#f8f8f8',
    },
    infos: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    info: {
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
        width: '100%',
        justifyContent: 'space-between',
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 10,
    },
    infoRow: {
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
    },
    barraBusqueda: {
        width: '90%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 10,
        marginBottom: 10,
        alignSelf: 'center',
        backgroundColor: '#fff',
        marginTop: 20,
    }, barraBusquedaContenedor: {
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
    }
});
