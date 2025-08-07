import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Metas({ navigation }) {
    const [inputValue, setInputValue] = useState('');
    const [inputTexto, setInputTexto] = useState('');
    const [inputIngreso, setInputIngreso] = useState('');
    const [fecha, setFecha] = useState(new Date());
    const [mostrarPicker, setMostrarPicker] = useState(false);
    const [fechaTemporal, setFechaTemporal] = useState(new Date());

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="leftcircleo" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.bienvenida}>
                    <Text style={styles.bienvenidatext}>Metas</Text>
                </View>
                <View style={styles.formulario}>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>¿Cuál es la meta</Text>
                            <TextInput
                                placeholder="Escribe un texto"
                                value={inputTexto}
                                onChangeText={setInputTexto}
                                style={styles.input}
                            />
                            <Text style={styles.label}>¿Cuánto vas a ingresar?</Text>
                            <TextInput
                                placeholder="¿Cuánto va a ingresar?"
                                value={inputIngreso}
                                onChangeText={setInputIngreso}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Cantidad</Text>
                            <TextInput
                                placeholder="Ingrese la cantidad"
                                value={inputValue}
                                onChangeText={setInputValue}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                            <Text style={styles.label}>Fecha</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setFechaTemporal(fecha);
                                    setMostrarPicker(true);
                                }}
                                style={[styles.input, styles.fechaInput]}
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: '#333' }}>{fecha.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            alert(`Cantidad: ${inputValue}, Descripción: ${inputTexto}, Ingreso: ${inputIngreso}, Fecha: ${fecha.toLocaleDateString()}`);
                            setInputValue('');
                            setInputTexto('');
                            setInputIngreso('');
                        }}
                        style={styles.boton}
                    >
                        <Text style={styles.botonTexto}>Agregar meta</Text>
                    </TouchableOpacity>
                </View>

                {/* Date Picker para Android en Modal, para iOS directo */}
                {Platform.OS === 'android' && mostrarPicker && (
                    <DateTimePicker
                        value={fecha}
                        mode="date"
                        display="calendar"
                        onChange={(event, selectedDate) => {
                            setMostrarPicker(false);
                            if (selectedDate) {
                                setFecha(selectedDate);
                            }
                        }}
                    />
                )}
                {Platform.OS === 'ios' && mostrarPicker && (
                    <View style={styles.iosPicker}>
                        <DateTimePicker
                            value={fechaTemporal}
                            mode="date"
                            display="spinner"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) setFechaTemporal(selectedDate);
                            }}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setFecha(fechaTemporal);
                                setMostrarPicker(false);
                            }}
                            style={{ marginTop: 10, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#007BFF', fontSize: 16 }}>Listo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMostrarPicker(false)}
                            style={{ marginTop: 10, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#FF3333', fontSize: 16 }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.tabla}>
                   <View>
                    
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
    formulario: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    col: {
        width: '48%',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        width: '100%',
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    fechaInput: {
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
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
    },
    tabla: {
        width: '90%',
        marginTop: 20,
        paddingHorizontal: 20,
        height: 350,
        borderRadius: 10,
        backgroundColor: '#f8f8f8',
    },
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 4,
    },
    modalContenido: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    iosPicker: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        margin: 20,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 4,
    },
});