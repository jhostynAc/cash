import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Ingresos({ navigation }) {
    const [inputValue, setInputValue] = useState('');
    const [inputTexto, setInputTexto] = useState('');

    return (
        <SafeAreaView style={styles.safeArea}>{
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
                    <Text style={styles.numero}>10000</Text>

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
                        onPress={() => {
                            alert(`Ingresos: ${inputValue}, Descripción: ${inputTexto}`);
                            setInputValue('');
                            setInputTexto('');
                        }}
                        style={styles.boton}
                    >
                        <Text style={styles.botonTexto}>Agregar Ingreso</Text>
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
                            <Text>ingreso trabajo</Text>
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
        }</SafeAreaView >
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
    },
    boton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    botonTexto: {
        color: '#fff',
        fontSize: 16,
    }, labelsRow: {
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
    }

});
