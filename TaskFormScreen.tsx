import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Platform } from 'react-native';
import { getDB } from './database';
import { getWebDB } from './databaseWeb';
import { Picker } from '@react-native-picker/picker';

interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

export default function TaskFormScreen({ route, navigation }: any) {
  const taskId = route.params?.taskId;
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    void loadCategories();
    if (taskId) void loadTaskData();
  }, [taskId]);

  const loadCategories = async () => {
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (!db) return;
      const res = db.exec("SELECT * FROM categorias;");
      if (res.length > 0) {
        const vals = res[0].values;
        const cats: Categoria[] = vals.map((r: unknown[]) => ({ 
          id: Number(r[0]), 
          nombre: String(r[1] as string), 
          color: String(r[2] as string) 
        }));
        setCategorias(cats);
        if (categoriaId === null && cats.length > 0) setCategoriaId(cats[0].id);
      }
    } else {
      const db = getDB();
      if (!db) return;
      const cats = await db.getAllAsync<Categoria>("SELECT * FROM categorias;");
      setCategorias(cats);
      if (categoriaId === null && cats.length > 0) setCategoriaId(cats[0].id);
    }
  };

  const loadTaskData = async () => {
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (!db) return;
      const stmt = db.prepare("SELECT * FROM tareas WHERE id = $id;");
      stmt.bind({ $id: taskId });
      if (stmt.step()) {
        const row = stmt.getAsObject() as { titulo: string; descripcion?: string; categoria_id: number };
        setTitulo(row.titulo);
        setDescripcion(row.descripcion || '');
        setCategoriaId(row.categoria_id);
      }
      stmt.free();
    } else {
      const db = getDB();
      if (!db) return;
      const task = await db.getFirstAsync<{ titulo: string; descripcion: string; categoria_id: number }>("SELECT * FROM tareas WHERE id = ?;", [taskId]);
      if (task) {
        setTitulo(task.titulo);
        setDescripcion(task.descripcion || '');
        setCategoriaId(task.categoria_id);
      }
    }
  };

  const guardarTarea = async () => {
    if (!titulo.trim()) return;
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (!db) return;
      if (taskId) {
        db.run("UPDATE tareas SET titulo = ?, descripcion = ?, categoria_id = ? WHERE id = ?;", [titulo, descripcion, categoriaId, taskId]);
      } else {
        db.run("INSERT INTO tareas (titulo, descripcion, categoria_id, completada) VALUES (?, ?, ?, 0);", [titulo, descripcion, categoriaId]);
      }
    } else {
      const db = getDB();
      if (!db) return;
      if (taskId) {
        await db.runAsync("UPDATE tareas SET titulo = ?, descripcion = ?, categoria_id = ? WHERE id = ?;", [titulo, descripcion, categoriaId, taskId]);
      } else {
        await db.runAsync("INSERT INTO tareas (titulo, descripcion, categoria_id, completada) VALUES (?, ?, ?, 0);", [titulo, descripcion, categoriaId]);
      }
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Título de la Tarea:</Text>
      <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Ej. Comprar pan" />

      <Text style={styles.label}>Descripción:</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={descripcion} onChangeText={setDescripcion} placeholder="Detalles adicionales" multiline />

      <Text style={styles.label}>Categoría:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={categoriaId} onValueChange={(itemValue) => setCategoriaId(itemValue)}>
          {categorias.map(cat => (
            <Picker.Item key={cat.id} label={cat.nombre} value={cat.id} />
          ))}
        </Picker>
      </View>

      <Button title={taskId ? "Actualizar Tarea" : "Guardar Tarea"} onPress={() => void guardarTarea()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 20 }
});