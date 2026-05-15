-- Web3 Intelligence Platform - Supabase Schema

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  stage VARCHAR(50) NOT NULL CHECK (stage IN ('ideation', 'alpha', 'beta', 'launched', 'mature')),
  website VARCHAR(500),
  x_account VARCHAR(255),
  description TEXT,
  product_status VARCHAR(50) NOT NULL,
  token_status VARCHAR(50) NOT NULL,
  community_size INTEGER DEFAULT 0,
  github_activity INTEGER DEFAULT 0,
  liquidity_signals INTEGER DEFAULT 0,
  rug_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (rug_risk_score >= 0 AND rug_risk_score <= 100),
  legitimacy_score INTEGER NOT NULL DEFAULT 0,
  innovation_score INTEGER NOT NULL DEFAULT 0,
  survival_probability VARCHAR(20) NOT NULL DEFAULT 'medium',
  funding_amount BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_intelligence_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Founders Table
CREATE TABLE IF NOT EXISTS project_founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  founder_name VARCHAR(255) NOT NULL,
  twitter_handle VARCHAR(255),
  linkedin_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Red Flags Table
CREATE TABLE IF NOT EXISTS project_red_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positive Signals Table
CREATE TABLE IF NOT EXISTS project_positive_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  signal TEXT NOT NULL,
  strength VARCHAR(20) DEFAULT 'medium' CHECK (strength IN ('weak', 'medium', 'strong')),
  evidence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investors Table
CREATE TABLE IF NOT EXISTS project_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  investor_name VARCHAR(255) NOT NULL,
  investor_type VARCHAR(50) CHECK (investor_type IN ('vc', 'angel', 'strategic', 'community')),
  investment_amount BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intelligence Reports (Audit Trail)
CREATE TABLE IF NOT EXISTS intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rug_risk_score INTEGER,
  legitimacy_score INTEGER,
  innovation_score INTEGER,
  analyst_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- On-Chain Signals Table
CREATE TABLE IF NOT EXISTS onchain_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_address VARCHAR(255),
  deployer_wallet VARCHAR(255),
  total_liquidity BIGINT,
  liquidity_locked BOOLEAN,
  lock_duration_days INTEGER,
  minted_tokens BIGINT,
  burned_tokens BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Metrics Table
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platform VARCHAR(50) CHECK (platform IN ('twitter', 'telegram', 'discord', 'github', 'mirror', 'farcaster')),
  followers_count INTEGER,
  engagement_rate DECIMAL(5,2),
  sentiment_score DECIMAL(3,2),
  organic_growth_pct DECIMAL(5,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_chain ON projects(chain);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_projects_rug_risk ON projects(rug_risk_score);
CREATE INDEX idx_projects_created ON projects(created_at);
CREATE INDEX idx_project_founders ON project_founders(project_id);
CREATE INDEX idx_project_red_flags ON project_red_flags(project_id);
CREATE INDEX idx_project_positive_signals ON project_positive_signals(project_id);
CREATE INDEX idx_onchain_signals ON onchain_signals(project_id);
CREATE INDEX idx_social_metrics ON social_metrics(project_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_positive_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read-only for now
CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Founders are viewable by everyone" ON project_founders FOR SELECT USING (true);
CREATE POLICY "Red flags are viewable by everyone" ON project_red_flags FOR SELECT USING (true);
CREATE POLICY "Positive signals are viewable by everyone" ON project_positive_signals FOR SELECT USING (true);
CREATE POLICY "Investors are viewable by everyone" ON project_investors FOR SELECT USING (true);
CREATE POLICY "Reports are viewable by everyone" ON intelligence_reports FOR SELECT USING (true);
CREATE POLICY "On-chain signals are viewable by everyone" ON onchain_signals FOR SELECT USING (true);
CREATE POLICY "Social metrics are viewable by everyone" ON social_metrics FOR SELECT USING (true);
