export function zoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET
  );
}

async function getZoomToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const auth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
    }
  );
  if (!res.ok) throw new Error(`Zoom auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createZoomMeeting(input: {
  topic: string;
  start: Date;
  durationMinutes: number;
}): Promise<string | null> {
  const token = await getZoomToken();
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.start.toISOString(),
      duration: input.durationMinutes,
      settings: { join_before_host: true, waiting_room: true },
    }),
  });
  if (!res.ok) throw new Error(`Zoom meeting create failed: ${res.status}`);
  const data = (await res.json()) as { join_url?: string };
  return data.join_url || null;
}
