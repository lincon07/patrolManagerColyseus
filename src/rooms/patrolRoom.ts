import { Client, Room } from "colyseus";
import { ClientSchema, PatrolRoomSchema } from "./schema/patrolRoomState";
import { LobbyRoomState } from "./schema/lobbyRoomState";

export class patrolRoom extends Room<PatrolRoomSchema> {
    lobbyRoomState: LobbyRoomState | null = null;

    onCreate(options: any) {
        if (!options.lobbyRoomState || !(options.lobbyRoomState instanceof LobbyRoomState)) {
            console.error("Invalid or missing lobbyRoomState in options.");
            throw new Error("Invalid lobbyRoomState");
        }

        this.lobbyRoomState = options.lobbyRoomState;
        this.setState(new PatrolRoomSchema());

        this.onMessage("update_patrol_config", (client, message) => {
            console.log(`Updating patrol config: ${JSON.stringify(message)}`);
            // Update patrol config logic here
        });

        this.onMessage("patrol_invite", (client, message) => {
            const targetClient = this.lobbyRoomState?.clients.find(
                (c) => c.websiteID === message.targetWebsiteID
            );

            if (!targetClient) {
                console.error("Target client not found in lobby state.");
                client.send("error", { message: "Client not found in lobby state." });
                return;
            }

            client.send("patrol_invite", { message: "Invite sent!" });
        });
    }

    onJoin(client: any, options: any) {
        // Validate client options
        if (!options?.name || !options?.websiteID) {
            console.warn("Invalid client options:", options);
            return;
        }

        // Check if client already exists
        const clientExists = this.state.clients.some((c) => c.websiteID === options.websiteID
        );

        if (clientExists) {
            console.warn("Client already exists:", options.websiteID);
            return;
        }

        // Check if client is the first to join
        if (this.state.clients.length === 0) {
            this.state.Owner.name = options.name;
            this.state.Owner.websiteID = options.websiteID;
            console.log("First client joined, setting as owner:", options.name);
        }

        // Create a new client schema instance
        const newClient = new ClientSchema();
        newClient.name = options.name;
        newClient.websiteID = options.websiteID;

        // Add the new client to the state
        this.state.clients.push(newClient);

        // Broadcast updated clients list
        this.broadcast("clients", this.state.clients);

        console.log("Client joined:", newClient);
    }

    onLeave(client: any, consented: boolean) {
        // Remove the client from the state
        const index = this.state.clients.findIndex(
            (c) => c.websiteID === client.websiteID
        );

        if (index !== -1) {
            const removedClient = this.state.clients.splice(index, 1);
            console.log("Client left:", removedClient);

            // If the owner leaves, assign a new owner
            if (this.state.Owner.websiteID === client.websiteID && this.state.clients.length > 0) {
                const newOwner = this.state.clients[0];
                this.state.Owner.name = newOwner.name;
                this.state.Owner.websiteID = newOwner.websiteID;
                console.log("New owner assigned:", newOwner.name);
            }
        }

        // change state 
        this.broadcastPatch()
    }

    onDispose() {
        console.log("Room disposed.");
    }
}
