import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Platform, Modal, Alert, ActivityIndicator, ScrollView, Keyboard } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Metas({ navigation }) {
    const [inputTexto, setInputTexto] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [inputAporteInicial, setInputAporteInicial] = useState('');
    const [fecha, setFecha] = useState(new Date());
    const [mostrarPicker, setMostrarPicker] = useState(false);
    const [fechaTemporal, setFechaTemporal] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [metasList, setMetasList] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMetaId, setEditingMetaId] = useState(null);
    const [editNombre, setEditNombre] = useState('');
    const [editCantidad, setEditCantidad] = useState('');
    const [editAporte, setEditAporte] = useState('');
    const [editFecha, setEditFecha] = useState(new Date());
    const [showEditDatePicker, setShowEditDatePicker] = useState(false);
    const [editFechaTemporal, setEditFechaTemporal] = useState(new Date());
    const [loadingEdit, setLoadingEdit] = useState(false);

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
            setMetasList([]);
            return;
        }
        const metasCollectionRef = collection(db, 'users', currentUserId, 'metas');
        const q = query(metasCollectionRef, orderBy('fecha', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMetas = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const metaFecha = data.fecha?.toDate ? data.fecha.toDate() : new Date();
                fetchedMetas.push({
                    id: doc.id,
                    nombre: data.nombre,
                    cantidad: parseFloat(data.cantidad || 0),
                    aporte: parseFloat(data.aporte || 0),
                    fecha: metaFecha,
                    fechaDisplay: metaFecha.toLocaleDateString('es-CO'),
                    cumplida: data.cumplida || false,
                });
            });
            setMetasList(fetchedMetas);
        }, (error) => {
            console.error("Error al obtener metas de Firestore:", error);
            Alert.alert("Error", "No se pudieron cargar tus metas. Inténtalo de nuevo.");
        });
        return () => unsubscribe();
    }, [currentUserId]);

    const handleAddMeta = async () => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay un usuario logueado para registrar metas.');
            return;
        }
        if (!inputTexto.trim() || !inputValue.trim()) {
            Alert.alert('Error', 'Por favor, completa el nombre de la meta y la cantidad total.');
            return;
        }
        const cantidadNumerica = parseFloat(inputValue.trim());
        const aporteInicialNumerico = parseFloat(inputAporteInicial.trim() || '0');
        if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
            Alert.alert('Error', 'La cantidad de la meta debe ser un número positivo.');
            return;
        }
        if (isNaN(aporteInicialNumerico) || aporteInicialNumerico < 0) {
            Alert.alert('Error', 'El aporte inicial debe ser un número válido o cero.');
            return;
        }
        if (aporteInicialNumerico > cantidadNumerica) {
            Alert.alert('Error', 'El aporte inicial no puede ser mayor que la cantidad total de la meta.');
            return;
        }
        setLoading(true);
        try {
            const addDocPromise = addDoc(collection(db, 'users', currentUserId, 'metas'), {
                nombre: inputTexto.trim(),
                cantidad: cantidadNumerica,
                aporte: aporteInicialNumerico,
                fecha: fecha,
                creadoEn: new Date(),
                cumplida: false,
            });
            const TIMEOUT_DURATION = 15000;
            const timeoutPromise = new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error('La operación de agregar meta tomó demasiado tiempo.'));
                }, TIMEOUT_DURATION);
            });
            await Promise.race([addDocPromise, timeoutPromise]);
            setLoading(false);
            setTimeout(() => {
                Alert.alert('Éxito', 'Meta agregada correctamente.');
                setInputTexto('');
                setInputValue('');
                setInputAporteInicial('');
                setFecha(new Date());
            }, 0);
        } catch (error) {
            console.error('Error al agregar meta (catch block):', error);
            let errorMessage = 'No se pudo agregar la meta. Inténtalo de nuevo.';
            if (error.message && error.message.includes('La operación de agregar meta tomó demasiado tiempo.')) {
                errorMessage = 'Problema de conexión: La operación tardó mucho. La meta podría haberse guardado. Revisa la tabla o intenta de nuevo.';
            }
            Alert.alert('Error', errorMessage);
            setLoading(false);
        }
    };

    const handleDeleteMeta = async (metaId) => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay usuario autenticado para eliminar la meta.');
            return;
        }
        Alert.alert(
            "Confirmar Eliminación",
            "¿Estás seguro de que quieres eliminar esta meta?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'users', currentUserId, 'metas', metaId));
                            Alert.alert('Éxito', 'Meta eliminada correctamente.');
                        } catch (error) {
                            console.error("Error al eliminar la meta:", error);
                            Alert.alert("Error", "No se pudo eliminar la meta. Inténtalo de nuevo.");
                        }
                    },
                    style: "destructive",
                },
            ],
            { cancelable: false }
        );
    };

    const handleEditPress = (meta) => {
        const initialDate = (meta.fecha instanceof Date && !isNaN(meta.fecha)) ? meta.fecha : new Date();
        setEditingMetaId(meta.id);
        setEditNombre(meta.nombre);
        setEditCantidad(meta.cantidad.toString());
        setEditAporte(meta.aporte.toString());
        setEditFecha(initialDate);
        setEditFechaTemporal(initialDate);
        setShowEditModal(true);
    };

    const handleUpdateMeta = async () => {
        if (!currentUserId || !editingMetaId) {
            Alert.alert('Error', 'No se pudo identificar la meta a editar.');
            return;
        }
        if (!editNombre.trim() || !editCantidad.trim()) {
            Alert.alert('Error', 'Por favor, completa el nombre de la meta y la cantidad total.');
            return;
        }
        const cantidadNumerica = parseFloat(editCantidad.trim());
        const aporteNumerico = parseFloat(editAporte.trim() || '0');
        if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
            Alert.alert('Error', 'La cantidad de la meta debe ser un número positivo.');
            return;
        }
        if (isNaN(aporteNumerico) || aporteNumerico < 0) {
            Alert.alert('Error', 'El aporte debe ser un número válido o cero.');
            return;
        }
        if (aporteNumerico > cantidadNumerica) {
            Alert.alert('Error', 'El aporte no puede ser mayor que la cantidad total de la meta.');
            return;
        }
        setLoadingEdit(true);
        try {
            await updateDoc(doc(db, 'users', currentUserId, 'metas', editingMetaId), {
                nombre: editNombre.trim(),
                cantidad: cantidadNumerica,
                aporte: aporteNumerico,
                fecha: editFecha,
            });
            setLoadingEdit(false);
            setShowEditModal(false);
            Alert.alert('Éxito', 'Meta actualizada correctamente.');
        } catch (error) {
            console.error("Error al actualizar la meta:", error);
            Alert.alert("Error", "No se pudo actualizar la meta. Inténtalo de nuevo.");
            setLoadingEdit(false);
        }
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
        setEditingMetaId(null);
        setShowEditDatePicker(false); 
    };

    const handleToggleCumplida = async (metaId, currentStatus) => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay usuario autenticado para actualizar la meta.');
            return;
        }
        const newStatus = !currentStatus;
        const confirmationMessage = newStatus ? "¿Marcar esta meta como CUMPLIDA?" : "¿Desmarcar esta meta como CUMPLIDA?";
        Alert.alert(
            "Confirmar Acción",
            confirmationMessage,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'users', currentUserId, 'metas', metaId), {
                                cumplida: newStatus,
                            });
                            Alert.alert('Éxito', `Meta ${newStatus ? 'marcada como cumplida' : 'desmarcada'}.`);
                        } catch (error) {
                            console.error("Error al actualizar estado de la meta:", error);
                            Alert.alert("Error", `No se pudo ${newStatus ? 'marcar' : 'desmarcar'} la meta.`);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="left-circle" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.bienvenida}>
                    <Text style={styles.bienvenidatext}>Metas</Text>
                </View>
                <View style={styles.formulario}>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Nombre de la meta</Text>
                            <TextInput
                                placeholder="Escribe un texto"
                                value={inputTexto}
                                onChangeText={setInputTexto}
                                style={styles.input}
                            />
                            <Text style={styles.label}>Aporte inicial (opcional)</Text>
                            <TextInput
                                placeholder="¿Cuánto aportarás ahora?"
                                value={inputAporteInicial}
                                onChangeText={setInputAporteInicial}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Meta a alcanzar</Text>
                            <TextInput
                                placeholder="Ingrese la cantidad total"
                                value={inputValue}
                                onChangeText={setInputValue}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                            <Text style={styles.label}>Fecha límite</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setFechaTemporal(fecha instanceof Date && !isNaN(fecha) ? fecha : new Date());
                                    Keyboard.dismiss(); 
                                    setTimeout(() => {
                                        setMostrarPicker(true);
                                    }, 100);
                                }}
                                style={[styles.input, styles.fechaInput]}
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: '#333' }}>{fecha.toLocaleDateString('es-CO')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleAddMeta}
                        style={styles.boton}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.botonTexto}>Agregar meta</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.tabla}>
                    <View style={styles.cuadros}>
                        {metasList.length > 0 ? (
                            metasList.map((meta) => (
                                <View style={styles.cuadroMeta} key={meta.id}>
                                    <View style={styles.filaMeta}>
                                        <Text style={styles.tituloBloque}>Nombre:</Text>
                                        <Text style={meta.cumplida ? styles.metaCumplidaText : null}>{meta.nombre}</Text>
                                    </View>
                                    <View style={styles.filaMeta}>
                                        <Text style={styles.tituloBloque}>Fecha límite:</Text>
                                        <Text style={meta.cumplida ? styles.metaCumplidaText : null}>{meta.fechaDisplay}</Text>
                                    </View>
                                    <View style={styles.filaMeta}>
                                        <Text style={styles.tituloBloque}>Meta Total:</Text>
                                        <Text style={meta.cumplida ? styles.metaCumplidaText : null}>
                                            ${meta.cantidad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    <View style={styles.filaMeta}>
                                        <Text style={styles.tituloBloque}>Aporte actual:</Text>
                                        <Text style={meta.cumplida ? styles.metaCumplidaText : null}>
                                            ${meta.aporte.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    <View style={styles.accionesMeta}>
                                        <TouchableOpacity style={styles.btnEditar} onPress={() => handleEditPress(meta)}>
                                            <Text style={styles.btnAccionTexto}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.btnEliminar} onPress={() => handleDeleteMeta(meta.id)}>
                                            <Text style={styles.btnAccionTexto}>Eliminar</Text>
                                        </TouchableOpacity>
                                        {meta.cumplida ? (
                                            <TouchableOpacity
                                                style={styles.btnDesmarcar}
                                                onPress={() => handleToggleCumplida(meta.id, true)}
                                            >
                                                <Text style={styles.btnAccionTexto}>Desmarcar</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.btnMarcarCumplida}
                                                onPress={() => handleToggleCumplida(meta.id, false)}
                                            >
                                                <Text style={styles.btnAccionTexto}>Cumplida</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No tienes metas registradas.</Text>
                        )}
                    </View>
                </ScrollView>
            </View>
            {Platform.OS === 'android' && (
                <Modal
                    visible={mostrarPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setMostrarPicker(false)}
                >
                    <View style={styles.modalFondo}>
                        <View style={styles.modalContenido}>
                            <DateTimePicker
                                value={(fechaTemporal instanceof Date && !isNaN(fechaTemporal)) ? fechaTemporal : new Date()}
                                mode="date"
                                display={Platform.OS === 'android' ? 'calendar' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) setFechaTemporal(selectedDate);
                                }}
                            />
                            <TouchableOpacity
                                onPress={() => { setFecha(fechaTemporal); setMostrarPicker(false); }}
                                style={styles.pickerButton}
                            ><Text style={{ color: '#007BFF', fontSize: 16 }}>Listo</Text></TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setMostrarPicker(false)}
                                style={styles.pickerButton}
                            ><Text style={{ color: '#FF3333', fontSize: 16 }}>Cancelar</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={mostrarPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setMostrarPicker(false)}
                >
                    <View style={styles.modalFondo}>
                        <View style={styles.iosPickerAddCentered}>
                            <DateTimePicker
                                value={(fechaTemporal instanceof Date && !isNaN(fechaTemporal)) ? fechaTemporal : new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) setFechaTemporal(selectedDate);
                                }}
                            />
                            <TouchableOpacity
                                onPress={() => { setFecha(fechaTemporal); setMostrarPicker(false); }}
                                style={styles.pickerButton}
                            ><Text style={{ color: '#007BFF', fontSize: 16 }}>Listo</Text></TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setMostrarPicker(false)}
                                style={styles.pickerButton}
                            ><Text style={{ color: '#FF3333', fontSize: 16 }}>Cancelar</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelEdit}
            >
                <View style={styles.modalFondo}>
                    <View style={styles.modalEditContenido}>
                        <Text style={styles.modalTitle}>Editar Meta</Text>
                        <Text style={styles.labelModal}>Nombre de la meta:</Text>
                        <TextInput
                            style={styles.inputModal}
                            value={editNombre}
                            onChangeText={setEditNombre}
                            placeholder="Nombre"
                        />
                        <Text style={styles.labelModal}>Cantidad total de la meta:</Text>
                        <TextInput
                            style={styles.inputModal}
                            value={editCantidad}
                            onChangeText={setEditCantidad}
                            keyboardType="numeric"
                            placeholder="Cantidad total"
                        />
                        <Text style={styles.labelModal}>Aporte actual:</Text>
                        <TextInput
                            style={styles.inputModal}
                            value={editAporte}
                            onChangeText={setEditAporte}
                            keyboardType="numeric"
                            placeholder="Aporte actual"
                        />
                        <Text style={styles.labelModal}>Fecha límite:</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setEditFechaTemporal(editFecha instanceof Date && !isNaN(editFecha) ? editFecha : new Date());
                                Keyboard.dismiss(); 
                                setTimeout(() => {
                                    setShowEditDatePicker(true);
                                }, 100); 
                            }}
                            style={[styles.inputModal, styles.fechaInputModal]}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: '#333' }}>{editFecha.toLocaleDateString('es-CO')}</Text>
                        </TouchableOpacity>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={handleUpdateMeta}
                                style={styles.botonModalGuardar}
                                disabled={loadingEdit}
                            >
                                {loadingEdit ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.botonTexto}>Guardar Cambios</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCancelEdit}
                                style={styles.botonModalCancelar}
                                disabled={loadingEdit}
                            >
                                <Text style={styles.botonTexto}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                        {Platform.OS === 'ios' && showEditDatePicker && (
                            <View style={styles.modalOverlayForDatePicker}>
                                <View style={styles.iosPickerEditCentered}>
                                    <DateTimePicker
                                        value={(editFechaTemporal instanceof Date && !isNaN(editFechaTemporal)) ? editFechaTemporal : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) setEditFechaTemporal(selectedDate);
                                        }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => { setEditFecha(editFechaTemporal); setShowEditDatePicker(false); }}
                                        style={styles.pickerButton}
                                    ><Text style={{ color: '#007BFF', fontSize: 16 }}>Listo</Text></TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setShowEditDatePicker(false)}
                                        style={styles.pickerButton}
                                    ><Text style={{ color: '#FF3333', fontSize: 16 }}>Cancelar</Text></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
            {Platform.OS === 'android' && (
                <Modal
                    visible={showEditDatePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowEditDatePicker(false)}
                >
                    <View style={styles.modalFondo}>
                        <View style={styles.modalContenido}>
                            <DateTimePicker
                                value={(editFechaTemporal instanceof Date && !isNaN(editFechaTemporal)) ? editFechaTemporal : new Date()}
                                mode="date"
                                display={Platform.OS === 'android' ? 'calendar' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) setEditFechaTemporal(selectedDate);
                                }}
                            />
                            <TouchableOpacity
                                onPress={() => { setEditFecha(editFechaTemporal); setShowEditDatePicker(false); }}
                                style={styles.pickerButton}
                            ><Text style={{ color: '#007BFF', fontSize: 16 }}>Listo</Text></TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowEditDatePicker(false)}
                                style={styles.pickerButton}
                            ><Text style={{ color: '#FF3333', fontSize: 16 }}>Cancelar</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
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
        marginBottom: 10,
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
        marginTop: 5,
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
    tabla: {
        width: '90%',
        marginTop: 20,
        minHeight: 200,
        borderRadius: 10,
        backgroundColor: '#f8f8f8',
        alignSelf: 'center',
        maxHeight: 350,
    },
    cuadros: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 10,
    },
    cuadroMeta: {
        width: '100%',
        backgroundColor: '#f4f8ff',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filaMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tituloBloque: {
        fontWeight: 'bold',
        marginRight: 10,
        color: '#555',
    },
    metaCumplidaText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    accionesMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 10,
        flexWrap: 'wrap',
    },
    btnEditar: {
        backgroundColor: '#007BFF',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 5,
    },
    btnEliminar: {
        backgroundColor: '#DC3545',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 5,
    },
    btnMarcarCumplida: {
        backgroundColor: '#28A745',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 5,
    },
    btnDesmarcar: {
        backgroundColor: '#FFC107',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 5,
    },
    btnAccionTexto: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContenido: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalEditContenido: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        position: 'relative',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    labelModal: {
        alignSelf: 'flex-start',
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    inputModal: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        width: '100%',
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    fechaInputModal: {
        justifyContent: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 15,
    },
    botonModalGuardar: {
        backgroundColor: '#28A745',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    botonModalCancelar: {
        backgroundColor: '#6C757D',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    pickerButton: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 5,
    },
    iosPickerAddCentered: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        width: '80%',
        zIndex: 1000, 
        height: 150, 
    },
    iosPickerEditCentered: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        width: '80%', 
        zIndex: 1000, 
        height: 150, 
    },
    modalOverlayForDatePicker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
});