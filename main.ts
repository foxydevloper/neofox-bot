import "https://deno.land/std@0.185.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.185.0/http/server.ts";
import type {
  APIApplicationCommandInteractionDataAttachmentOption,
  APIInteraction,
  APIInteractionResponse,
} from "https://deno.land/x/discord_api_types@0.37.40/v10.ts";
import * as ed25519 from "https://deno.land/x/ed25519@2.0.0/mod.ts";

const botToken = Deno.env.get("BOT_TOKEN");
async function handle(
  interaction: APIInteraction,
): Promise<APIInteractionResponse> {
  if (interaction.type == 1) {
    return {
      type: 1,
    };
  } else if (
    interaction.type == 2 && interaction.data.type == 1 &&
    interaction.data.name == "seticon"
  ) {
    const iconOption = interaction.data
      .options![0]! as APIApplicationCommandInteractionDataAttachmentOption;
    const icon = interaction.data.resolved?.attachments![iconOption.value]!;

    const imageData = await fetch(icon.proxy_url).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }
      const contentType = res.headers.get("Content-Type");
      const imageBlob = await res.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64EncodedImage = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer)),
      );
      return `data:${contentType};base64,${base64EncodedImage}`;
    });

    await fetch(`https://discord.com/api/v10/guilds/${interaction.guild_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${botToken}`,
      },
      body: JSON.stringify({
        icon: imageData,
      }),
    }).then(async (res) => {
      console.log(res, await res.text());
      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }
    });

    return {
      type: 4,
      data: {
        content: "set server icon successfully",
      },
    };
  }
  throw new Error("unimplemented interaction type");
}

const PUBLIC_KEY =
  "58a0ea58bff5fd5646f0d151f87930dcfa6c90b960ce98c7c93485e6718fce22";

async function verify(req: Request) {
  const signature = req.headers.get("X-Signature-Ed25519");
  if (!signature) return false;
  const timestamp = req.headers.get("X-Signature-Timestamp");
  if (!signature) return false;
  const body = await req.text();
  const encoder = new TextEncoder();
  const messageUint8Array = encoder.encode(timestamp + body);
  return await ed25519.verifyAsync(
    signature,
    messageUint8Array,
    PUBLIC_KEY,
  );
}

serve(async (req) => {
  if (req.method == "POST") {
    const isVerified = await verify(req.clone()); // clone cas it needs to read text :p
    if (!isVerified) {
      return new Response("invalid request signature", { status: 401 });
    }
    const interaction = await req.json();
    return Response.json(await handle(interaction));
  } else {
    throw new Error("invalid method");
  }
});
