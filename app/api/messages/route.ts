import { NextResponse } from 'next/server';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentName?: string;
  timestamp: string;
}

// Memory store initialized to empty
let messages: ChatMessage[] = [];

export async function GET() {
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: body.username || 'Anonymous',
      text: body.text || '',
      attachmentUrl: body.attachmentUrl,
      attachmentType: body.attachmentType,
      attachmentName: body.attachmentName,
      timestamp: new Date().toISOString(),
    };

    messages.push(newMessage);
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
