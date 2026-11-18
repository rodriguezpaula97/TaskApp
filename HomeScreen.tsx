import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet, Switch, Platform } from 'react-native';
import { getDB } from './database';
import { getWebDB } from './databaseWeb';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  completada: number;
  categoria_id: number;
  categoria_nombre?: string;
}

export default function HomeScreen({ navigation }: any) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filtroPendientes, setFiltroPendientes] = useState(false);

  const loadTareas = async () => {
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (!db) return;
      const query = filtroPendientes 
        ? "SELECT tareas.*, categorias.nombre as categoria_nombre FROM tareas LEFT JOIN categorias ON tareas.categoria_id = categorias.id WHERE completada = 0"
        : "SELECT tareas.*, categorias.nombre as categoria_nombre FROM tareas LEFT JOIN categorias ON tareas.categoria_id = categorias.id";
      const res = db.exec(query);
      if (res.length > 0) {
        const columns = res[0].columns;
        const values = res[0].values;
        const formatted = values.map((row: unknown[]) => {
          const obj: Record<string, unknown> = {};
          columns.forEach((col: string, idx: number) => {
            obj[col] = row[idx];
          });
          return obj as unknown as Tarea;
        });
        setTareas(formatted);
      } else {
        setTareas([]);
      }
    } else {
      const db = getDB();
      if (!db) return;
      const query = filtroPendientes 
        ? `SELECT tareas.*, categorias.nombre as categoria_nombre FROM tareas LEFT JOIN categorias ON tareas.categoria_id = categorias.id WHERE completada = 0;`
        : `SELECT tareas.*, categorias.nombre as categoria_nombre FROM tareas LEFT JOIN categorias ON tareas.categoria_id = categorias.id;`;
      const result = await db.getAllAsync<Tarea>(query);
      setTareas(result);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadTareas();
    }, [filtroPendientes])
  );

  const toggleCompletada = async (id: number, actual: number) => {
    const nuevoEstado = actual === 1 ? 0 : 1;
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (db) db.run("UPDATE tareas SET completada = ? WHERE id = ?;", [nuevoEstado, id]);
    } else {
      const db = getDB();
      if (db) await db.runAsync("UPDATE tareas SET completada = ? WHERE id = ?;", [nuevoEstado, id]);
    }
    void loadTareas();
  };

  const eliminarTarea = async (id: number) => {
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (db) db.run("DELETE FROM tareas WHERE id = ?;", [id]);
    } else {
      const db = getDB();
      if (db) await db.runAsync("DELETE FROM tareas WHERE id = ?;", [id]);
    }
    void loadTareas();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Button title="+ Nueva Tarea" onPress={() => navigation.navigate('TaskForm')} />
        <View style={styles.filterContainer}>
          <Text style={styles.filterText}>Solo pendientes</Text>
          <Switch value={filtroPendientes} onValueChange={setFiltroPendientes} />
        </View>
      </View>

      <FlatList
        data={tareas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => void toggleCompletada(item.id, item.completada)}>
              <View style={styles.row}>
                <Ionicons name={item.completada ? "checkbox" : "square-outline"} size={24} color="#007AFF" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.title, item.completada === 1 && styles.completedText]}>{item.titulo}</Text>
                  <Text style={styles.categoryBadge}>{item.categoria_nombre || 'Sin categoría'}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('TaskForm', { taskId: item.id })}>
              <Ionicons name="pencil" size={20} color="orange" style={{ marginHorizontal: 8 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void eliminarTarea(item.id)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterContainer: { flexDirection: 'row', alignItems: 'center' },
  filterText: { marginRight: 8, fontSize: 14 },
  taskCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  completedText: { textDecorationLine: 'line-through', color: 'gray' },
  categoryBadge: { fontSize: 12, color: '#666', marginTop: 2 }
});