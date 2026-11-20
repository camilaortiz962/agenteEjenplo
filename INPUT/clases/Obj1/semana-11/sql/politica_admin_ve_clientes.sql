-- Permite que un ADMINISTRADOR lea los datos de los clientes (nombre, correo,
-- telefono...) para mostrarlos en la pestaña "Pedidos" de admin.html.
--
-- Dónde: Supabase → SQL Editor → consulta nueva (+) → pegar → Run.
--
-- Por qué hace falta: clientes_practica solo tiene la política
-- "cliente_ve_su_perfil" (cada cliente lee SU fila). Sin esta política, el
-- select anidado clientes_practica(...) llega en null para el admin.
--
-- Solo SELECT: el admin puede LEER clientes, no editarlos ni borrarlos.
-- Las políticas permisivas se suman con OR: el cliente sigue viendo solo
-- la suya, y el admin además ve todas.

create policy "admin_ve_clientes" on clientes_practica
for select to authenticated
using ( exists (select 1 from admins_practica where id = (select auth.uid())) );

-- Comprobar (debe aparecer junto a cliente_ve_su_perfil):
-- select policyname, cmd from pg_policies where tablename = 'clientes_practica';
