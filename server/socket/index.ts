import { Server } from 'socket.io';
import tracer from 'dd-trace';

const io = new Server();

io.on('connection', (socket) => {
  const connSpan = tracer.startSpan('socket.connection', {
    tags: {
      'socket.id': socket.id,
      'socket.transport': socket.conn.transport.name,
    },
  });

  socket.on('chat', (msg) => {
    tracer.scope().activate(connSpan, () => {
      const chatSpan = tracer.startSpan('socket.chat', {
        tags: {
          'chat.message_length': msg.length,
          'chat.room': socket.rooms,
        },
      });

      // 處理聊天邏輯... (例如 io.emit('chat', msg))

      chatSpan.finish();
    });
  });

  socket.on('disconnect', () => {
    connSpan.finish();
  });
});

export default io;
