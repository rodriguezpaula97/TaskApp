import { Platform } from 'react-native';

let webDb: any = null;

export const initWebDatabase = async () => {
  if (Platform.OS !== 'web') return null;
  if (webDb) return webDb;

  try {
    // Importación dinámica condicional para que Metro no la carge en Android
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`
    });
    
    webDb = new SQL.Database();

    webDb.run(`
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

    // Datos iniciales de prueba
    webDb.run("INSERT INTO categorias (nombre, color) VALUES ('Trabajo', '#FF5733');");
    webDb.run("INSERT INTO categorias (nombre, color) VALUES ('Estudios', '#33FF57');");
    webDb.run("INSERT INTO categorias (nombre, color) VALUES ('Personal', '#3357FF');");

    return webDb;
  } catch (error) {
    console.error('Error inicializando sql.js en web:', error);
    return null;
  }
};

export const getWebDB = () => webDb;