import React, { useState, useCallback } from 'react';
import { Text, Dimensions, StyleSheet, ScrollView, Platform } from 'react-native';
import { getDB } from './database';
import { getWebDB } from './databaseWeb';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

export default function StatsScreen() {
  const [chartData, setChartData] = useState({
    labels: ['Sin datos'],
    datasets: [{ data: [0] }]
  });

  const loadStats = async () => {
    let result: { nombre: string; total: number }[] = [];
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (!db) return;
      const res = db.exec(`
        SELECT c.nombre, COUNT(t.id) as total 
        FROM categorias c 
        LEFT JOIN tareas t ON c.id = t.categoria_id AND t.completada = 1 
        GROUP BY c.id
      `);
      if (res.length > 0) {
        result = res[0].values.map((r: unknown[]) => ({ 
          nombre: String(r[0] as string), 
          total: Number(r[1] as number) 
        }));
      }
    } else {
      const db = getDB();
      if (!db) return;
      result = await db.getAllAsync<{ nombre: string; total: number }>(`
        SELECT c.nombre, COUNT(t.id) as total 
        FROM categorias c 
        LEFT JOIN tareas t ON c.id = t.categoria_id AND t.completada = 1 
        GROUP BY c.id
      `);
    }

    if (result && result.length > 0) {
      setChartData({
        labels: result.map(r => r.nombre),
        datasets: [{ data: result.map(r => r.total) }]
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tareas Completadas por Categoría</Text>
      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 32}
        height={260}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { borderRadius: 16 }
        }}
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }
});