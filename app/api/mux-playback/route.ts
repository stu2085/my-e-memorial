import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { uploadId } = await req.json();

    if (!uploadId) {
      return new Response(JSON.stringify({ error: "Missing uploadId" }), {
        status: 400,
      });
    }

    // Get the upload
    const upload = await mux.video.uploads.retrieve(uploadId);

    const assetId = upload.asset_id;

    if (!assetId) {
      return new Response(JSON.stringify({ error: "Asset not ready yet" }), {
        status: 202,
      });
    }

    // Get the asset
    const asset = await mux.video.assets.retrieve(assetId);

    const playbackId = asset.playback_ids?.[0]?.id;

    if (!playbackId) {
      return new Response(JSON.stringify({ error: "No playbackId yet" }), {
        status: 202,
      });
    }

    return new Response(
      JSON.stringify({ playbackId }),
      { status: 200 }
    );
  } catch (err) {
    console.error("MUX PLAYBACK ERROR:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}