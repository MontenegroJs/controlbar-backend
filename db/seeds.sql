-- =====================================================
-- CONTROLBAR - DATOS DE PRUEBA (SEED)
-- =====================================================
-- -----------------------------------------------------
-- 1. CATEGORÍAS
-- -----------------------------------------------------
INSERT
OR IGNORE INTO categorias (nombre, activo)
VALUES
    ('Bebidas', 1),
    ('Cervezas', 1),
    ('Tragos', 1),
    ('Comidas', 1),
    ('Piqueos', 1);

-- -----------------------------------------------------
-- 2. PRODUCTOS
-- -----------------------------------------------------
INSERT
OR IGNORE INTO productos (categoria_id, nombre, precio_base, activo)
VALUES
    -- Bebidas (categoria_id = 1)
    (1, 'Gaseosa 500ml', 4.00, 1),
    (1, 'Agua 500ml', 2.50, 1),
    (1, 'Jugo Natural', 6.00, 1),
    -- Cervezas (categoria_id = 2)
    (2, 'Cerveza Nacional', 5.00, 1),
    (2, 'Cerveza Importada', 8.00, 1),
    (2, 'Cerveza Artesanal', 10.00, 1),
    -- Tragos (categoria_id = 3)
    (3, 'Pisco Sour', 12.00, 1),
    (3, 'Cuba Libre', 10.00, 1),
    (3, 'Mojito', 12.00, 1),
    (3, 'Margarita', 12.00, 1),
    -- Comidas (categoria_id = 4)
    (4, 'Lomo Saltado', 18.00, 1),
    (4, 'Pollo a la Brasa 1/4', 12.00, 1),
    (4, 'Anticucho', 8.00, 1),
    -- Piqueos (categoria_id = 5)
    (5, 'Tequeños', 8.00, 1),
    (5, 'Papas Fritas', 6.00, 1),
    (5, 'Choclo con Queso', 7.00, 1);

-- -----------------------------------------------------
-- 3. VARIANTES
-- -----------------------------------------------------
INSERT
OR IGNORE INTO producto_variantes (producto_id, nombre, precio_extra, activo)
VALUES
    -- Gaseosa 500ml (id=1)
    (1, 'Inca Kola', 0, 1),
    (1, 'Coca Cola', 0, 1),
    (1, 'Sprite', 0, 1),
    -- Cerveza Nacional (id=4)
    (4, 'Pilsen', 0, 1),
    (4, 'Cristal', 0, 1),
    -- Cerveza Artesanal (id=6)
    (6, 'Barbarian', 0, 1),
    (6, 'Nuevo Mundo', 0, 1),
    -- Lomo Saltado (id=11)
    (11, 'Pollo', -2.00, 1),
    (11, 'Extra Salsa', 1.50, 1),
    (11, 'Con Huevo Frito', 3.00, 1);

-- -----------------------------------------------------
-- 4. MESAS (M1 a M15)
-- -----------------------------------------------------
INSERT
OR IGNORE INTO mesas (nombre, activo)
VALUES
    ('M1', 1),
    ('M2', 1),
    ('M3', 1),
    ('M4', 1),
    ('M5', 1),
    ('M6', 1),
    ('M7', 1),
    ('M8', 1),
    ('M9', 1),
    ('M10', 1),
    ('M11', 1),
    ('M12', 1),
    ('M13', 1),
    ('M14', 1),
    ('M15', 1);

-- -----------------------------------------------------
-- 5. USUARIOS (contraseñas: mozo123, cajero123, admin123)
-- Nota: Los hashes son de bcrypt con salt=10
-- -----------------------------------------------------
INSERT
OR IGNORE INTO usuarios (username, password_hash, rol, activo)
VALUES
    (
        'mozo',
        '$2a$10$X7Z9K2L5M8N1P4Q7R0S3T6U9W2Y5B8E1H4J7K0L3N6P9R2T5V8X1C4F7A0',
        'mozo',
        1
    ),
    (
        'cajero',
        '$2a$10$Y8A0L3M6N9P2Q5R8S1T4U7W0X3Y6B9E2H5J8K1L4N7P0R3T6V9X2C5F8A1',
        'cajero',
        1
    ),
    (
        'admin',
        '$2a$10$Z9B1M4N7P0Q3R6S9T2U5W8X1Y4C7E0H3J6K9L2N5P8R1T4V7X0C3F6A9',
        'admin',
        1
    );

-- Nota: Los hashes son ejemplos. En producción se generan con bcrypt.
-- Para pruebas, las contraseñas son: mozo123, cajero123, admin123