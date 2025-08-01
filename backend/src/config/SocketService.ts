import { Server, Socket } from "socket.io";

export default class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log("User connected:", socket.id);

      socket.on("join-room", async (roomId: string) => {
        await socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });

      // Add more event handlers here as needed
    });
  }

  // Business logic methods
  emitNewNomination(roomId: string, nominee: any) {
    this.io.to(roomId).emit("new-nomination", { nominee, roomId });
  }

  emitStateChange(roomId: string, state: "nominating" | "voting" | "done") {
    this.io.to(roomId).emit("state-change", { state, roomId });
  }

  emitNewUser(roomId: string, userName: string) {
    this.io.to(roomId).emit("new-user", { userName, roomId });
  }

  emitNewVote(roomId: string, userName: string) {
    this.io.to(roomId).emit("user-voted", { userName });
  }

  emitWinner(roomId: string, winner: string) {
    this.io.to(roomId).emit("winner", winner);
  }

  emitNewMessage(roomId: string, userName: string, message: string) {
    this.io.to(roomId).emit("new-message", { userName, message });
  }

  // Utility methods
  getRoomClients(roomId: string) {
    return this.io.sockets.adapter.rooms.get(roomId);
  }

  getConnectedSockets() {
    return this.io.sockets.sockets.size;
  }
}
