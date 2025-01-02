import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";

// Subdivision class
export class Subdivision extends Schema {
  @type("string") Alias: string = "";
  @type("string") FullName: string = "";
  @type(["string"]) Ranks: ArraySchema<string> = new ArraySchema<string>();
}

// TEU_Calls class
export class TEU_Calls extends Schema {
  @type("string") type: string = "";
  @type("number") count: number = 0;
}

// PA_Activation class
export class PA_Activation extends Schema {
  @type("string") type: string = "";
  @type("number") count: number = 0;
}

// SubdivisionUsage class
export class SubdivisionUsage extends Schema {
  @type("number") id: number = 0;
  @type(Subdivision) Subdivision: Subdivision = new Subdivision();
  @type("string") StartTime: string = ""; // ISO string representation of Date
  @type("string") EndTime: string = ""; // ISO string representation of Date or null
  @type("number") Duration: number = 0;
  @type("boolean") Active: boolean = false;
  @type("boolean") Paused: boolean = false;
  @type("string") Member: string = "";
  @type("number") Log: number = 0;
  @type(["string"]) BACO_Operations: ArraySchema<string> = new ArraySchema<string>();
  @type("number") PA_Arrests: number = 0;
  @type([TEU_Calls]) TEU_Calls: ArraySchema<TEU_Calls> = new ArraySchema<TEU_Calls>();
  @type([PA_Activation]) PA_Activations: ArraySchema<PA_Activation> = new ArraySchema<PA_Activation>();
  @type("number") SID_Arrests: number = 0;
  @type(["string"]) sid_utilized_teams: ArraySchema<string> = new ArraySchema<string>();
  @type("number") TEU_TowActivations: number = 0;
  @type("string") BSO_K9_Position: string = "";
  @type("boolean") adat_dui_checkpoint: boolean = false;
  @type("number") bso_K9_Calls: number = 0;
  @type("boolean") bte_Mbu_Utlized_Checkpoint: boolean = false;
}

// PatrolLogs class
export class PatrolLogs extends Schema {
  @type("number") id: number = 0;
  @type("string") startDate: string = ""; // ISO string representation of Date
  @type("string") endDate: string = ""; // ISO string representation of Date
  @type("number") Duration: number = 0;
  @type("string") Department: string = "";
  @type("string") Server: string = "";
  @type("boolean") Active: boolean = false;
  @type("boolean") Paused: boolean = false;
  @type([SubdivisionUsage]) SubdivisionUsage: ArraySchema<SubdivisionUsage> = new ArraySchema<SubdivisionUsage>();
  @type(["string"]) UtilizedDistricts: ArraySchema<string> = new ArraySchema<string>();
  @type(["string"]) LSPD_Byc_Foot_Patrol: ArraySchema<string> = new ArraySchema<string>();
  @type("number") civPrioCount: number = 0;
  @type({ map: "number" }) visitCounts: MapSchema<number> = new MapSchema<number>();
}

// ClientSchema class
export class ClientSchema extends Schema {
  @type("string") name: string = "";
  @type("string") websiteID: string = "";
  @type("string") avatar: string = "";
  @type("string") sessionId: string = ""; // Store the sessionId for tracking
  @type([PatrolLogs]) patrolLog: ArraySchema<PatrolLogs> = new ArraySchema<PatrolLogs>(); // Array of logs
}

// MyRoomState class
export class MyRoomState extends Schema {
  @type([ClientSchema]) clients: ArraySchema<ClientSchema> = new ArraySchema<ClientSchema>();
}
