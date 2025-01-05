import { Schema, type, ArraySchema } from "@colyseus/schema";

// Schema Definitions
export class ClientSchema extends Schema {
    @type("string") name: string = "";
    @type("string") websiteID: string = "";
}

export class patrolRoomPatrolConfig extends Schema {
    @type("string") selectedDepartment: string = "";
    @type("string") selectedServer: string = "";
}

export class PatrolRoomSchema extends Schema {
    @type(ClientSchema) Owner = new ClientSchema();
    @type([ClientSchema]) clients = new ArraySchema<ClientSchema>();
    @type(patrolRoomPatrolConfig) patrolConfig = new patrolRoomPatrolConfig();
}