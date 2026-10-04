import { NextResponse } from 'next/server';

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
      avatarUrl: body.avatarUrl || '',
      text: body.text || '',
      attachmentUrl: body.attachmentUrl,
      attachmentType: body.attachmentType,
      attachmentName: body.attachmentName,
      timestamp: new Date().toISOString(),
    };

    messages.push(newMessage);
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

    messages = messages.filter((msg) => msg.id !== id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
