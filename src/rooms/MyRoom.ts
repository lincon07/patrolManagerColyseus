import { Room, Client } from "@colyseus/core";
import { MyRoomState, ClientSchema } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState()); // Initialize the room state

    this.onMessage("type", (client, message) => {
      console.log(`Message received from ${client.sessionId}:`, message);
    });
  }

  onJoin(client: Client, options: any) {
    const newClient = new ClientSchema();
    newClient.name = options.name || "Guest";
    newClient.websiteID = options.websiteID || "0";
    newClient.avatar = options.avatar || "";
    newClient.sessionId = client.sessionId;

    this.state.clients.push(newClient); // Push to the ArraySchema

    // Broadcast updated client list to all clients
    this.broadcast("update_clients", {
      clients: this.state.clients.map((client) => ({
        name: client.name,
        avatar: client.avatar,
        websiteID: client.websiteID,
      })),
    });

    console.log(`Client ${client.sessionId} joined.`);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left.`);

    // Find the client in the ArraySchema and remove it
    const index = this.state.clients.findIndex(
      (c) => c.sessionId === client.sessionId
    );
    if (index !== -1) {
      this.state.clients.splice(index, 1); // Remove from the ArraySchema
    }

    // Broadcast updated client list to all clients
    this.broadcast("update_clients", {
      clients: this.state.clients.map((client) => ({
        name: client.name,
        avatar: client.avatar,
        websiteID: client.websiteID,
      })),
    });
  }

  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }
}
