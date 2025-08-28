import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Platform, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePicker from '@react-native-community/datetimepicker';

// Importa Firebase
import { auth, db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Metas({ navigation }) {
    // --- Estados para el formulario de AÑADIR nueva meta ---
    const [inputTexto, setInputTexto] = useState(''); // Nombre de la meta
    const [inputValue, setInputValue] = useState(''); // Cantidad total de la meta
    const [inputAporteInicial, setInputAporteInicial] = useState(''); // Aporte inicial
    const [fecha, setFecha] = useState(new Date()); // Fecha límite de la meta

    // --- Estados para el DatePicker (PARA AÑADIR NUEVA META) ---
    const [mostrarPicker, setMostrarPicker] = useState(false); // controla el picker de "añadir meta"
    const [fechaTemporal, setFechaTemporal] = useState(new Date()); // Fecha temporal para el DatePicker

    // --- Estados generales de Firebase y UI ---
    const [loading, setLoading] = useState(false); // Estado de carga para el botón de AÑADIR
    const [currentUserId, setCurrentUserId] = useState(null); // UID del usuario actual
    const [metasList, setMetasList] = useState([]); // Lista de metas para mostrar

    // --- Estados para el MODAL de EDICIÓN ---
    const [showEditModal, setShowEditModal] = useState(false); // controla el modal principal de edición
    const [editingMetaId, setEditingMetaId] = useState(null); // ID de la meta que se está editando
    const [editNombre, setEditNombre] = useState(''); // Nombre en el formulario de edición
    const [editCantidad, setEditCantidad] = useState(''); // Cantidad en el formulario de edición
    const [editAporte, setEditAporte] = useState(''); // Aporte en el formulario de edición
    const [editFecha, setEditFecha] = useState(new Date()); // Fecha límite en el formulario de edición

    // --- Estados para el DatePicker (PARA EDITAR META) ---
    const [showEditDatePicker, setShowEditDatePicker] = useState(false); // controla el picker de "editar meta"
    const [editFechaTemporal, setEditFechaTemporal] = useState(new Date()); // Fecha temporal para el DatePicker de edición
    const [loadingEdit, setLoadingEdit] = useState(false); // Estado de carga para el botón de GUARDAR CAMBIOS

    // --- Parte 1: Obtener el UID del usuario actual ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                // Opcional: Redirigir al login si esta pantalla requiere que el usuario esté logueado
                // navigation.replace('Login');
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // --- Parte 2: Escuchar cambios en las metas del usuario (real-time) ---
    useEffect(() => {
        if (!currentUserId) {
            setMetasList([]);
            return;
        }

        const metasCollectionRef = collection(db, 'users', currentUserId, 'metas');
        // Consulta para obtener todas las metas, ordenadas por la fecha límite ascendente
        const q = query(metasCollectionRef, orderBy('fecha', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMetas = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // ** MEJORA: Aseguramos que 'fecha' siempre sea un objeto Date válido **
                // Usamos el operador de encadenamiento opcional para evitar errores si 'fecha' o 'toDate' no existen
                const metaFecha = data.fecha?.toDate ? data.fecha.toDate() : new Date();
                fetchedMetas.push({
                    id: doc.id,
                    nombre: data.nombre,
                    cantidad: parseFloat(data.cantidad || 0),
                    aporte: parseFloat(data.aporte || 0),
                    fecha: metaFecha, // Ya es un Date
                    fechaDisplay: metaFecha.toLocaleDateString('es-CO'),
                    cumplida: data.cumplida || false, // Campo 'cumplida', por defecto falso
                });
            });
            setMetasList(fetchedMetas);
        }, (error) => {
            console.error("Error al obtener metas de Firestore:", error);
            Alert.alert("Error", "No se pudieron cargar tus metas. Inténtalo de nuevo.");
        });

        return () => unsubscribe();
    }, [currentUserId]);

    // --- Función para agregar una nueva meta ---
    const handleAddMeta = async () => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay un usuario logueado para registrar metas.');
            return;
        }
        // Validaciones de los campos de entrada
        if (!inputTexto.trim() || !inputValue.trim()) {
            Alert.alert('Error', 'Por favor, completa el nombre de la meta y la cantidad total.');
            return;
        }
        const cantidadNumerica = parseFloat(inputValue.trim());
        const aporteInicialNumerico = parseFloat(inputAporteInicial.trim() || '0'); // Si está vacío, es 0

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

        setLoading(true); // Activa el estado de carga del botón

        try {
            const addDocPromise = addDoc(collection(db, 'users', currentUserId, 'metas'), {
                nombre: inputTexto.trim(),
                cantidad: cantidadNumerica,
                aporte: aporteInicialNumerico,
                fecha: fecha,
                creadoEn: new Date(),
                cumplida: false, // Por defecto, no cumplida al crear
            });

            // Promesa de timeout para evitar esperas infinitas
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

    // --- Funciones para ELIMINAR una meta ---
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

    // --- Funciones para EDITAR una meta (Modal) ---

    // Abre el modal de edición y carga los datos de la meta seleccionada
    const handleEditPress = (meta) => {
        console.log('handleEditPress llamado para meta:', meta.id); // Log para depuración
        console.log('Tipo de meta.fecha al abrir modal:', typeof meta.fecha, meta.fecha); // ¡CRUCIAL para depurar!

        // ** SOLUCIÓN: Aseguramos que 'meta.fecha' siempre sea un objeto Date **
        // Esto previene TypeErrors al llamar a .toLocaleDateString()
        const initialDate = (meta.fecha instanceof Date && !isNaN(meta.fecha)) ? meta.fecha : new Date(); // Fallback robusto

        setEditingMetaId(meta.id);
        setEditNombre(meta.nombre);
        setEditCantidad(meta.cantidad.toString());
        setEditAporte(meta.aporte.toString());
        setEditFecha(initialDate); // La fecha que se mostrará en el input de edición
        setEditFechaTemporal(initialDate); // La fecha inicial para el DatePicker de edición
        setShowEditModal(true);
    };

    // Guarda los cambios de la meta editada
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
                fecha: editFecha, // Este ya es un objeto Date, Firestore lo convertirá a Timestamp
            });

            setLoadingEdit(false);
            setShowEditModal(false); // Cierra el modal de edición
            Alert.alert('Éxito', 'Meta actualizada correctamente.');
        } catch (error) {
            console.error("Error al actualizar la meta:", error);
            Alert.alert("Error", "No se pudo actualizar la meta. Inténtalo de nuevo.");
            setLoadingEdit(false);
        }
    };

    // Cancela la edición y cierra el modal
    const handleCancelEdit = () => {
        setShowEditModal(false);
        setEditingMetaId(null);
    };

    // --- Función para marcar/desmarcar una meta como cumplida ---
    const handleToggleCumplida = async (metaId, currentStatus) => {
        if (!currentUserId) {
            Alert.alert('Error', 'No hay usuario autenticado para actualizar la meta.');
            return;
        }

        const newStatus = !currentStatus; // Cambia el estado actual (true a false, false a true)
        const confirmationMessage = newStatus ? "¿Marcar esta meta como CUMPLIDA?" : "¿Desmarcar esta meta como CUMPLIDA?";

        Alert.alert(
            "Confirmar Acción",
            confirmationMessage,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: newStatus ? "Marcar" : "Desmarcar",
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
                {/* Contenido principal de la pantalla */}
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="leftcircleo" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.bienvenida}>
                    <Text style={styles.bienvenidatext}>Metas</Text>
                </View>

                {/* Formulario para AÑADIR nueva meta */}
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
                            <Text style={styles.label}>Cantidad total de la meta</Text>
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
                                    console.log('Abriendo DatePicker (Añadir)'); // Log para depuración
                                    setFechaTemporal(fecha);
                                    setMostrarPicker(true);
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

                {/* --- METAS ACTUALES --- */}
                <ScrollView style={styles.tabla}>
                    <View style={styles.cuadros}>
                        {metasList.length > 0 ? (
                            metasList.map((meta) => (
                                <View style={styles.cuadroMeta} key={meta.id}>
                                    {/* Aplicar estilo condicional si la meta está cumplida */}
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
                                        {/* Botones siempre visibles */}
                                        <TouchableOpacity style={styles.btnEditar} onPress={() => handleEditPress(meta)}>
                                            <Text style={styles.btnAccionTexto}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.btnEliminar} onPress={() => handleDeleteMeta(meta.id)}>
                                            <Text style={styles.btnAccionTexto}>Eliminar</Text>
                                        </TouchableOpacity>

                                        {/* Botón de Cumplida/Desmarcar (condicional) */}
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

            {/* ==================================================================== */}
            {/* === MODALES DE NIVEL SUPERIOR (HERMANOS, NO ANIDADOS) === */}
            {/* ==================================================================== */}

            {/* Date Picker para AÑADIR (Android en Modal, iOS en View con styles.iosPicker) */}
            {/* Este ya estaba fuera del Modal de edición, lo dejamos como está */}
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
                                value={fechaTemporal}
                                mode="date"
                                // Usar 'calendar' para Android si quieres la vista de calendario
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
            {/* OJO: Este DatePicker de AÑADIR para iOS se muestra pegado al bottom, no como alerta */}
            {Platform.OS === 'ios' && mostrarPicker && (
                <View style={styles.iosPicker}>
                    <DateTimePicker
                        value={fechaTemporal}
                        mode="date"
                        // 'default' o 'spinner' para iOS
                        display={Platform.OS === 'ios' ? 'default' : 'spinner'}
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
            )}


            {/* --- MODAL PRINCIPAL DE EDICIÓN DE META --- */}
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
                                console.log('--- TAP EN FECHA EDITAR ---'); // << Este log seguirá apareciendo
                                console.log('Abriendo DatePicker (Editar)');
                                // ** SOLUCIÓN: Aseguramos que editFechaTemporal tenga el valor correcto **
                                setEditFechaTemporal(editFecha); // Pasamos la fecha actual de edición al picker temporal
                                console.log('editFecha al abrir picker:', editFecha, 'Tipo:', typeof editFecha); // Log de depuración
                                setShowEditDatePicker(true); // Esto activa el DatePicker en su propio modal
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
                    </View>
                </View>
            </Modal>

            {/* --- Date Picker para EDICIÓN --- */}
            {/* ¡¡¡Estos Modales de DatePicker son HERMANOS del Modal de edición principal!!! */}
            {/* Esto asegura que se superpongan a cualquier otro Modal si se abren */}

            {/* Log para verificar el estado de la visibilidad del modal del DatePicker de edición */}
            {console.log('ESTADO showEditDatePicker para iOS (Modal de edición fecha):', showEditDatePicker ? 'TRUE' : 'FALSE', 'Tipo:', typeof showEditDatePicker)}

            {/* DatePicker de EDICIÓN para Android */}
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
                                value={editFechaTemporal}
                                mode="date"
                                // Usar 'calendar' para Android si quieres la vista de calendario
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

            {/* ** DatePicker de EDICIÓN para iOS como ALERTA (Con Modal y estilo centrado) ** */}
            {/* Este Modal y su estilo `iosPickerEditCentered` son clave para el efecto de alerta. */}
            {/* Al ser un Modal separado, se superpone a tu Modal de edición principal. */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={showEditDatePicker}
                    transparent={true}
                    animationType="fade" // Puedes usar 'slide' o 'none' también
                    onRequestClose={() => setShowEditDatePicker(false)}
                >
                    <View style={styles.modalFondo}> {/* Este modalFondo asegura el oscurecimiento y centrado */}
                        <View style={styles.iosPickerEditCentered}> {/* <--- ¡ESTE ES EL CONTENEDOR DE TU ALERTA! */}
                            <DateTimePicker
                                value={editFechaTemporal}
                                mode="date"
                                display="spinner" // 'spinner' es el más común para iOS en alertas
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
        justifyContent: 'center', // Centra verticalmente a los hijos
        alignItems: 'center',     // Centra horizontalmente a los hijos
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
    // Estilo para el DatePicker de AÑADIR en iOS (el original que funciona)
    iosPicker: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        marginHorizontal: 20,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 50,
        zIndex: 1000,
        height: 250,
    },
    // --- ESTILO PARA EL DATEPICKER DE EDICIÓN EN IOS (Centrado como alerta) ---
    iosPickerEditCentered: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        width: '80%', // Ocupa el 80% del ancho del modalFondo para darle apariencia de alerta
        zIndex: 1000, // Asegura que esté por encima de otros elementos en la misma capa
        height: 250, // Mantener altura para el spinner
    },
});
