# Condorcet Backend API Documentation

This document provides a detailed description of the API endpoints for the Condorcet backend.

## Host Routes

These routes are intended to be used by the host of a room.

### Create a Room

- **Method:** `POST`
- **Path:** `/rooms/create`
- **Body:**
  - `roomName` (string, required): The name of the room.
  - `userName` (string, required): The name of the host.
- **Success Response:**
  - **Code:** 201
  - **Content:**
    ```json
    {
      "roomId": "string",
      "roomName": "string",
      "message": "Room created successfully",
      "hostKey": "string"
    }
    ```
- **Error Response:**
  - **Code:** 400
  - **Content:**
    ```json
    {
      "error": "roomName and userId are required"
    }
    ```

### Add a Nomination

- **Method:** `POST`
- **Path:** `/rooms/:roomId/nomination`
- **Headers:**
  - `hostKey` (string, required): The key of the host.
- **Body:**
  - `nominee` (string, required): The nominee to add.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "message": "Nominee added successfully",
      "nominee": "string"
    }
    ```
- **Error Response:**
  - **Code:** 400
  - **Content:**
    ```json
    {
      "error": "nominee is required"
    }
    ```
  - **Code:** 401
  - **Content:**
    ```json
    {
      "error": "no host key provided"
    }
    ```
  - **Code:** 403
  - **Content:**
    ```json
    {
      "error": "invalid host key"
    }
    ```

### Set Room to Voting

- **Method:** `POST`
- **Path:** `/rooms/:roomId/setVoting`
- **Headers:**
  - `hostKey` (string, required): The key of the host.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "message": "room set to voting succesfully"
    }
    ```
- **Error Response:**
  - **Code:** 401
  - **Content:**
    ```json
    {
      "error": "no host key provided"
    }
    ```
  - **Code:** 403
  - **Content:**
    ```json
    {
      "error": "invalid host key"
    }
    ```

### Set Room to Done

- **Method:** `POST`
- **Path:** `/rooms/:roomId/setDone`
- **Headers:**
  - `hostKey` (string, required): The key of the host.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "message": "winner succesfully chosen",
      "winner": "string"
    }
    ```
- **Error Response:**
  - **Code:** 401
  - **Content:**
    ```json
    {
      "error": "no host key provided"
    }
    ```
  - **Code:** 403
  - **Content:**
    ```json
    {
      "error": "invalid host key"
    }
    ```

## Participant Routes

These routes are intended to be used by the participants of a room.

### Join a Room

- **Method:** `POST`
- **Path:** `/room/join`
- **Body:**
  - `roomId` (string, required): The ID of the room to join.
  - `userName` (string, required): The name of the participant.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "message": "Joined room successfully",
      "roomId": "string",
      "userName": "string"
    }
    ```
- **Error Response:**
  - **Code:** 400
  - **Content:**
    ```json
    {
      "error": "roomId and userName are required"
    }
    ```
  - **Code:** 404
  - **Content:**
    ```json
    {
      "error": "Room not found"
    }
    ```

### Get Room Data

- **Method:** `POST`
- **Path:** `/room/:roomId/getRoomData`
- **Body:**
  - `userName` (string, required): The name of the participant.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "role": "string",
      "users": ["string"],
      "state": "string",
      "nominations": ["string"],
      "votedUsers": ["string"], // only if state is 'voting'
      "winner": "string" // only if state is 'done'
    }
    ```
- **Error Response:**
  - **Code:** 401
  - **Content:**
    ```json
    {
      "error": "room does not exist"
    }
    ```
  - **Code:** 500
  - **Content:**
    ```json
    {
      "error": "state is null"
    }
    ```
    or
    ```json
    {
      "error": "nominations are null"
    }
    ```

### Vote

- **Method:** `POST`
- **Path:** `/room/:roomId/vote`
- **Body:**
  - `vote` (string[], required): An array of nominees in order of preference.
  - `userName` (string, required): The name of the participant.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "message": "vote saved"
    }
    ```
- **Error Response:**
  - **Code:** 404
  - **Content:**
    ```json
    {
      "error": "user already voted"
    }
    ```

## Chat Routes

These routes are for the chat functionality in a room.

### Get All Messages

- **Method:** `GET`
- **Path:** `/rooms/:roomId/message/getAll`
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    [
      {
        "userName": "string",
        "message": "string"
      }
    ]
    ```

### Send a Message

- **Method:** `POST`
- **Path:** `/rooms/:roomId/message/sendMessage`
- **Body:**
  - `userName` (string, required): The name of the user sending the message.
  - `message` (string, required): The message to send.
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "message": "message sent succesfully to room:string"
    }
    ```
