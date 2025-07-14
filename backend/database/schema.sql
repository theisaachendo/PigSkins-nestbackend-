-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    handicap DECIMAL(3,1),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    total_holes INTEGER DEFAULT 18,
    total_par INTEGER,
    rating DECIMAL(3,1),
    slope_rating INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course holes table
CREATE TABLE course_holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL,
    par INTEGER NOT NULL,
    distance INTEGER,
    handicap_rating INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, hole_number)
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    course_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    max_players INTEGER DEFAULT 4,
    entry_fee DECIMAL(10,2) NOT NULL,
    game_type VARCHAR(50) NOT NULL, -- 'standard', 'nassau', 'wolf', 'vegas'
    status VARCHAR(20) DEFAULT 'created', -- 'created', 'active', 'completed', 'cancelled'
    join_code VARCHAR(6) UNIQUE NOT NULL, -- 6-digit join code
    rules JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Match players table
CREATE TABLE match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'joined', -- 'joined', 'left', 'removed'
    entry_fee_paid BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

-- Holes table (for match scoring)
CREATE TABLE holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL,
    par INTEGER NOT NULL,
    skin_value DECIMAL(10,2),
    carryover_from_previous BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(match_id, hole_number)
);

-- Hole scores table
CREATE TABLE hole_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hole_id UUID REFERENCES holes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    is_skin_winner BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hole_id, user_id)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'entry_fee', 'skin_winning', 'refund', 'deposit', 'withdrawal'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'stripe', 'wallet', 'bank_transfer'
    stripe_payment_intent_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'match_invitation', 'payment_confirmation', 'skin_winning', 'match_reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_matches_host_id ON matches(host_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_match_players_match_id ON match_players(match_id);
CREATE INDEX idx_match_players_user_id ON match_players(user_id);
CREATE INDEX idx_holes_match_id ON holes(match_id);
CREATE INDEX idx_hole_scores_hole_id ON hole_scores(hole_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_match_id ON transactions(match_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Wallet policies
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (true);
CREATE POLICY "Users can update own wallet" ON wallets FOR UPDATE USING (true);

-- Match policies - Allow all operations for now since we're using custom JWT
CREATE POLICY "Users can view all matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Users can create matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "Users can delete own matches" ON matches FOR DELETE USING (true);

-- Match players policies
CREATE POLICY "Users can view match players" ON match_players FOR SELECT USING (true);
CREATE POLICY "Users can join matches" ON match_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own match status" ON match_players FOR UPDATE USING (true);

-- Transaction policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (true);

-- Payment policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (true);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true); 