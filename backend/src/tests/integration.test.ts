import { describe, it, beforeEach, beforeAll, expect } from "bun:test";
import { redisClient } from "../config/redisClient";
import request from "supertest";
import server from "../index";
import { io } from "socket.io-client";

const roomName = "room-name";
const nominations = ["candidate 1", "candidate 2", "candidate 3"];
const users = ["host", "user1", "user2"];

describe("Full integration test", () => {
  let roomId: string;
  let hostKey: string;
  beforeAll(async () => {
    redisClient.FLUSHDB();
    const socket = io();
  });

  it("should create room succesfully", async () => {
    const response = await request(server).post("/rooms/create").send({
      roomName: roomName,
      userName: users[0],
    });
    expect(response.status).toBe(200);
    ({ roomId, hostKey } = response.body);

    expect(response.body.roomName).toBe(roomName);
    expect(response.body.message).toBeDefined();
    expect(roomId).toBeDefined();
    expect(hostKey).toBeDefined();

    console.log("created room with id: " + roomId);
    console.log("hostkey is: " + hostKey);
  });
});
