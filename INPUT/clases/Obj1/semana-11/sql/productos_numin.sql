-- Catálogo Numin → tabla productos_practica (33 productos del CATÁLOGO NUMIN).
--
-- Dónde: Supabase → SQL Editor → consulta nueva (+) → pegar todo → Run.
-- (El SQL Editor corre como administrador de la base: no lo frena la política
--  Solo_admin_crea_productos, que sí frena al navegador.)
--
-- ⚠ PRECIOS, STOCK Y DESCUENTOS SON DE PRUEBA (inventados para practicar).
--   Cámbialos por los reales desde admin.html → Modificar, o con un update.
--
-- Lo que SÍ viene del catálogo: nombre, presentación del frasco (descripción),
-- línea (categorías) y la imagen.
--
-- img_url es una ruta RELATIVA a la carpeta practica/: funciona en
-- galeria.html, cliente.html y admin.html porque están en esa carpeta.
--
-- Se puede correr dos veces sin duplicar: "where not exists" salta los
-- productos que ya existan con el mismo nombre.

insert into productos_practica (nombre, descripcion, precio, unidades, descuento, disponible, categorias, img_url)
select v.nombre, v.descripcion, v.precio, v.unidades, v.descuento, true, v.categorias::json, v.img_url
from (values
  -- ===== Origen natural =====
  ('Astaxantina',                       'Haematococcus pluvialis. Frasco de 90 unidades, 12 mg.',                      62000, 30, 0,    '["Origen natural"]', 'img/numin/astaxantina.jpg'),
  ('Calabaza',                          'Pumpkin seed oil. Frasco de 90 unidades, 300 mg.',                            42000, 40, 0,    '["Origen natural"]', 'img/numin/calabaza.jpg'),
  ('Fenogreco',                         'Fenugreek seed extract. Frasco de 90 unidades, 250 mg.',                      39000, 35, 0,    '["Origen natural"]', 'img/numin/fenogreco.jpg'),
  ('Melena de León',                    'Lion''s mane. Frasco de 90 unidades, 500 mg.',                                68000, 25, 0,    '["Origen natural"]', 'img/numin/melena-de-leon.jpg'),
  ('Orégano Extract Oil',               'Con carvacrol y timoquinona. Frasco de 90 unidades, 300 mg.',                 45000, 30, 0,    '["Origen natural"]', 'img/numin/oregano.jpg'),
  ('Papaya',                            'Carica papaya extract. Frasco de 90 unidades, 220 mg.',                       36000, 40, 0,    '["Origen natural"]', 'img/numin/papaya.jpg'),
  ('Spirulina + Picolinato de cromo',   'Frasco de 90 unidades, 220 mg.',                                              48000, 50, 0,    '["Origen natural"]', 'img/numin/spirulina-picolinato.jpg'),
  ('Spirulina + Clorofila',             'Frasco de 60 unidades, 36 g.',                                                44000, 35, 0,    '["Origen natural"]', 'img/numin/spirulina-clorofila.jpg'),
  ('Vinagre de manzana',                'Frasco de 90 unidades, 220 mg.',                                              35000, 45, 0,    '["Origen natural"]', 'img/numin/vinagre-de-manzana.jpg'),

  -- ===== Belleza =====
  ('Biotina',                           '30.000 µg. Frasco de 60 unidades, 36 g, 60 porciones.',                       45000, 60, 0.10, '["Belleza"]',        'img/numin/biotina.jpg'),
  ('Colágeno + Biotina',                'Frasco de 100 unidades, 60 g, 50 porciones.',                                 72000, 50, 0.10, '["Belleza"]',        'img/numin/colageno-biotina.jpg'),
  ('NAD Resveratrol + K',               'Frasco de 100 unidades, 60 g, 50 porciones.',                                 95000, 20, 0,    '["Belleza"]',        'img/numin/nad.jpg'),
  ('Resveratrol',                       '600 mg. Frasco de 60 unidades, 36 g, 60 porciones.',                          78000, 25, 0,    '["Belleza"]',        'img/numin/resveratrol.jpg'),

  -- ===== Vitaminas y minerales =====
  ('19 Vitaminas & Minerales',          'Frasco de 100 unidades, 150 g, 100 porciones.',                               58000, 40, 0,    '["Vitaminas y minerales"]', 'img/numin/19-vitaminas.jpg'),
  ('Calcio + Mg & Zinc',                'Frasco de 100 unidades, 60 g, 100 porciones.',                                42000, 45, 0,    '["Vitaminas y minerales"]', 'img/numin/calcio-mg-zinc.jpg'),
  ('Glicinato de Magnesio',             'Frasco de 100 unidades, 60 g, 100 porciones.',                                55000, 40, 0,    '["Vitaminas y minerales"]', 'img/numin/glicinato-magnesio.jpg'),
  ('Magnesio Citrato',                  '500 mg. Frasco de 100 unidades, 150 g, 100 porciones.',                       46000, 50, 0,    '["Vitaminas y minerales"]', 'img/numin/magnesio-citrato.jpg'),
  ('Magnesio 8 en 1 Complex',           'Frasco de 100 unidades, 60 g, 33 porciones.',                                 64000, 40, 0.10, '["Vitaminas y minerales"]', 'img/numin/magnesio-complex.jpg'),
  ('Citrato de Magnesio + Potasio',     'Frasco de 100 unidades, 150 g, 100 porciones.',                               52000, 35, 0,    '["Vitaminas y minerales"]', 'img/numin/citrato-magnesio-potasio.jpg'),
  ('Potasio Citrato 1500 mg',           'Frasco de 100 unidades, 150 g, 50 porciones.',                                48000, 30, 0,    '["Vitaminas y minerales"]', 'img/numin/potasio-citrato.jpg'),
  ('Selenio + Vitamina C',              'Frasco de 100 unidades, 60 g.',                                               39000, 35, 0,    '["Vitaminas y minerales"]', 'img/numin/selenio-vitamina-c.jpg'),
  ('Vitamina C + Zinc',                 'Frasco de 60 unidades, 36 g, 60 porciones.',                                  32000, 60, 0,    '["Vitaminas y minerales"]', 'img/numin/vitamina-c-zinc.jpg'),
  ('Vitamina D3 + K2',                  'Frasco de 100 unidades, 60 g, 50 porciones.',                                 49000, 40, 0,    '["Vitaminas y minerales"]', 'img/numin/vitamina-d3-k2.jpg'),
  ('Vitamina D3 1000 UI',               'Frasco de 60 unidades, 36 g.',                                                34000, 50, 0,    '["Vitaminas y minerales"]', 'img/numin/vitamina-d3.jpg'),
  ('Vitamina E 1000 UI',                'Frasco de 100 unidades, 140 g, 100 porciones.',                               41000, 45, 0,    '["Vitaminas y minerales"]', 'img/numin/vitamina-e.jpg'),
  ('Zinc',                              '30 mg. Frasco de 100 unidades, 60 g, 50 porciones.',                          29000, 55, 0,    '["Vitaminas y minerales"]', 'img/numin/zinc.jpg'),

  -- ===== Nutracéuticos =====
  ('Cúrcuma + Pimienta negra + Omega 3','Frasco de 100 unidades, 150 g, 100 porciones.',                               56000, 40, 0,    '["Nutracéuticos"]',  'img/numin/curcuma.jpg'),
  ('Glutamina',                         'Frasco de 100 unidades, 60 g, 100 porciones.',                                47000, 30, 0,    '["Nutracéuticos"]',  'img/numin/glutamina.jpg'),
  ('Inositol Myo + D-Chiro',            'Frasco de 100 unidades, 60 g, 100 porciones.',                                69000, 25, 0,    '["Nutracéuticos"]',  'img/numin/inositol.jpg'),
  ('L-Carnitina',                       'Frasco de 100 unidades, 60 g, 100 porciones.',                                52000, 30, 0,    '["Nutracéuticos"]',  'img/numin/l-carnitina.jpg'),
  ('Omega 3',                           'Frasco de 100 unidades, 150 g, 100 porciones.',                               54000, 60, 0.10, '["Nutracéuticos"]',  'img/numin/omega-3.jpg'),
  ('Omega 3·6·9',                       'Frasco de 100 unidades, 150 g, 100 porciones.',                               57000, 40, 0,    '["Nutracéuticos"]',  'img/numin/omega-369.jpg'),
  ('Probióticos + Prebióticos',         'Frasco de 100 unidades, 60 g, 50 porciones.',                                 63000, 30, 0,    '["Nutracéuticos"]',  'img/numin/probioticos.jpg')
) as v(nombre, descripcion, precio, unidades, descuento, categorias, img_url)
where not exists (
  select 1 from productos_practica p where p.nombre = v.nombre
);

-- Comprobar (debe dar 33):
-- select count(*) from productos_practica where img_url like 'img/numin/%';
