import { describe, it, expect, beforeEach, mock } from "bun:test";
import SocketService from "../../config/SocketService";
import { Server, Socket } from "socket.io";

// Mock the Server and Socket classes from socket.io
const mockSocket = {
  join: mock(async (room: string) => {}),
  on: mock((event: string, callback: (...args: any[]) => void) => {}),
  emit: mock((event: string, ...args: any[]) => {}),
  id: "test-socket-id",
};

const mockEmit = mock((event: string, ...args: any[]) => {});
const mockIo = {
  on: mock(
    (event: string, callback: (socket: Partial<Socket>) => void) => {},
  ),
  to: mock((room: string) => ({ emit: mockEmit })),
  sockets: {
    adapter: {
      rooms: {
        get: mock((room: string) => new Set(["test-socket-id"])),
      },
    },
    sockets: {
      size: 1,
    },
  },
};

describe("SocketService", () => {
  let socketService: SocketService;

  beforeEach(() => {
    // Reset mocks
    mockIo.on.mockClear();
    mockIo.to.mockClear();
    mockEmit.mockClear();
    mockSocket.join.mockClear();
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();

    // Create a new instance of the service with the mock io server
    socketService = new SocketService(mockIo as any);
  });

  describe("Event Handlers", () => {
    it("should set up connection event handler", () => {
      expect(mockIo.on).toHaveBeenCalledWith(
        "connection",
        expect.any(Function),
      );
    });
  });

  describe("Business Logic", () => {
    it("should emit new nomination", () => {
      const roomId = "test-room";
      const nominee = { name: "John Doe" };
      socketService.emitNewNomination(roomId, nominee);

      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockEmit).toHaveBeenCalledWith("new-nomination", {
        nominee,
        roomId,
      });
    });

    it("should emit state change", () => {
      const roomId = "test-room";
      const state = "voting";
      socketService.emitStateChange(roomId, state);

      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockEmit).toHaveBeenCalledWith("state-change", {
        state,
        roomId,
      });
    });

    it("should emit new user", () => {
      const roomId = "test-room";
      const userName = "Test User";
      socketService.emitNewUser(roomId, userName);

      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockEmit).toHaveBeenCalledWith("new-user", {
        userName,
        roomId,
      });
    });

    it("should emit new vote", () => {
      const roomId = "test-room";
      const userName = "Test User";
      socketService.emitNewVote(roomId, userName);

      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockEmit).toHaveBeenCalledWith("user-voted", {
        userName,
      });
    });
  });

  describe("Utility Methods", () => {
    it("should get room clients", () => {
      const roomId = "test-room";
      const clients = socketService.getRoomClients(roomId);

      expect(clients).toBeInstanceOf(Set);
      expect(clients?.has("test-socket-id")).toBe(true);
    });

    it("should get connected sockets count", () => {
      const count = socketService.getConnectedSockets();
      expect(count).toBe(1);
    });
  });
});