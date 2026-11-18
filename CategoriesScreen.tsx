import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { getDB } from './database';
import { getWebDB } from './databaseWeb';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

export default function CategoriesScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');

  const loadCategorias = async () => {
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (!db) return;
      const res = db.exec("SELECT * FROM categorias;");
      if (res.length > 0) {
        setCategorias(res[0].values.map((r: unknown[]) => ({ 
          id: Number(r[0]), 
          nombre: String(r[1] as string), 
          color: String(r[2] as string) 
        })));
      } else {
        setCategorias([]);
      }
    } else {
      const db = getDB();
      if (!db) return;
      const result = await db.getAllAsync<Categoria>("SELECT * FROM categorias;");
      setCategorias(result);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadCategorias();
    }, [])
  );

  const agregarCategoria = async () => {
    if (!nombre.trim()) return;
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (db) db.run("INSERT INTO categorias (nombre) VALUES (?);", [nombre]);
    } else {
      const db = getDB();
      if (db) await db.runAsync("INSERT INTO categorias (nombre) VALUES (?);", [nombre]);
    }
    setNombre('');
    void loadCategorias();
  };

  const eliminarCategoria = async (id: number) => {
    if (Platform.OS === 'web') {
      const db = getWebDB();
      if (db) db.run("DELETE FROM categorias WHERE id = ?;", [id]);
    } else {
      const db = getDB();
      if (db) await db.runAsync("DELETE FROM categorias WHERE id = ?;", [id]);
    }
    void loadCategorias();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nueva Categoría:</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 1, marginRight: 10, marginBottom: 0 }]} value={nombre} onChangeText={setNombre} placeholder="Nombre de categoría" />
        <Button title="Agregar" onPress={() => void agregarCategoria()} />
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Categorías Existentes:</Text>
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemText}>{item.nombre}</Text>
            <TouchableOpacity onPress={() => void eliminarCategoria(item.id)}>
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
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, fontSize: 16, backgroundColor: '#fff' },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 8, alignItems: 'center' },
  itemText: { fontSize: 16 }
});