import "https://deno.land/std@0.185.0/dotenv/load.ts";
import type {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "https://deno.land/x/discord_api_types@0.37.40/v10.ts";

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [{
  name: "seticon",
  description: "sets server icon",
  type: 1,
  options: [
    {
      name: "image",
      type: 11,
      description: "the image to set server icon to",
    },
  ],
}];

const token = Deno.env.get("BOT_TOKEN");
await fetch(
  "https://discord.com/api/v10/applications/1102105382463209482/commands",
  {
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify(commands),
  },
);
