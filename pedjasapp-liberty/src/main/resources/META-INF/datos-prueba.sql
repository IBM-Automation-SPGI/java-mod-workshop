-- datos-prueba.sql
-- Datos iniciales para PedjasApp Liberty.
-- Ejecutado por EclipseLink al arrancar si las tablas están vacías.

-- Clientes de prueba (contraseñas en texto plano solo para demo)
INSERT INTO CLIENTES (USUARIO, CONTRASENA, NOMBRE, EMAIL) VALUES
  ('admin',   'admin123',   'Administrador Sistema', 'admin@pedjasapp.com'),
  ('juan',    'juan123',    'Juan García López',     'juan@ejemplo.com'),
  ('maria',   'maria123',   'María Martínez Ruiz',   'maria@ejemplo.com');

-- Catálogo de productos de ejemplo
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES
  ('Portátil Ultrabook 14"',     'Procesador Intel i7, 16GB RAM, SSD 512GB',          999.99, 'ELECTRONICA', 25),
  ('Monitor 27" 4K',             'Panel IPS, 144Hz, HDR400',                           449.99, 'ELECTRONICA', 15),
  ('Teclado Mecánico RGB',       'Switches Cherry MX Red, retroiluminación RGB',        89.99, 'ELECTRONICA', 50),
  ('Ratón Inalámbrico',          'Sensor óptico 4000 DPI, batería 60h',                 49.99, 'ELECTRONICA', 80),
  ('Auriculares Bluetooth',      'Cancelación activa de ruido, 30h autonomía',         129.99, 'ELECTRONICA', 30),
  ('Sofá 3 plazas',              'Tapizado en tela gris, estructura madera maciza',    599.99, 'HOGAR',       8),
  ('Mesa de Escritorio 160cm',   'Tablero de roble, patas regulables en altura',       349.99, 'HOGAR',       12),
  ('Lámpara de Escritorio LED',  'Brillo ajustable, temperatura de color 2700-6500K',  39.99, 'HOGAR',       60),
  ('Silla Ergonómica',           'Soporte lumbar ajustable, reposabrazos 4D',          279.99, 'HOGAR',       18),
  ('Estantería Modular',         'Módulos combinables, hasta 200kg de carga',          159.99, 'HOGAR',       22),
  ('Camiseta Algodón Orgánico',  'Algodón 100% orgánico, certificado GOTS',             24.99, 'ROPA',        120),
  ('Pantalón Vaquero Slim',      'Denim elástico, corte entallado',                     59.99, 'ROPA',        75),
  ('Chaqueta Polar',             'Forro polar 300g, bolsillos con cremallera',           79.99, 'ROPA',        40),
  ('Zapatillas Running',         'Amortiguación reactiva, suela de goma continental',  119.99, 'ROPA',        35),
  ('Mochila 30L',                'Compartimento laptop 15", impermeable',               69.99, 'ROPA',        55),
  ('Aceite de Oliva Virgen Extra', 'D.O.P. Priego de Córdoba, botella 750ml',            9.99, 'ALIMENTACION', 200),
  ('Café Molido Arábica',        '100% Arábica, tueste medio, 250g',                    12.99, 'ALIMENTACION', 150),
  ('Chocolate Negro 85%',        'Cacao de origen único Ecuador, tableta 100g',          4.99, 'ALIMENTACION', 300),
  ('Té Verde Matcha Premium',    'Grado ceremonial, 30g',                               18.99, 'ALIMENTACION', 90),
  ('Miel de Romero',             'Apicultura local, 500g',                              11.99, 'ALIMENTACION', 110);
