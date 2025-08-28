import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'; 
import Ingresos from './Ingresos';
import Salidas from './Salidas';
import Metas from './Metas';
import Historial from './historial';
import LoginScreen from './login';
import RegistroScreen from './registro';
import PasswordResetScreen from './PasswordResetScreen';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007BFF" />
      <Text style={styles.loadingText}>Verificando sesión...</Text>
    </View>
  );
}

function Principal({ navigation }) {
  const [userName, setUserName] = useState('...');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const getMonthBounds = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); 
    return { startOfMonth, endOfMonth };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      const userDocRef = doc(db, 'usuarios', user.uid);
      getDoc(userDocRef)
        .then(userDoc => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData && userData.nombre) {
              setUserName(userData.nombre);
            } else {
              setUserName(user.email ? user.email.split('@')[0] : 'Usuario');
            }
          } else {
            setUserName(user.email ? user.email.split('@')[0] : 'Usuario');
          }
        })
        .catch(error => {
          setUserName(user.email ? user.email.split('@')[0] : 'Usuario');
        });
    } else {
      setUserName('Invitado');
      setCurrentUserId(null); 
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setChartData([]);
      setLoadingChart(false);
      return;
    }

    setLoadingChart(true);
    const { startOfMonth, endOfMonth } = getMonthBounds();

    let totalIngresos = 0;
    let totalSalidas = 0;
    let totalMetasAporte = 0; 

    let incomesLoaded = false;
    let expensesLoaded = false;
    let goalsLoaded = false;

    const updateChart = () => {
      if (incomesLoaded && expensesLoaded && goalsLoaded) {
        const newChartData = [];
        const grandTotal = totalIngresos + totalSalidas + totalMetasAporte;

        if (grandTotal > 0) {
            if (totalSalidas > 0) {
                newChartData.push({ name: `Salidas `, population: totalSalidas, color: '#FFB3B3', legendFontColor: 'black', legendFontSize: 15 });
            }
            if (totalMetasAporte > 0) { 
                newChartData.push({ name: `Metas`, population: totalMetasAporte, color: '#B3D9FF', legendFontColor: 'black', legendFontSize: 15 });
            }
            if (totalIngresos > 0) {
                newChartData.push({ name: `Ingresos `, population: totalIngresos, color: '#B3FFB3', legendFontColor: 'black', legendFontSize: 15 });
            }
        }
        setChartData(newChartData);
        setLoadingChart(false);
      }
    };

    const unsubscribeIngresos = onSnapshot(
      query(collection(db, 'users', currentUserId, 'ingresos'), where('creadoEn', '>=', startOfMonth), where('creadoEn', '<=', endOfMonth)),
      (snapshot) => {
        let sum = 0;
        snapshot.forEach(doc => { sum += parseFloat(doc.data().cantidad || 0); });
        totalIngresos = sum;
        incomesLoaded = true; 
        updateChart(); 
      },
      (error) => { incomesLoaded = true; updateChart(); }
    );

    const unsubscribeSalidas = onSnapshot(
      query(collection(db, 'users', currentUserId, 'salidas'), where('creadoEn', '>=', startOfMonth), where('creadoEn', '<=', endOfMonth)),
      (snapshot) => {
        let sum = 0;
        snapshot.forEach(doc => { sum += parseFloat(doc.data().cantidad || 0); });
        totalSalidas = sum;
        expensesLoaded = true; 
        updateChart(); 
      },
      (error) => { expensesLoaded = true; updateChart(); }
    );

    const unsubscribeMetas = onSnapshot(
      query(collection(db, 'users', currentUserId, 'metas')),
      (snapshot) => {
        let sum = 0;
        snapshot.forEach(doc => { sum += parseFloat(doc.data().aporte || 0); });
        totalMetasAporte = sum;
        goalsLoaded = true; 
        updateChart(); 
      },
      (error) => { goalsLoaded = true; updateChart(); }
    );

    return () => {
      unsubscribeIngresos();
      unsubscribeSalidas();
      unsubscribeMetas();
    };
  }, [currentUserId]); 

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar tu sesión?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Sí, cerrar sesión",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.nav}>
          <Text style={styles.appTitle}>Cash</Text>
          <TouchableOpacity onPress={handleLogout}> 
            <MaterialIcons name="logout" size={30} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.bienvenida}>
          <Text style={styles.bienvenidatext}>¡Hola, {userName}!</Text>
        </View>
        <View style={styles.textoapoyo}>
          <Text>Resumen financiero:</Text>
        </View>
        <View style={styles.grafica}>
          {loadingChart ? (
            <View style={styles.loadingChartContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={styles.loadingChartText}>Cargando datos del gráfico...</Text>
            </View>
          ) : chartData.length > 0 ? (
            <PieChart
              data={chartData} 
              width={Dimensions.get('window').width}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population" 
              backgroundColor="transparent"
              paddingLeft="15"
              absolute={false} 
            />
          ) : (
            <View style={styles.noDataChartContainer}>
              <Text style={styles.noDataChartText}>No hay datos financieros para el gráfico.</Text> 
            </View>
          )}
        </View>
        <View style={styles.Containerrect}>
          <TouchableOpacity style={styles.rectangulo} onPress={() => navigation.navigate('Ingresos')}>
            <FontAwesome5 name="money-bill-wave" size={24} color="black" />
            <Text>Ingresos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rectangulo} onPress={() => navigation.navigate('Salidas')}>
            <MaterialIcons name="money-off" size={24} color="black" />
            <Text>Gastos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rectangulo} onPress={() => navigation.navigate('Metas')}>
            <MaterialCommunityIcons name="bullseye-arrow" size={24} color="black" />
            <Text>Metas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rectangulo} onPress={() => navigation.navigate('historial')}>
            <Feather name="book-open" size={24} color="black" />
            <Text>Historial</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView >
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Principal" component={Principal} />
        <Stack.Screen name="Ingresos" component={Ingresos} />
        <Stack.Screen name="Salidas" component={Salidas} />
        <Stack.Screen name="Metas" component={Metas} />
        <Stack.Screen name="historial" component={Historial} />
      </Stack.Navigator>
    </NavigationContainer>
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
  },
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    height: 70,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bienvenida: {
    width: '100%',
    marginTop: 30,
    marginLeft: 20,
  },
  bienvenidatext: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
  },
  grafica: {
    width: '100%',
    height: 220, 
    marginTop: 40,
    justifyContent: 'center', 
    alignItems: 'center',      
  },
  Containerrect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 30,
    alignSelf: 'center',
  },
  rectangulo: {
    width: '47%',
    height: 80,
    borderWidth: 1,
    borderColor: 'black',
    borderStyle: 'solid', 
    marginBottom: 15,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  textoapoyo: {
    width: '100%',
    marginTop: 30,
    marginLeft: 20,
    fontWeight: 'bold', 
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#333',
  },
  loadingChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%', 
  },
  loadingChartText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  noDataChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  noDataChartText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});
