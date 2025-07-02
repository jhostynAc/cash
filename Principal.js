import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ingresos from './Ingresos';
import Salidas from './Salidas';

const Stack = createNativeStackNavigator();

function Principal({navigation}) {
  const [inputValue, setInputValue] = useState('');
  const data = [
    { name: 'Salidas', population: 30, color: '#FFB3B3', legendFontColor: 'black', legendFontSize: 15 },
    { name: 'Ahorros', population: 70, color: '#B3D9FF', legendFontColor: 'black', legendFontSize: 15 },
    { name: 'Ingresos', population: 50, color: '#B3FFB3', legendFontColor: 'black', legendFontSize: 15 },
  ];
  return (
    <SafeAreaView style={styles.safeArea}>{
      <View style={styles.container}>
        <View style={styles.nav}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Cash</Text>
          <FontAwesome name="gear" size={30} color="black" />
        </View>
        <View style={styles.bienvenida}>
          <Text style={styles.bienvenidatext}>¡Hola, Nombre¡</Text>
        </View>
        <View style={styles.textoapoyo}>
          <Text>Resumen financiero:</Text>
        </View>
        <View style={styles.grafica}>
          <PieChart
            data={data}
            width={Dimensions.get('window').width}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
        <View style={styles.Containerrect}>
         <TouchableOpacity style={styles.recatangulo} onPress={() => navigation.navigate('Ingresos')}>
            <FontAwesome5 name="money-bill-wave" size={24} color="black" />
            <Text>Ingresos</Text>
          </TouchableOpacity>
          
         <TouchableOpacity style={styles.recatangulo} onPress={() => navigation.navigate('Salidas')}>
            <MaterialIcons name="money-off" size={24} color="black" />
            <Text>Gastos</Text>
          </TouchableOpacity>
          <View style={styles.recatangulo}>
            <MaterialCommunityIcons name="bullseye-arrow" size={24} color="black" />
            <Text>Metas</Text>
          </View>
          <View style={styles.recatangulo}>
            <Feather name="book-open" size={24} color="black" />
            <Text>Historial</Text>
          </View>
        </View>
      </View>      
    }</SafeAreaView>
  );
}
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Principal" component={Principal} options={{ headerShown: false }} />
        <Stack.Screen name="Ingresos" component={Ingresos} options={{ headerShown: false }} />
        <Stack.Screen name="Salidas" component={Salidas} options={{ headerShown: false }} />
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
    justifyContent: 'center',
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
    height: 280,
    marginTop: 40
  },
  Containerrect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 30,
    alignSelf: 'center',
  },
  recatangulo: {
    width: '47%',
    height: 80,
    borderWidth: 1,
    borderColor: 'black',
    borderStyle: 'solid', marginBottom: 15,
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
    fontSize: 60,
    fontWeight: 'bold',
    color: '#333',
  }
});
