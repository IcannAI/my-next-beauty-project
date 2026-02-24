import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const triggerChatMessage = async (liveId: string, message: any) => {
  return await pusher.trigger(`live-${liveId}`, 'chat-message', message);
};

export default pusher;
