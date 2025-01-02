import { Schema, type, ArraySchema } from "@colyseus/schema";

export class ClientSchema extends Schema {
  @type("string") name: string = "";
  @type("string") websiteID: string = "";
  @type("string") avatar: string = "";
  @type("string") sessionId: string = ""; // Store the sessionId for tracking
}

export class MyRoomState extends Schema {
  @type([ClientSchema]) clients: ArraySchema<ClientSchema> = new ArraySchema<ClientSchema>();
}
