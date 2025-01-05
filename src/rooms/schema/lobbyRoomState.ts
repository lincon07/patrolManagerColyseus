import { Schema, type, ArraySchema } from "@colyseus/schema";

export class ClientStatus extends Schema {
  @type("string") selectedDepartment: string = "";
  @type("string") selectedServer: string = "";
}

export class Subdivision extends Schema {
  @type("string") Alias: string = "";
  @type("string") FullName: string = "";
  @type(["string"]) Ranks: ArraySchema<string> = new ArraySchema<string>();
}

export class SubdivisionUsage extends Schema {
  @type("number") id: number = 0;
  @type(Subdivision) Subdivision: Subdivision = new Subdivision();
  @type("string") StartTime: string = "";
  @type("string") EndTime: string = "";
  @type("number") Duration: number = 0;
  @type("boolean") Active: boolean = false;
  @type("boolean") Paused: boolean = false;
}

export class PatrolLogs extends Schema {
  @type("number") id: number = 0;
  @type("string") startDate: string = "";
  @type("string") endDate: string = "";
  @type("number") Duration: number = 0;
  @type("string") Department: string = "";
  @type("string") Server: string = "";
  @type("boolean") Active: boolean = false;
  @type("boolean") Paused: boolean = false;
  @type([SubdivisionUsage]) SubdivisionUsage: ArraySchema<SubdivisionUsage> = new ArraySchema<SubdivisionUsage>();
}

export class ClientSchema extends Schema {
  @type("string") name: string = "";
  @type("string") websiteID: string = "";
  @type("string") version: string = "";
  @type('boolean') allowFriendRequests: boolean = true;
  @type("string") avatar: string = "";
  @type("string") sessionId: string = "";
  @type([PatrolLogs]) patrolLogs: ArraySchema<PatrolLogs> = new ArraySchema<PatrolLogs>();
  @type(ClientStatus) status: ClientStatus = new ClientStatus();
}

export class LobbyRoomState extends Schema {
  @type([ClientSchema]) clients: ArraySchema<ClientSchema> = new ArraySchema<ClientSchema>();
}
