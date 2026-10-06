-- datos-prueba.sql
-- Datos iniciales para PedjasApp Liberty.
-- IMPORTANTE: EclipseLink ejecuta este script línea a línea.
-- Cada INSERT debe estar en una única línea (sin saltos de línea dentro del VALUES).

-- Clientes de prueba (contraseñas en texto plano solo para demo)
INSERT INTO CLIENTES (USUARIO, CONTRASENA, NOMBRE, EMAIL) VALUES ('admin', 'admin123', 'Administrador Sistema', 'admin@pedjasapp.com');
INSERT INTO CLIENTES (USUARIO, CONTRASENA, NOMBRE, EMAIL) VALUES ('juan', 'juan123', 'Juan García López', 'juan@ejemplo.com');
INSERT INTO CLIENTES (USUARIO, CONTRASENA, NOMBRE, EMAIL) VALUES ('maria', 'maria123', 'María Martínez Ruiz', 'maria@ejemplo.com');

-- Catálogo de productos de ejemplo
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Portátil Ultrabook 14"', 'Procesador Intel i7, 16GB RAM, SSD 512GB', 999.99, 'ELECTRONICA', 25);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Monitor 27" 4K', 'Panel IPS, 144Hz, HDR400', 449.99, 'ELECTRONICA', 15);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Teclado Mecánico RGB', 'Switches Cherry MX Red, retroiluminación RGB', 89.99, 'ELECTRONICA', 50);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Ratón Inalámbrico', 'Sensor óptico 4000 DPI, batería 60h', 49.99, 'ELECTRONICA', 80);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Auriculares Bluetooth', 'Cancelación activa de ruido, 30h autonomía', 129.99, 'ELECTRONICA', 30);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Sofá 3 plazas', 'Tapizado en tela gris, estructura madera maciza', 599.99, 'HOGAR', 8);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Mesa de Escritorio 160cm', 'Tablero de roble, patas regulables en altura', 349.99, 'HOGAR', 12);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Lámpara de Escritorio LED', 'Brillo ajustable, temperatura de color 2700-6500K', 39.99, 'HOGAR', 60);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Silla Ergonómica', 'Soporte lumbar ajustable, reposabrazos 4D', 279.99, 'HOGAR', 18);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Camiseta Algodón Orgánico', 'Algodón 100% orgánico, certificado GOTS', 24.99, 'ROPA', 120);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Pantalón Vaquero Slim', 'Denim elástico, corte entallado', 59.99, 'ROPA', 75);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Zapatillas Running', 'Amortiguación reactiva, suela de goma continental', 119.99, 'ROPA', 35);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Aceite de Oliva Virgen Extra', 'D.O.P. Priego de Córdoba, botella 750ml', 9.99, 'ALIMENTACION', 200);
INSERT INTO PRODUCTOS (NOMBRE, DESCRIPCION, PRECIO, CATEGORIA, STOCK) VALUES ('Café Molido Arábica', '100% Arábica, tueste medio, 250g', 12.99, 'ALIMENTACION', 150);
