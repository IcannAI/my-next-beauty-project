import { NextRequest, NextResponse } from 'next/server';
import { triggerChatMessage } from '@/infrastructure/socket/pusher-server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { message, userName } = await request.json();

    if (!message || !userName) {
      return NextResponse.json({ error: 'Missing message or userName' }, { status: 400 });
    }

    const chatData = {
      id: Math.random().toString(36).substring(7),
      userName,
      message,
      timestamp: new Date().toISOString(),
    };

    await triggerChatMessage(id, chatData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
