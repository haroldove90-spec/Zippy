
-- ==============================================================================
-- SCRIPT DE SEGURIDAD Y PRODUCCIÓN ZIPPY (V4.0 - RLS Hardening)
-- Ejecuta este script completo en el Editor SQL de Supabase.
-- Este script corrige vulnerabilidades críticas de seguridad y estructura la DB.
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: ESTRUCTURA DE TABLAS Y MODIFICACIONES
-- Asegura que todas las tablas y columnas necesarias existan.
-- ==============================================================================

-- CRÍTICO: Permitir perfiles demo sin usuario auth real (para credenciales hardcoded)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Tabla: profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'PASSENGER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'TAXI';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_last4 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_expiry text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_brand text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saved_home text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saved_work text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lng numeric;

-- Tabla: rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_label text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS destination_label text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_lat numeric;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_lng numeric;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dest_lat numeric;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dest_lng numeric;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS status text DEFAULT 'REQUESTING';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Tabla: ride_offers
ALTER TABLE public.ride_offers ADD COLUMN IF NOT EXISTS car_model text;
ALTER TABLE public.ride_offers ADD COLUMN IF NOT EXISTS car_plate text;
ALTER TABLE public.ride_offers ADD COLUMN IF NOT EXISTS taxi_number text;
ALTER TABLE public.ride_offers ADD COLUMN IF NOT EXISTS driver_name text;
ALTER TABLE public.ride_offers ADD COLUMN IF NOT EXISTS avatar_url text;

-- Tabla: messages (para chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    role text NOT NULL, -- 'DRIVER' o 'PASSENGER'
    created_at timestamptz DEFAULT now()
);

-- Tabla: driver_applications (para registro de conductores)
CREATE TABLE IF NOT EXISTS public.driver_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name text,
    phone text,
    email text,
    license_id text,
    ine_id text,
    car_model text,
    car_plate text,
    car_year text,
    car_color text,
    selfie_url text,
    license_photo_url text,
    ine_front_url text,
    car_photo_front_url text,
    car_photo_back_url text,
    status text DEFAULT 'pending', -- pending, approved, rejected
    created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- PARTE 2: DATOS DE DEMOSTRACIÓN
-- Inserta usuarios de prueba para facilitar el desarrollo.
-- ==============================================================================

INSERT INTO public.profiles (id, full_name, email, role, phone, taxi_number, car_model, car_plate, status)
VALUES ('d0000000-0000-0000-0000-000000001970', 'Daniel Anguiano', 'daniel_anguiano@appdesignmex.com', 'DRIVER', '5512345678', '1970', 'Chevrolet Spark', 'CHV-1970', 'online')
ON CONFLICT (id) DO UPDATE SET role = 'DRIVER', taxi_number = '1970', car_model = 'Chevrolet Spark', car_plate = 'CHV-1970', status = 'online';

INSERT INTO public.profiles (id, full_name, email, role, phone)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Juan Pérez', 'demo@zippy.mx', 'PASSENGER', '5512345678')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email, role, phone, taxi_number, car_model, car_plate, status)
VALUES ('d0000000-0000-0000-0000-000000000001', 'Roberto Gómez', 'demo@zippy.mx', 'DRIVER', '5599887766', '0842', 'Nissan Tsuru', 'TX-102', 'online')
ON CONFLICT (id) DO UPDATE SET role = 'DRIVER', status = 'online';


-- ==============================================================================
-- PARTE 3: FUNCIONES AUXILIARES DE SEGURIDAD
-- Funciones reutilizables para las políticas RLS.
-- ==============================================================================

-- Obtiene el rol de un usuario desde la tabla de perfiles.
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- PARTE 4: POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (RLS)
-- ¡ESTA ES LA SECCIÓN MÁS CRÍTICA PARA LA SEGURIDAD DE LA APP!
-- ==============================================================================

-- --- POLÍTICAS PARA `profiles` ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver todos los perfiles" ON public.profiles
FOR SELECT USING ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles
FOR UPDATE USING ( auth.uid() = id ) WITH CHECK ( auth.uid() = id );


-- --- POLÍTICAS PARA `rides` ---
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso a viajes" ON public.rides;
CREATE POLICY "Acceso a viajes" ON public.rides FOR SELECT USING (
    (auth.uid() = passenger_id) OR
    (auth.uid() = driver_id) OR
    ((get_user_role(auth.uid()) = 'DRIVER') AND (status = 'REQUESTING'))
);

DROP POLICY IF EXISTS "Pasajeros pueden crear viajes" ON public.rides;
CREATE POLICY "Pasajeros pueden crear viajes" ON public.rides FOR INSERT WITH CHECK (
    (auth.uid() = passenger_id) AND (get_user_role(auth.uid()) = 'PASSENGER')
);

DROP POLICY IF EXISTS "Participantes pueden actualizar viajes" ON public.rides;
CREATE POLICY "Participantes pueden actualizar viajes" ON public.rides FOR UPDATE USING (
    (auth.uid() = passenger_id) OR (auth.uid() = driver_id)
) WITH CHECK (
    (auth.uid() = passenger_id) OR (auth.uid() = driver_id)
);


-- --- POLÍTICAS PARA `ride_offers` ---
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso a ofertas de viaje" ON public.ride_offers;
CREATE POLICY "Acceso a ofertas de viaje" ON public.ride_offers FOR SELECT USING (
    (auth.uid() = driver_id) OR
    (ride_id IN (SELECT id FROM rides WHERE passenger_id = auth.uid()))
);

DROP POLICY IF EXISTS "Conductores pueden crear y borrar sus ofertas" ON public.ride_offers;
CREATE POLICY "Conductores pueden crear y borrar sus ofertas" ON public.ride_offers FOR ALL USING (
    (auth.uid() = driver_id) AND (get_user_role(auth.uid()) = 'DRIVER')
) WITH CHECK (
    (auth.uid() = driver_id) AND (get_user_role(auth.uid()) = 'DRIVER')
);


-- --- POLÍTICAS PARA `messages` (CORRECCIÓN CRÍTICA) ---
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo acceso a mensajes" ON public.messages; -- Eliminando política insegura
DROP POLICY IF EXISTS "Los participantes del viaje pueden ver y crear mensajes" ON public.messages;
CREATE POLICY "Los participantes del viaje pueden ver y crear mensajes" ON public.messages
FOR ALL USING (
  ride_id IN (SELECT id FROM rides WHERE passenger_id = auth.uid() OR driver_id = auth.uid())
) WITH CHECK (
  (sender_id = auth.uid()) AND
  (ride_id IN (SELECT id FROM rides WHERE passenger_id = auth.uid() OR driver_id = auth.uid()))
);


-- --- POLÍTICAS PARA `driver_applications` ---
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo acceso a solicitudes" ON public.driver_applications; -- Eliminando política insegura
DROP POLICY IF EXISTS "Los usuarios pueden gestionar sus propias solicitudes" ON public.driver_applications;
CREATE POLICY "Los usuarios pueden gestionar sus propias solicitudes" ON public.driver_applications
FOR ALL USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );
-- Nota: Los administradores deben usar la `service_role` key para revisar todas las solicitudes.


-- ==============================================================================
-- PARTE 5: FUNCIONES DE SERVIDOR (RPC)
-- Lógica de negocio que se ejecuta de forma segura en la base de datos.
-- ==============================================================================

CREATE OR REPLACE FUNCTION driver_update_status(ride_uuid uuid, new_status text, lat float DEFAULT NULL, lng float DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE rides SET status = new_status WHERE id = ride_uuid;
  IF lat IS NOT NULL AND auth.uid() IS NOT NULL THEN 
    UPDATE profiles SET lat = lat, lng = lng, status = 'online' WHERE id = auth.uid(); 
  END IF;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION accept_ride_offer(ride_uuid uuid, offer_uuid uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_offer record; v_ride record;
BEGIN
  SELECT * INTO v_offer FROM ride_offers WHERE id = offer_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Oferta no encontrada'; END IF;
  SELECT * INTO v_ride FROM rides WHERE id = ride_uuid FOR UPDATE;
  IF v_ride.status <> 'REQUESTING' THEN RAISE EXCEPTION 'Viaje ya no está disponible'; END IF;
  
  -- Asignar conductor y actualizar estado
  UPDATE rides SET driver_id = v_offer.driver_id, price = v_offer.offered_price, status = 'ACCEPTED' WHERE id = ride_uuid;
  
  -- Rechazar automáticamente otras ofertas para este viaje
  DELETE FROM ride_offers WHERE ride_id = ride_uuid AND id <> offer_uuid;

  RETURN json_build_object('success', true);
END;
$$;

-- ==============================================================================
-- PARTE 6: CONFIGURACIÓN DE REALTIME
-- Habilita las notificaciones en tiempo real para las tablas especificadas.
-- ==============================================================================
DO $$
BEGIN
  -- Habilita realtime en la publicación 'supabase_realtime'
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'driver_applications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_applications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo configurar realtime automáticamente. Habilítalo manualmente en el dashboard de Supabase.';
END;
$$;

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
