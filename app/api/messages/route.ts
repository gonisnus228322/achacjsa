import { NextResponse } from 'next/server';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  attachmentName?: string;
  timestamp: string;
}

// In-memory message store (persists while server is running)
let messages: ChatMessage[] = [
  {
    id: 'welcome-1',
    username: 'xalaxxi',
    text: 'Welcome to the private server! Feel free to share files, photos, or videos here.',
    timestamp: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: body.username,
      text: body.text || '',
      attachmentUrl: body.attachmentUrl,
      attachmentType: body.attachmentType,
      attachmentName: body.attachmentName,
      timestamp: new Date().toISOString(),
    };

    messages.push(newMessage);
    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
