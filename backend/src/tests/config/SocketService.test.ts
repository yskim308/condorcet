import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Server } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import SocketService from "../../config/SocketService";
import { AddressInfo } from "net";

describe("SocketService", () => {
  let io: Server,
    serverSocket: any,
    clientSocket: ClientSocket,
    socketService: SocketService,
    port: number;

  beforeEach((done) => {
    io = new Server();
    io.listen(() => {
      port = (io.httpServer.address() as AddressInfo).port;
      socketService = new SocketService(io);

      clientSocket = ioc(`http://localhost:${port}`, {
        reconnection: false,
        forceNew: true,
        transports: ["websocket"],
      });

      io.on("connection", (socket) => {
        serverSocket = socket;
      });

      clientSocket.on("connect", () => {
        done();
      });
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.disconnect();
  });

  it("should handle user connection", () => {
    expect(serverSocket.id).toBeDefined();
    expect(socketService.getConnectedSockets()).toBe(1);
  });

  it("should handle join-room event", async () => {
    const roomId = "test-room";
    clientSocket.emit("join-room", roomId);

    // Wait for the server to process the event
    await new Promise((resolve) => setTimeout(resolve, 100));

    const rooms = serverSocket.rooms;
    expect(rooms).toContain(roomId);
  });

  it("should handle disconnect event", (done) => {
    clientSocket.on("disconnect", () => {
      expect(socketService.getConnectedSockets()).toBe(0);
      done();
    });

    clientSocket.disconnect();
  });

  it("should emit new-nomination event", (done) => {
    const roomId = "test-room";
    const nominee = { name: "John Doe" };

    clientSocket.emit("join-room", roomId);

    clientSocket.on("new-nomination", (data) => {
      expect(data.nominee).toEqual(nominee);
      expect(data.roomId).toEqual(roomId);
      done();
    });

    socketService.emitNewNomination(roomId, nominee);
  });

  it("should emit state-change event", (done) => {
    const roomId = "test-room";
    const state = "voting";

    clientSocket.emit("join-room", roomId);

    clientSocket.on("state-change", (data) => {
      expect(data.state).toEqual(state);
      expect(data.roomId).toEqual(roomId);
      done();
    });

    socketService.emitStateChange(roomId, state);
  });

  it("should emit new-user event", (done) => {
    const roomId = "test-room";
    const userName = "Test User";

    clientSocket.emit("join-room", roomId);

    clientSocket.on("new-user", (data) => {
      expect(data.userName).toEqual(userName);
      expect(data.roomId).toEqual(roomId);
      done();
    });

    socketService.emitNewUser(roomId, userName);
  });

  it("should get room clients", async () => {
    const roomId = "test-room";
    clientSocket.emit("join-room", roomId);

    // Wait for the server to process the event
    await new Promise((resolve) => setTimeout(resolve, 100));

    const clients = socketService.getRoomClients(roomId);
    expect(clients).toBeDefined();
    expect(clients?.size).toBe(1);
  });
});
