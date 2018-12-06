import app from '../app';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as socketio from 'socket.io';
import config from '../config';
import 'reflect-metadata';
import { createConnection, ConnectionOptions } from 'typeorm';
import { AuthClientType } from '../services/auth.client';
import { container } from '../ioc.container';
import { UserServiceType } from '../services/user.service';
import { AuthException } from '../exceptions/exceptions';
import { ChatServiceType } from '../services/chat.service';
import { Logger } from '../logger';
import { User } from '../entities/user';

/**
 * Create HTTP server.
 */
const httpServer = http.createServer(app);
const io = socketio(httpServer);
const ormOptions: ConnectionOptions = config.typeOrm as ConnectionOptions;
const logger = Logger.getInstance('APP_LOG');

createConnection(ormOptions).then(async connection => {

  const authClient: AuthClientInterface = container.get(AuthClientType);
  const userService: UserServiceInterface = container.get(UserServiceType);
  const chatService: ChatServiceInterface = container.get(ChatServiceType);
  const sock = io.of('/');
  sock.use(async(socket, next) => {
    let handshake = socket.handshake;
    if (handshake.query.token) {
      const result = await authClient.verifyUserToken(handshake.query.token);
      socket.handshake.query.email = result.login;
      socket.request.user = await connection.getMongoRepository(User).findOne({ email: result.login });
      next();
    } else {
      next(new AuthException('Authentication error'));
    }
  });

  let sockets = {};

  // TODO: res:conversations
  sock.on('connection', async(socket) => {
    const user = await connection.getMongoRepository(User).findOne({ email: socket.handshake.query.email });
    logger.debug('User connected to socket', user.email);
    sockets[user.id.toString()] = socket;

    sockets[user.id.toString()].emit('res:conversations', await chatService.listConversations(user));

    socket.on('message', async(message) => {
      const textMessage = await chatService.sendMessage(user, message);
      logger.debug('Sending message from ', user.email, 'to ', message.receiverId);
      if (sockets[message.receiverId]) {
        sockets[message.receiverId].emit('message', textMessage);
        sockets[message.receiverId].emit('res:conversations', await chatService.listConversations(message.receiverId));
      }
    });

    socket.on('req:conversations', async(request) => {
      sockets[user.id.toString()].emit('res:conversations', []);
    });

    socket.on('req:frindOrCreateConversation', async(request) => {
      logger.debug('Creating conversation ', user.email, request.userId);
      // emit res:conversation
      // emit res:conversations if new conversation created
      sockets[user.id.toString()].emit('conversationCreated',
        await chatService.findOrCreateConversation(user.id.toString(), request.userId)
      );
    });

    socket.on('req:messages', async(request) => {
      logger.debug('Loading messages ' + request.conversationId);
      let messages;
      if (request.key) { messages = await chatService.fetchMessages(request.conversationId, Number(request.key)); }
      else { messages = await chatService.fetchMessages(request.conversationId); }
      sockets[user.id.toString()].emit('res:messages',
        messages
      );
    });

    socket.on('fetchMoreMessages', async(request) => {
      const messages = await chatService.fetchMessages(request.conversationId, Number(request.key));
      sockets[user.id.toString()].emit('loadMoreMessages', messages);
      logger.debug('Fetching more', messages);
    });

    socket.on('disconnect', (reason) => {
      logger.debug('Disconnected ' + user.id.toString() + ' ' + reason);
      delete sockets[user.id.toString()];
    });
  });

  /**
   * Listen on provided port, on all network interfaces.
   */
  if (config.app.httpServer === 'enabled') {
    httpServer.listen(config.app.port);
  }

  if (config.app.httpsServer === 'enabled') {
    const httpsOptions = {
      key: fs.readFileSync(__dirname + '/../certs/key.pem'),
      cert: fs.readFileSync(__dirname + '/../certs/crt.pem'),
      ca: fs.readFileSync(__dirname + '/../certs/cloudflare.ca'),
      requestCert: true,
      rejectUnauthorized: false
    };
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(config.app.httpsPort);

  }
}).catch(error => console.log('TypeORM connection error: ', error));
