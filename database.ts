import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync('agenda_tareas.db');
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        color TEXT DEFAULT '#007AFF'
      );
      CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        completada INTEGER DEFAULT 0,
        categoria_id INTEGER,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE CASCADE
      );
    `);

    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categorias;');
    if (result?.count === 0) {
      await db.runAsync("INSERT INTO categorias (nombre, color) VALUES ('Trabajo', '#FF5733');");
      await db.runAsync("INSERT INTO categorias (nombre, color) VALUES ('Estudios', '#33FF57');");
      await db.runAsync("INSERT INTO categorias (nombre, color) VALUES ('Personal', '#3357FF');");
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos nativa:', error);
  }
};

export const getDB = (): SQLite.SQLiteDatabase | null => db;