const firebird = require('node-firebird');
const Database = require('better-sqlite3');
const path = require('path');

const optionsFirebird = {
    host: '127.0.0.1',
    port: 3050,
    database: 'C:/Users/luisb/OneDrive/Documentos/Estadias Recursos/CAJA50.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: false,
    pageSize: 4096
};

const dbSqlite = new Database(path.join(__dirname, 'cotizador.sqlite'));

const consultarFirebird = (sql) => {
    return new Promise((resolve, reject) => {
        firebird.attach(optionsFirebird, (err, db) => {
            if (err) return reject(err);
            db.query(sql, [], (err, result) => {
                db.detach();
                if (err) return reject(err);
                resolve(result);
            });
        });
    });
};

async function migrarProductos() {
    console.log('Extrayendo productos desde Firebird');

    try {
        dbSqlite.exec(`
            DROP TABLE IF EXISTS productos;

            CREATE TABLE productos (
                clave TEXT PRIMARY KEY,
                nombre TEXT,
                categoria TEXT,
                precio REAL,
                costo REAL,
                stock REAL,
                codigo_barras TEXT
            );
        `);


        const sqlProductos = `
            SELECT 
                PRODUCTO AS CLAVE, 
                DESCRIPCIO AS NOMBRE, 
                LINEA AS CATEGORIA, 
                PRECIOP AS PRECIO, 
                COSTOPROM AS COSTO, 
                EXISTENCIA AS STOCK, 
                CLVALTER1 AS CODIGO_BARRAS
            FROM CATINVEN 
            WHERE ALTA = 'T'
        `;
        const productos = await consultarFirebird(sqlProductos);

        const insertProducto = dbSqlite.prepare(`
            INSERT INTO productos (clave, nombre, categoria, precio, costo, stock, codigo_barras)
            VALUES (@CLAVE, @NOMBRE, @CATEGORIA, @PRECIO, @COSTO, @STOCK, @CODIGO_BARRAS)
        `);

        const migrarTransaction = dbSqlite.transaction((items) => {
            for (const item of items) {
                item.NOMBRE = item.NOMBRE ? item.NOMBRE.trim() : '';
                item.CATEGORIA = item.CATEGORIA ? item.CATEGORIA.trim() : '';
                item.CODIGO_BARRAS = item.CODIGO_BARRAS ? item.CODIGO_BARRAS.trim() : '';
                insertProducto.run(item);
            }
        });

        migrarTransaction(productos);
        console.log(`Listo ${productos.length} productos guardados en sqlite`);

    } catch (error) {
        console.error('Error al migrar productos:', error);
    }
}

migrarProductos();