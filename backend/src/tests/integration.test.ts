import { describe, it, afterAll, beforeAll, expect } from "bun:test";
import { redisClient } from "../config/redisClient";
import request from "supertest";
import server from "../index";
import { io } from "socket.io-client";

const roomName = "room-name";
const nominations = ["candidate 1", "candidate 2", "candidate 3"];
const users = ["host", "user1", "user2"];
const votes = [
  ["0", "1", "2"],
  ["0", "2", "1"],
  ["1", "0", "2"],
];

describe("Full API integration test", () => {
  let roomId: string;
  let hostKey: string;
  beforeAll(async () => {
    redisClient.FLUSHDB();
  });
  afterAll(async () => {
    redisClient.FLUSHDB();
  });

  it("should create room succesfully", async () => {
    const response = await request(server).post("/rooms/create").send({
      roomName: roomName,
      userName: users[0],
    });
    expect(response.status).toBe(201);
    ({ roomId, hostKey } = response.body);

    expect(response.body.roomName).toBe(roomName);
    expect(response.body.message).toBeDefined();
    expect(roomId).toBeDefined();
    expect(hostKey).toBeDefined();

    console.log("created room with id: " + roomId);
    console.log("hostkey is: " + hostKey);
  });

  it("should let users join a room", async () => {
    for (const user of users) {
      const response = await request(server).post("/room/join").send({
        roomId: roomId,
        userName: user,
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.roomId).toBe(roomId);
      expect(response.body.userName).toBe(user);
    }
  });

  it("should move to nomination succesfully", async () => {
    const response = await request(server)
      .post(`/rooms/${roomId}/setVoting`)
      .send({
        hostKey: hostKey,
      });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("room set to voting succesfully");
  });

  it("should nominate the candidates succesfully", async () => {
    for (const nomination of nominations) {
      const response = await request(server)
        .post(`/rooms/${roomId}/nomination`)
        .send({
          hostKey: hostKey,
          nominee: nomination,
        });
      expect(response.status).toBe(200);
      expect(response.body.nominee).toBe(nomination);
    }
  });

  it("should let users vote succesfully", async () => {
    for (let i = 0; i < users.length; i++) {
      const response = await request(server).post(`/room/${roomId}/vote`).send({
        vote: votes[i],
        userName: users[i],
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("vote saved");
    }
  });

  it("should move to 'done' stage succesfully", async () => {
    const response = await request(server)
      .post(`/rooms/${roomId}/setDone`)
      .send({
        hostKey: hostKey,
      });
    expect(response.status).toBe(200);
    expect(response.body.winner).toBe(nominations[0]);
  });

  it("should get room info succesfully after done", async () => {
    const response = await request(server)
      .post(`/room/${roomId}/getRoomData`)
      .send({
        userName: users[1],
      });
    expect(response.status).toBe(200);
    expect(response.body.role).toBe("user");
    expect(response.body.users).toEqual(users);
    expect(response.body.state).toBe("done");
    expect(Object.values(response.body.nominations)).toEqual(nominations);
    expect(response.body.winner).toBe(nominations[0]);
  });
});
