import { Room, Client } from "@colyseus/core";
import { MyRoomState, ClientSchema, PatrolLogs, SubdivisionUsage, Subdivision, ClientStatus } from "./schema/MyRoomState";
import { ArraySchema } from "@colyseus/schema";

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage("type", (client, message) => {
      console.log(`Message received from ${client.sessionId}:`, message);
    });

    this.onMessage("update_logs", (client, message) => {
      const clientState = this.state.clients.find((c) => c.sessionId === client.sessionId);

      if (clientState && Array.isArray(message.patrolLogs)) {
        clientState.patrolLog = new ArraySchema<PatrolLogs>();
        message.patrolLogs.forEach((log: any) => {
          const patrolLog = new PatrolLogs();
          patrolLog.Department = log.Department || "";
          patrolLog.Server = log.Server || "";
          patrolLog.startDate = log.startDate || "";
          patrolLog.endDate = log.endDate || "";
          patrolLog.Duration = log.Duration || 0;
          patrolLog.Active = log.Active || false;
          patrolLog.Paused = log.Paused || false;

          if (Array.isArray(log.SubdivisionUsage)) {
            patrolLog.SubdivisionUsage = new ArraySchema<SubdivisionUsage>();
            log.SubdivisionUsage.forEach((sub: any) => {
              const subdivisionUsage = new SubdivisionUsage();
              subdivisionUsage.id = sub.id || 0;
              subdivisionUsage.Subdivision = new Subdivision();
              subdivisionUsage.Subdivision.Alias = sub.Subdivision?.Alias || "";
              subdivisionUsage.Subdivision.FullName = sub.Subdivision?.FullName || "";
              subdivisionUsage.Subdivision.Ranks = new ArraySchema<string>(...(sub.Subdivision?.Ranks || []));
              subdivisionUsage.StartTime = sub.StartTime || "";
              subdivisionUsage.EndTime = sub.EndTime || "";
              subdivisionUsage.Duration = sub.Duration || 0;
              subdivisionUsage.Active = sub.Active || false;
              subdivisionUsage.Paused = sub.Paused || false;
              patrolLog.SubdivisionUsage.push(subdivisionUsage);
            });
          }

          clientState.patrolLog.push(patrolLog);
        });

        this.broadcastUpdatedClients();
      }
    });

    this.onMessage("update_status", (client, message) => {
      const clientState = this.state.clients.find((c) => c.sessionId === client.sessionId);
    
      if (clientState) {
        // Update the client's status
        clientState.status.selectedDepartment = message.selectedDepartment || null;
        clientState.status.selectedServer = message.selectedServer || null;
    
        console.log(`Updated status for client ${client.sessionId}:`, clientState.status);
    
        // Broadcast the updated client list
        this.broadcastUpdatedClients();
      } else {
        console.warn(`Client ${client.sessionId} not found for status update.`);
      }
    });
    
  }

  onJoin(client: Client, options: any) {
    const existingClient = this.state.clients.find((c) => c.websiteID === options.websiteID);

    if (existingClient) {
      existingClient.sessionId = client.sessionId;
      return;
    }

    const newClient = new ClientSchema();
    newClient.name = options.name || "Guest";
    newClient.websiteID = options.websiteID || "0";
    newClient.avatar = options.avatar || "";
    newClient.sessionId = client.sessionId;

    const status = new ClientStatus();
    status.selectedDepartment = options.status?.selectedDepartment || null;
    status.selectedServer = options.status?.selectedServer || null;
    newClient.status = status;

    this.state.clients.push(newClient);
    this.broadcastUpdatedClients();
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left.`);
  }

  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }

  private broadcastUpdatedClients() {
    this.broadcast("update_clients", {
      clients: this.state.clients.map((client) => ({
        name: client.name,
        avatar: client.avatar,
        websiteID: client.websiteID,
        patrolLogs: client.patrolLog.map((log) => ({
          Department: log.Department,
          Server: log.Server,
          startDate: log.startDate,
          endDate: log.endDate,
          Duration: log.Duration,
        })),
        status: {
          selectedDepartment: client.status.selectedDepartment || null,
          selectedServer: client.status.selectedServer || null,
        },
      })),
    });
  }
  
}