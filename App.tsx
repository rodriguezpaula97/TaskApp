import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import TaskFormScreen from './TaskFormScreen';
import CategoriesScreen from './CategoriesScreen';
import StatsScreen from './StatsScreen';

import { initDatabase } from './database';
import { initWebDatabase } from './databaseWeb';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaTareas" component={HomeScreen} options={{ title: 'Mis Tareas' }} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ title: 'Detalle de Tarea' }} />
    </Stack.Navigator>
  );
}

// Función auxiliar para renderizar los iconos de la barra de navegación de forma limpia
interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  routeName: string;
}

function renderTabBarIcon({ focused, color, size, routeName }: TabBarIconProps) {
  let iconName = 'home';
  if (routeName === 'Inicio') iconName = focused ? 'home' : 'home-outline';
  else if (routeName === 'Categorías') iconName = focused ? 'list' : 'list-outline';
  else if (routeName === 'Estadísticas') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      if (Platform.OS === 'web') {
        await initWebDatabase();
      } else {
        await initDatabase();
      }
      setIsReady(true);
    };
    void setup();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: (props) => renderTabBarIcon({ ...props, routeName: route.name }),
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Inicio" component={HomeStack} options={{ headerShown: false }} />
        <Tab.Screen name="Categorías" component={CategoriesScreen} />
        <Tab.Screen name="Estadísticas" component={StatsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});