-- Test per verificare se il service role può accedere al profilo HobbY
-- Da eseguire in Supabase SQL Editor

-- 1. Verifica che l'utente HobbY esista
SELECT id, email, full_name, referred_by, credits
FROM profiles
WHERE full_name = 'HobbY'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Test con l'ID specifico (sostituisci con l'ID corretto dal database)
SELECT id, email, full_name, referred_by, credits
FROM profiles
WHERE id = 'e874c388-8ff7-4da0-8750-0d6fd9d59d52';

-- 3. Verifica policies RLS per service role
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Se la policy blocca, temporaneamente disabilita RLS per test
-- ATTENZIONE: Solo per debugging, riabilitare dopo!
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. Per riabilitare RLS dopo test:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
