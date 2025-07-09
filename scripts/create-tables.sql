-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'participant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lotteries table
CREATE TABLE IF NOT EXISTS lotteries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  max_participants INTEGER NOT NULL,
  number_of_winners INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lottery_participants table
CREATE TABLE IF NOT EXISTS lottery_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lottery_id UUID REFERENCES lotteries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_winner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lottery_id, user_id)
);

-- Insert demo users
INSERT INTO users (username, password, name, user_type) VALUES
  ('admin', 'admin123', 'Admin User', 'admin'),
  ('participant1', 'pass123', 'John Doe', 'participant'),
  ('participant2', 'pass123', 'Jane Smith', 'participant'),
  ('participant3', 'pass123', 'Bob Johnson', 'participant')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can read all lotteries" ON lotteries FOR SELECT USING (true);
CREATE POLICY "Admins can insert lotteries" ON lotteries FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Users can read all lottery participants" ON lottery_participants FOR SELECT USING (true);
CREATE POLICY "Users can insert lottery participants" ON lottery_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update lottery participants" ON lottery_participants FOR UPDATE USING (true);
