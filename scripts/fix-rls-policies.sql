-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can read all lotteries" ON lotteries;
DROP POLICY IF EXISTS "Admins can insert lotteries" ON lotteries;
DROP POLICY IF EXISTS "Users can read all lottery participants" ON lottery_participants;
DROP POLICY IF EXISTS "Users can insert lottery participants" ON lottery_participants;
DROP POLICY IF EXISTS "Users can update lottery participants" ON lottery_participants;

-- Disable RLS temporarily to allow our custom auth system to work
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotteries DISABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_participants DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these permissive policies instead
-- CREATE POLICY "Allow all operations" ON users FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations" ON lotteries FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations" ON lottery_participants FOR ALL USING (true) WITH CHECK (true);
