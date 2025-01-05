import { Room, Client } from "@colyseus/core";
import { patrolRoomState, ClientData } from "./schema/patrolRoomState";

export class patrolRoom extends Room<patrolRoomState> {
  onCreate(options: any) {
    this.setState(new patrolRoomState());

    this.onMessage("update_department_server", (client, message) => {
      console.log(`Received update from client ${client.sessionId}:`, message);

      if (message.selectedDepartment) {
        // update the state 
        this.state.selectedDepartment = message.selectedDepartment;
        console.log(`Updated selected department to ${message.selectedDepartment}`);
      }
      if (message.selectedServer) {
        this.state.selectedServer = message.selectedServer;
      }

      this.broadcastUpdatedDepartmentServer();
    });

    this.onMessage("patrol_invite", (client, message) => {
      if (
        !message?.websiteID ||
        !message?.targetWebsiteID ||
        !message?.selectedDepartment ||
        !message?.selectedServer
      ) {
        return;
      }

      const targetClient = this.clients.find(
        (c) => c.id === message.targetWebsiteID // Use `id` to uniquely identify clients
      );

      if (targetClient) {
        targetClient.send("patrol_invite", message);
        console.log(`Sent patrol invite to ${message.targetWebsiteID}`);
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(`Client ${client.sessionId} joined with options:`, options);

    // Add the client to the ArraySchema if not already present
    const existingClient = this.state.clients.find(
      (c) => c.websiteID === options.websiteID
    );

    if (!existingClient) {
      const newClient = new ClientData();
      newClient.sessionId = client.sessionId;
      newClient.websiteID = options.websiteID;
      newClient.name = options.name || "Guest";

      this.state.clients.push(newClient);

      this.broadcastUpdatedClients();
    }

    client.send("update_department_server", {
      selectedDepartment: this.state.selectedDepartment,
      selectedServer: this.state.selectedServer,
    });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left the room.`);

    const index = this.state.clients.findIndex((c) => c.sessionId === client.sessionId);
    if (index !== -1) {
      this.state.clients.splice(index, 1);
      this.broadcastUpdatedClients();
    }
  }

  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }

  private broadcastUpdatedDepartmentServer() {
    this.broadcast("update_department_server", {
      selectedDepartment: this.state.selectedDepartment,
      selectedServer: this.state.selectedServer,
    });
  }

  private broadcastUpdatedClients() {
    const clientsList = this.state.clients.map((client) => ({
      sessionId: client.sessionId,
      websiteID: client.websiteID,
      name: client.name,
    }));

    this.broadcast("update_clients", { clients: clientsList });
  }
}
