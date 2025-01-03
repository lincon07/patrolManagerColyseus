import { Room, Client } from "@colyseus/core";
import {
  MyRoomState,
  ClientSchema,
  PatrolLogs,
  SubdivisionUsage,
  Subdivision,
  ClientStatus,
} from "./schema/MyRoomState";
import { ArraySchema } from "@colyseus/schema";

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    // Initialize the room state
    this.setState(new MyRoomState());

    // Handle incoming messages
    this.onMessage("type", (client, message) => {
      console.log(`Message received from ${client.sessionId}:`, message);
    });

    // Listen for "update_logs" message
    this.onMessage("update_logs", (client, message) => {
      console.log(`Updating logs for client ${client.sessionId}:`, message);

      // Find the client in the state
      const clientState = this.state.clients.find((c) => c.sessionId === client.sessionId);

      if (clientState && Array.isArray(message.patrolLogs)) {
        // Update patrol logs
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

          // Map SubdivisionUsage
          if (Array.isArray(log.SubdivisionUsage)) {
            patrolLog.SubdivisionUsage = new ArraySchema<SubdivisionUsage>();
            log.SubdivisionUsage.forEach((sub: any) => {
              const subdivisionUsage = new SubdivisionUsage();
              subdivisionUsage.id = sub.id || 0;
              subdivisionUsage.Subdivision = new Subdivision();
              subdivisionUsage.Subdivision.Alias =
                sub.Subdivision?.Alias || "";
              subdivisionUsage.Subdivision.FullName =
                sub.Subdivision?.FullName || "";
              subdivisionUsage.Subdivision.Ranks = new ArraySchema<string>(
                ...(sub.Subdivision?.Ranks || [])
              );
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

        // Re-broadcast updated client list
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
          })),
        });

        console.log(`Logs updated for client ${client.sessionId}.`);
      } else {
        console.log(`Client ${client.sessionId} not found or invalid logs.`);
      }
    });

    // listen for "update_status" message
    this.onMessage("update_status", (client, message) => {
      const clientState = this.state.clients.find(
        (c) => c.sessionId === client.sessionId
      );

      if (clientState) {
        // Update status with proper type
        if (message.selectedDepartment) {
          clientState.status.selectedDepartment = message.selectedDepartment;
        }

        if (message.selectedServer) {
          clientState.status.selectedServer = message.selectedServer;
        }

        console.log(`Status updated for client ${client.sessionId}:`, clientState.status);

        // Broadcast updated client list
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
              selectedDepartment: client.status.selectedDepartment,
              selectedServer: client.status.selectedServer,
            },
          })),
        });
      } else {
        console.log(`Client ${client.sessionId} not found.`);
      }
    });



  }

  onJoin(client: Client, options: any) {
    const existingClient = this.state.clients.find(
      (c) => c.websiteID === options.websiteID
    );
  
    if (existingClient) {
      // Reconnect logic
      console.log(`Client ${client.sessionId} is reconnecting as ${options.websiteID}`);
      existingClient.sessionId = client.sessionId; // Update sessionId
      existingClient.name = options.name || existingClient.name; // Update any relevant properties
      existingClient.avatar = options.avatar || existingClient.avatar;
  
      // Broadcast updated client list
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
            selectedDepartment: client.status.selectedDepartment,
            selectedServer: client.status.selectedServer,
          },
        })),
      });
  
      console.log(`Client ${client.sessionId} reconnected.`);
      return;
    }
  
    // Create a new client state if not reconnecting
    const newClient = new ClientSchema();
    newClient.name = options.name || "Guest";
    newClient.websiteID = options.websiteID || "0";
    newClient.avatar = options.avatar || "";
    newClient.sessionId = client.sessionId;
  
    // Ensure `status` is an instance of `ClientStatus`
    const status = new ClientStatus();
    status.selectedDepartment = options.status?.selectedDepartment || "";
    status.selectedServer = options.status?.selectedServer || "";
    newClient.status = status;
  
    // Map all patrol logs
    if (Array.isArray(options.patrolLogs)) {
      newClient.patrolLog = new ArraySchema<PatrolLogs>();
      options.patrolLogs.forEach((log: any) => {
        const patrolLog = new PatrolLogs();
        patrolLog.Department = log.Department || "";
        patrolLog.Server = log.Server || "";
        patrolLog.startDate = log.startDate || "";
        patrolLog.endDate = log.endDate || "";
        patrolLog.Duration = log.Duration || 0;
        patrolLog.Active = log.Active || false;
        patrolLog.Paused = log.Paused || false;
  
        // Map SubdivisionUsage
        if (Array.isArray(log.SubdivisionUsage)) {
          patrolLog.SubdivisionUsage = new ArraySchema<SubdivisionUsage>();
          log.SubdivisionUsage.forEach((sub: any) => {
            const subdivisionUsage = new SubdivisionUsage();
            subdivisionUsage.id = sub.id || 0;
            subdivisionUsage.Subdivision = new Subdivision();
            subdivisionUsage.Subdivision.Alias = sub.Subdivision?.Alias || "";
            subdivisionUsage.Subdivision.FullName = sub.Subdivision?.FullName || "";
            subdivisionUsage.Subdivision.Ranks = new ArraySchema<string>(
              ...(sub.Subdivision?.Ranks || [])
            );
            subdivisionUsage.StartTime = sub.StartTime || "";
            subdivisionUsage.EndTime = sub.EndTime || "";
            subdivisionUsage.Duration = sub.Duration || 0;
            subdivisionUsage.Active = sub.Active || false;
            subdivisionUsage.Paused = sub.Paused || false;
            patrolLog.SubdivisionUsage.push(subdivisionUsage);
          });
        }
  
        newClient.patrolLog.push(patrolLog);
      });
    }
  
    this.state.clients.push(newClient);
  
    // Broadcast updated client list
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
          selectedDepartment: client.status.selectedDepartment,
          selectedServer: client.status.selectedServer,
        },
      })),
    });
  
    console.log(`Client ${client.sessionId} joined.`);
  }
  


  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left.`);
  
    const clientState = this.state.clients.find(
      (c) => c.sessionId === client.sessionId
    );
  
    if (clientState) {
      console.log(`Client state retained for ${client.sessionId} (${clientState.websiteID}).`);
      return; // Retain state instead of removing it
    }
  
    // Optionally: remove the client state after a certain timeout
    setTimeout(() => {
      const index = this.state.clients.findIndex(
        (c) => c.sessionId === client.sessionId
      );
      if (index !== -1) {
        console.log(`Removing client ${client.sessionId} due to inactivity.`);
        this.state.clients.splice(index, 1);
  
        // Broadcast updated client list
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
          })),
        });
      }
    }, 60000); // Adjust timeout as needed
  }
  

  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }
}
