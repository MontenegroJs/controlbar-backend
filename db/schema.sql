-- =====================================================
-- CONTROLBAR - ESQUEMA DE BASE DE DATOS
-- Versión: MVP 1.0
-- =====================================================
-- Habilitar claves foráneas
PRAGMA foreign_keys = ON;

-- =====================================================
-- 1. TABLA: categorias
-- =====================================================
CREATE TABLE
    IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        activo INTEGER DEFAULT 1
    );

-- =====================================================
-- 2. TABLA: productos
-- =====================================================
CREATE TABLE
    IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        precio_base REAL NOT NULL,
        activo INTEGER DEFAULT 1,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE RESTRICT
    );

-- =====================================================
-- 3. TABLA: producto_variantes
-- =====================================================
CREATE TABLE
    IF NOT EXISTS producto_variantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        precio_extra REAL DEFAULT 0,
        activo INTEGER DEFAULT 1,
        FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
    );

-- =====================================================
-- 4. TABLA: mesas
-- =====================================================
CREATE TABLE
    IF NOT EXISTS mesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        activo INTEGER DEFAULT 1
    );

-- =====================================================
-- 5. TABLA: pedidos
-- =====================================================
CREATE TABLE
    IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mesa_id INTEGER NOT NULL,
        estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
        total REAL DEFAULT 0,
        numero_ticket INTEGER,
        metodo_pago TEXT CHECK (
            metodo_pago IN ('efectivo', 'tarjeta', 'yape', 'plin')
        ),
        monto_recibido REAL,
        vuelto REAL,
        referencia_pago TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        pagado_en DATETIME,
        FOREIGN KEY (mesa_id) REFERENCES mesas (id) ON DELETE RESTRICT
    );

-- =====================================================
-- 6. TABLA: pedido_items
-- =====================================================
CREATE TABLE
    IF NOT EXISTS pedido_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        variante_id INTEGER,
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        agregado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT,
        FOREIGN KEY (variante_id) REFERENCES producto_variantes (id) ON DELETE RESTRICT
    );

-- =====================================================
-- 7. TABLA: usuarios
-- =====================================================
CREATE TABLE
    IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL CHECK (rol IN ('mozo', 'cajero', 'admin')),
        activo INTEGER DEFAULT 1
    );

-- =====================================================
-- TRIGGER: Actualizar timestamp de pedidos (con hora Lima)
-- =====================================================
DROP TRIGGER IF EXISTS update_pedidos_timestamp;

CREATE TRIGGER IF NOT EXISTS update_pedidos_timestamp AFTER
UPDATE ON pedidos BEGIN
UPDATE pedidos
SET
    actualizado_en = datetime ('now', '-5 hours')
WHERE
    id = NEW.id;

END;

-- =====================================================
-- ÍNDICES para mejorar rendimiento
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);

CREATE INDEX IF NOT EXISTS idx_pedidos_mesa_id ON pedidos (mesa_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos (creado_en);

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items (pedido_id);