-- Quita de la tienda los productos de prueba anteriores (todo lo que NO es
-- del catálogo Numin, es decir, lo que no tiene img_url 'img/numin/...').
--
-- ⚠ Corre ANTES sql/productos_numin.sql. Si los productos Numin no están
--   cargados, este script se detiene sin tocar nada (paso 0).
--
-- Dónde: Supabase → SQL Editor → consulta nueva (+) → pegar todo → Run.
-- Es destructivo: el editor mostrará "Potential issues detected". Revisa
-- primero la VISTA PREVIA de abajo (córrela sola) y después el script.
--
-- ---------------------------------------------------------------------
-- VISTA PREVIA (solo lectura): qué productos se van y qué pasará con cada uno
-- ---------------------------------------------------------------------
-- select pr.id, pr.nombre,
--        case when exists (select 1 from detalles_pedidos d join pedidos p on p.id = d.pedido_id
--                           where d.producto_id = pr.id and p.estado <> 'carrito')
--             then 'se oculta (está en un pedido confirmado)'
--             else 'se borra' end as que_pasa
--   from productos_practica pr
--  where pr.img_url is null or pr.img_url not like 'img/numin/%'
--  order by pr.id;

begin;

-- 0) Seguridad: sin el catálogo Numin cargado, "antiguo" sería TODO.
do $fn$
begin
  if (select count(*) from productos_practica where img_url like 'img/numin/%') < 33 then
    raise exception 'Primero corre sql/productos_numin.sql: faltan productos Numin. No se borró nada.';
  end if;
end;
$fn$;

-- 1) Los carritos abiertos no son historial: se quitan de ellos las líneas
--    con productos antiguos (si no, esas líneas impedirían borrarlos).
delete from detalles_pedidos d
 using pedidos p
 where p.id = d.pedido_id
   and p.estado = 'carrito'
   and d.producto_id in (select id from productos_practica
                          where img_url is null or img_url not like 'img/numin/%');

-- 2) Se borran los antiguos que ya no aparecen en ningún pedido.
delete from productos_practica pr
 where (pr.img_url is null or pr.img_url not like 'img/numin/%')
   and not exists (select 1 from detalles_pedidos d where d.producto_id = pr.id);

-- 3) Los que quedan están en pedidos confirmados: borrarlos rompería ese
--    historial (on delete restrict lo impide). Se marcan como no disponibles:
--    la galería ya no los muestra, pero "Mis pedidos" y el admin sí.
update productos_practica
   set disponible = false
 where img_url is null or img_url not like 'img/numin/%';

commit;

-- Comprobar: los únicos productos disponibles deben ser los 33 de Numin.
-- select count(*) filter (where disponible) as disponibles,
--        count(*) filter (where not disponible) as ocultos
--   from productos_practica;
