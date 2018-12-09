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
import { AuthException, CustomError } from '../exceptions/exceptions';
import { ChatServiceType } from '../services/chat.service';
import { Logger } from '../logger';
import { User } from '../entities/user';
import { Message } from '../entities/message';

/**
 * Create HTTP server.
 */
const httpServer = http.createServer(app);
const io = socketio(httpServer, { pingTimeout: 150000, pingInterval: 30000 });
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
  let calls = {};

  // TODO: res:conversations
  sock.on('connection', async(socket) => {
    const user = await connection.getMongoRepository(User).findOne({ email: socket.handshake.query.email });
    logger.debug('User connected to socket', user.email);
    sockets[user.id.toString()] = socket;

    sockets[user.id.toString()].emit('res:conversations', await chatService.listConversations(user));

    socket.on('req:sendMessage', async(message) => {
      const textMessage: Message = await chatService.sendMessage(user, message);
      if (sockets[textMessage.receiver.id.toString()]) {
        sockets[textMessage.receiver.id.toString()].emit('res:receiveMessage', textMessage);
        sockets[textMessage.receiver.id.toString()].emit('res:conversations', await chatService.listConversations(textMessage.receiver.id.toString()));
      }
    });

    socket.on('req:messages', async(request) => {
      let messages;
      if (request.key) {
        messages = await chatService.fetchMessages(request.conversationId, Number(request.key));
      } else { messages = await chatService.fetchMessages(request.conversationId); }
      sockets[user.id.toString()].emit('res:messages',
        messages
      );
    });

    socket.on('req:conversations', async(request) => {
      sockets[user.id.toString()].emit('res:conversations', await chatService.listConversations(user.id.toString()));
    });

    socket.on('req:findOrCreateConversation', async(request) => {
      const conversationId = chatService.getConversationId(user.id.toString(), request.userId);
      const existedBefore = await chatService.conversationExists(conversationId);
      const conversation = await chatService.findOrCreateConversation(user.id.toString(), request.userId);
      sockets[user.id.toString()].emit('res:conversation', conversation);
      if (!existedBefore) {
        sockets[user.id.toString()].emit('res:conversations', await chatService.listConversations(user.id.toString()));
      }
    });

    socket.on('req:call', async(request) => {
      const friendId = chatService.findAnotherUserId(user.id.toString(), request.conversationId);
      calls[request.conversationId] = {
        caller: { id: user.id.toString(), ready: false },
        callee: { id: friendId, ready: false }
      };
      sockets[friendId].emit('res:incomingCall', { conversationId: request.conversationId, user });
    });

    socket.on('req:acceptCall', async(request) => {
      logger.debug('Call accepted by user: ', user.email);
      const friendId = chatService.findAnotherUserId(user.id.toString(), request.conversationId);
      sockets[friendId].emit('res:callAccepted', { conversationId: request.conversationId });
    });

    socket.on('req:declineCall', async(request) => {
      const friendId = chatService.findAnotherUserId(user.id.toString(), request.conversationId);
      sockets[friendId].emit('res:callDeclined', { conversationId: request.conversationId });
    });

    socket.on('req:imReady', async(conversationId) => {
      logger.debug(user.email + ' ready for handling call');
      if (!calls[conversationId]) throw new CustomError('Requested conversation call does not exist');
      if (calls[conversationId].caller.id === user.id.toString()) calls[conversationId].caller.ready = true;
      if (calls[conversationId].callee.id === user.id.toString()) calls[conversationId].callee.ready = true;
      if (calls[conversationId].callee.ready === true && calls[conversationId].caller.ready === true) {
        logger.debug('Tell caller to init call: ', calls[conversationId].caller.id);
        sockets[calls[conversationId].caller.id].emit('res:uCaller');
      }
    });

    socket.on('req:offer', (data) => {
      logger.debug(user.email + ' sent an offer');
      const friendId = chatService.findAnotherUserId(user.id.toString(), data.conversationId);
      sockets[friendId].emit('res:offer', data);
    });

    socket.on('req:answer', (data) => {
      logger.debug(user.email + ' sent an answer');
      const friendId = chatService.findAnotherUserId(user.id.toString(), data.conversationId);
      sockets[friendId].emit('res:answer', data);
    });

    socket.on('req:ice', (data) => {
      const friendId = chatService.findAnotherUserId(user.id.toString(), data.conversationId);
      sockets[friendId].emit('res:ice', data);
    });

    // socket.on('join', function(name, callback) {
    //   try {
    //     const friendId = chatService.findAnotherUserId(user.id.toString(), name);
    //     logger.debug('join', name);
    //     callback([friendId]);
    //     socket.join(name);
    //     sockets[user.id.toString()].room = name;
    //   } catch (err) {
    //     logger.warn('User failed request: ' + user.email);
    //     logger.error('ConversationId not found');
    //   }
    // });

    // socket.on('exchange', function(data) {
    //   data.from = user.id.toString();
    //   logger.debug('User initiated exchange ' + data.from);
    //   if (sockets[data.to]) {
    //     sockets[data.to].emit('exchange', data);
    //   } else {
    //     logger.debug('Receiver ' + data.to + 'disconnected from socket');
    //   }
    // });

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
