import { Room, Client } from "@colyseus/core";
import { LobbyRoomState, ClientSchema, PatrolLogs, SubdivisionUsage, Subdivision, ClientStatus, developemtAnnouncement } from "./schema/lobbyRoomState";
import { ArraySchema } from "@colyseus/schema";

export class lobbyRoom extends Room<LobbyRoomState> {
  onCreate(options: any) {
    this.setState(new LobbyRoomState());

    this.setPatchRate(1000); // Update clients every second for better sync

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
      } if (!clientState) {
        console.warn(`Client ${client.sessionId} not found. Ignoring update_status.`);
        return; // Avoid adding clients here unexpectedly
      }
      else {
        console.warn(`Invalid status update received from client ${client.sessionId}`);
      }
      

    });

    this.onMessage("dev_announcement", (client, message) => {
      console.log(`Dev announcement received:`, message);
      const announcement = new developemtAnnouncement();
      announcement.to = message.to;
      announcement.message = message.message;
      this.state.announcements.push(announcement);
      this.broadcastDevAnnouncement(message.to, message.message);
  });

  this.onMessage("friend_request", (client, message) => {
    console.log(`Friend request received from ${client.sessionId}:`, message);
  
    if (!message.targetWebsiteID || !client.userData.websiteID) {
      console.warn("Invalid friend request data:", message);
      client.send("error", { message: "Invalid friend request data" });
      return;
    }
  
    if (message.targetWebsiteID === client.userData.websiteID) {
      console.warn("Cannot send friend request to self:", message);
      client.send("error", { message: "Cannot send friend request to self" });
      return;
    }
  
    const sender = this.state.clients.find((c) => c.sessionId === client.sessionId);
    const receiver = this.state.clients.find((c) => c.websiteID === message.targetWebsiteID);
  
    if (!sender || !receiver) {
      console.warn("Sender or receiver client not found:", message);
      client.send("error", { message: "Sender or receiver client not found" });
      return;
    }
  
    if (!receiver.allowFriendRequests) {
      console.warn(`${receiver.name} does not allow friend requests.`);
      client.send("error", { message: `${receiver.name} does not allow friend requests` });
      return;
    }
  
    // Send friend request to receiver
    const payload = {
      from: sender.websiteID,
      to: receiver.websiteID,
      name: sender.name || "Unknown",
      avatar: sender.avatar || "",
    };
  
    if (receiver.sessionId) {
      const targetClient = this.clients.find((c) => c.sessionId === receiver.sessionId);
      targetClient?.send("friend_request", payload);
      console.log(`Friend request sent from ${sender.websiteID} to ${receiver.websiteID}`);
    } else {
      console.error(`Target client ${receiver.websiteID} is not connected.`);
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
    client.userData = { websiteID: options.websiteID || "0" , discordID: options.discordID || "0" };
  
    const existingClient = this.state.clients.find((c) => c.websiteID === options.websiteID);
  
    if (existingClient) {
      existingClient.sessionId = client.sessionId;
      return;
    }
  
    const newClient = new ClientSchema();
    newClient.name = options.name || "Guest";
    newClient.websiteID = options.websiteID || "0";
    newClient.discordID = options.discordID || "0";
    newClient.avatar = options.avatar || "";
    newClient.version = options.version || "";
    newClient.allowFriendRequests = options.allowFriendRequests || false;
    newClient.sessionId = client.sessionId;
  
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
  
    this.state.clients.push(newClient);
    console.log(`Client joined: ${newClient.name}`);
  }
  

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left.`);

    const index = this.state.clients.findIndex((c) => c.sessionId === client.sessionId);

    if (index !== -1) {
      console.log(`Removing client ${client.sessionId} from the client list.`);
      this.state.clients.splice(index, 1);
    } else {
      console.warn(`Client ${client.sessionId} not found in the client list.`);
    }
  }

  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }
  private broadcastDevAnnouncement(to: string, message: string) {
    console.log(`Broadcasting dev announcement: to=${to}, message=${message}`);
    this.broadcast("dev_announcment", {
        to,
        message,
    });
}

}
