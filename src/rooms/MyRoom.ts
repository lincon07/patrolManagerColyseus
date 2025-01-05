import { Room, Client } from "@colyseus/core";
import { MyRoomState, ClientSchema, PatrolLogs, SubdivisionUsage, Subdivision, ClientStatus } from "./schema/MyRoomState";
import { ArraySchema } from "@colyseus/schema";

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.setPatchRate(1000); // Update clients every second for better sync

    this.onMessage("type", (client, message) => {
      console.log(`Message received from ${client.sessionId}:`, message);
    });

    this.onMessage("update_logs", (client, message) => {
      const clientState = this.state.clients.find((c) => c.sessionId === client.sessionId);

      if (clientState && Array.isArray(message.patrolLogs)) {
        // Clear existing patrol logs
        clientState.patrolLogs = new ArraySchema<PatrolLogs>();

        message.patrolLogs.forEach((log: any) => {
          const patrolLog = new PatrolLogs();
          patrolLog.Department = log.Department || "";
          patrolLog.Server = log.Server || "";
          patrolLog.startDate = log.startDate || "";
          patrolLog.endDate = log.endDate || "";
          patrolLog.Duration = log.Duration || 0;
          patrolLog.Active = log.Active || false;
          patrolLog.Paused = log.Paused || false;

          // Handle Subdivision Usage
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

          // Add the log to the client's patrol logs
          clientState.patrolLogs.push(patrolLog);
        });

        // Log the updated patrol logs for debugging
        console.log(`Updated patrol logs for client ${client.sessionId}:`, clientState.patrolLogs);

        // Broadcast updated clients to all
        this.broadcastUpdatedClients();
      } else {
        console.warn(`Invalid patrol logs received from client ${client.sessionId}`);
      }
    });

    this.onMessage("update_status", (client, message) => {
      const clientState = this.state.clients.find((c) => c.sessionId === client.sessionId);

      if (clientState) {
        clientState.status.selectedDepartment = message.selectedDepartment || null;
        clientState.status.selectedServer = message.selectedServer || null;

        console.log(`Updated status for client ${client.sessionId}:`, clientState.status);

        this.broadcastUpdatedClients();
      } else {
        console.warn(`Client ${client.sessionId} not found for status update.`);
      }
    });

    this.onMessage("dev_announcement", (client, message) => {
      this.broadcastDevAnnouncement(message.to, message.message);
      console.log(`Dev announcement sent to ${message.to}:`, message.message);
    })

    this.onMessage("friend_request", (client, message) => {
      console.log(`Friend request received from ${client.sessionId}:`, message);
    
      const targetClient = this.state.clients.find((c) => c.websiteID === message.targetWebsiteID);
    
      if (targetClient) {
        this.broadcastFriendRequest(client?.userData?.websiteID, message?.targetWebsiteID);
        console.log(`Friend request sent to ${targetClient.sessionId}`);
      } else {
        console.warn(`Target client ${message.targetWebsiteID} not found.`);
      }
    });

    this.onMessage("friend_request_response", (client, message) => {
      console.log(`Friend request response received from ${client.sessionId}:`, message);
    
      const targetClient = this.clients.find((c) => c.userData?.websiteID === message.to);
    
      if (targetClient) {
        targetClient.send("friend_request_response", {
          from: client.userData?.websiteID,
          to: message.to,
          response: message.response,
        });
        console.log(`Friend request response sent to ${targetClient.sessionId}`);
      } else {
        console.warn(`Target client ${message.to} not found.`);
      }
    });
    
    
    
  }

  onJoin(client: Client, options: any) {
    console.log(`Client ${client.sessionId} joined with options:`, options);
  
    // Attach websiteID to client.userData
    client.userData = {
      websiteID: options.websiteID || "0",
    };
  
    const existingClient = this.state.clients.find((c) => c.websiteID === options.websiteID);
  
    if (existingClient) {
      existingClient.sessionId = client.sessionId;
      return;
    }
  
    const newClient = new ClientSchema();
    newClient.name = options.name || "Guest";
    newClient.websiteID = options.websiteID || "0";
    newClient.avatar = options.avatar || "";
    newClient.version = options.version || "";
    newClient.allowFriendRequests = options.allowFriendRequests
    newClient.sessionId = client.sessionId;
  
    // Add patrolLogs
    if (Array.isArray(options.patrolLogs)) {
      newClient.patrolLogs = new ArraySchema<PatrolLogs>();
      options.patrolLogs.forEach((log: any) => {
        const patrolLog = new PatrolLogs();
        patrolLog.Department = log.Department || "";
        patrolLog.Server = log.Server || "";
        patrolLog.startDate = log.startDate || "";
        patrolLog.endDate = log.endDate || "";
        patrolLog.Duration = log.Duration || 0;
        patrolLog.Active = log.Active || false;
        patrolLog.Paused = log.Paused || false;
  
        newClient.patrolLogs.push(patrolLog);
      });
    }
  
    const status = new ClientStatus();
    status.selectedDepartment = options.status?.selectedDepartment || null;
    status.selectedServer = options.status?.selectedServer || null;
    newClient.status = status;
  
    this.state.clients.push(newClient);
    this.broadcastUpdatedClients();
  }
  


  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left.`);

    const index = this.state.clients.findIndex((c) => c.sessionId === client.sessionId);

    if (index !== -1) {
      console.log(`Removing client ${client.sessionId} from the client list.`);
      this.state.clients.splice(index, 1);
      this.broadcastUpdatedClients();
    } else {
      console.warn(`Client ${client.sessionId} not found in the client list.`);
    }
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
        version: client.version,
        allowFriendRequests: client.allowFriendRequests,
        patrolLogs: client.patrolLogs.map((log) => ({
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

  private broadcastDevAnnouncement(to: string, message: string) {
    this.broadcast("dev_announcment", {
      to,
      message
    })
  }

  private broadcastFriendRequest(from: string, to: string) {
    const sender = this.state.clients.find((client) => client.websiteID === from);
    if (!sender) {
      console.warn(`Sender with websiteID ${from} not found`);
      return;
    }
  
    this.broadcast("friend_request", {
      from: sender.websiteID,
      to,
      name: sender.name || "Unknown",
      avatar: sender.avatar || "",
    });
  }

}
