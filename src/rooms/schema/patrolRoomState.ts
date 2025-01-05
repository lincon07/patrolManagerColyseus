import { Schema, type, ArraySchema } from "@colyseus/schema";

export class ClientData extends Schema {
  @type("string") sessionId: string = null;
  @type("string") websiteID: string = null;
  @type("string") name: string = null;
}


export class patrolRoomState extends Schema {
    @type("string") selectedDepartment: string = null;
    @type("string") selectedServer: string = null;
    @type([ClientData]) clients: ArraySchema<ClientData> = new ArraySchema<ClientData>();
  }
  