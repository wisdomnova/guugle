import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

export type ProjectDiscovery = {
  id: string;
  name: string;
  category: string;
  chain: string;
  stage: string;
  founders: string;
  rugScore: number;
  innovationScore: number;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
  description: string;
};

export const MOCK_DISCOVERIES: ProjectDiscovery[] = [
  {
    id: "1",
    name: "Aetheria Protocol",
    category: "AI x Web3",
    chain: "Solana",
    stage: "Seed / Stealth",
    founders: "Anonymous (Ex-DeepMind)",
    rugScore: 12,
    innovationScore: 94,
    sentiment: "positive",
    tags: ["Agentic AI", "ZK-LLM", "Infrastructure"],
    description: "Privacy-preserving LLM inference on-chain using zero-knowledge proofs. Gaining rapid traction in research circles."
  },
  {
    id: "2",
    name: "Nexus Liquidity",
    category: "DeFi",
    chain: "Base",
    stage: "Public Beta",
    founders: "Verified (Team from Uniswap-v3)",
    rugScore: 5,
    innovationScore: 82,
    sentiment: "positive",
    tags: ["DEX", "Concentrated Liquidity"],
    description: "Next-gen AMM focus on capital efficiency for L2 ecosystems. High smart money accumulation detected."
  },
  {
    id: "3",
    name: "MemeForge AI",
    category: "Meme Tools",
    chain: "Solana",
    stage: "Launched",
    founders: "Anonymous",
    rugScore: 78,
    innovationScore: 45,
    sentiment: "negative",
    tags: ["Launchpad", "AI Agent"],
    description: "Automated meme coin generator using AI. Red flags detected in contract owner permissions and wallet clustering."
  }
];

export const getRiskColor = (score: number) => {
  if (score < 30) return "text-brand-risk-low border-brand-risk-low/20 bg-brand-risk-low/5";
  if (score < 60) return "text-brand-risk-medium border-brand-risk-medium/20 bg-brand-risk-medium/5";
  return "text-brand-risk-high border-brand-risk-high/20 bg-brand-risk-high/5";
};

export const getRiskIcon = (score: number) => {
  if (score < 30) return <ShieldCheck size={14} />;
  if (score < 60) return <ShieldQuestion size={14} />;
  return <ShieldAlert size={14} />;
};
