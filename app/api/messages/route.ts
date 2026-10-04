import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ChatMessage {
  id: string;
  username: string;
  avatarUrl?: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentName?: string;
  timestamp: string;
}

const FILE_PATH = path.join('/tmp', 'messages.json');

function readMessages(): ChatMessage[] {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data) || [];
  } catch {
    return [];
  }
}

function writeMessages(messages: ChatMessage[]) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save messages to disk:', err);
  }
}

export async function GET() {
  const messages = readMessages();
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: body.username || 'Anonymous',
      avatarUrl: body.avatarUrl || '',
      text: body.text || '',
      attachmentUrl: body.attachmentUrl,
      attachmentType: body.attachmentType,
      attachmentName: body.attachmentName,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = readMessages();
    currentMessages.push(newMessage);
    writeMessages(currentMessages);

    return NextResponse.json(newMessage, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing message ID' }, { status: 400 });
    }

    let currentMessages = readMessages();
    currentMessages = currentMessages.filter((msg) => msg.id !== id);
    writeMessages(currentMessages);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
