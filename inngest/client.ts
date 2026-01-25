import { config } from "@/config/config";
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "paper-chat",
  eventKey: config.INNGEST_EVENT_KEY,
});


//  command to run inngest locally
// npx --ignore-scripts=false inngest-cli@latest dev