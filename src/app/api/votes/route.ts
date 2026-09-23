import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface VoteData {
  up: number;
  down: number;
}

type VotesMap = Record<string, VoteData>;

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'votes.json');

// In-memory cache for fast response times
let memoryVotes: VotesMap | null = null;

function loadVotes(): VotesMap {
  if (memoryVotes !== null) return memoryVotes;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryVotes = JSON.parse(raw);
      return memoryVotes || {};
    }
  } catch (err) {
    console.error('Error loading votes:', err);
  }
  memoryVotes = {};
  return memoryVotes;
}

function saveVotes(votes: VotesMap) {
  memoryVotes = votes;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving votes:', err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  const votes = loadVotes();

  if (campaignId) {
    const data = votes[campaignId] || { up: 0, down: 0 };
    return NextResponse.json(data);
  }

  return NextResponse.json(votes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, voteType, previousVote } = body;

    if (campaignId === undefined || campaignId === null) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    const idStr = String(campaignId);
    const votes = loadVotes();
    const current = votes[idStr] || { up: 0, down: 0 };

    let up = typeof current.up === 'number' ? current.up : 0;
    let down = typeof current.down === 'number' ? current.down : 0;

    // Remove previous vote if one existed
    if (previousVote === 'up') up = Math.max(0, up - 1);
    if (previousVote === 'down') down = Math.max(0, down - 1);

    // Add new vote
    if (voteType === 'up') up += 1;
    if (voteType === 'down') down += 1;

    votes[idStr] = { up, down };
    saveVotes(votes);

    return NextResponse.json(votes[idStr]);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
