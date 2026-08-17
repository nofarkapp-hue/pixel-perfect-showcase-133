import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SPREADSHEET_ID = "14u3HN9_KKstZzWn3daNivHobBlFMr32lDbY8UDfh0Aw";
const SHEET_TAB = "Completions";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

const answer = z.string().trim().max(2000).optional().default("");

const completionInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160).or(z.literal("")),
  organization: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(120),
  workStartDate: z.string().trim().max(40).optional().default(""),
  completionDate: z.string().trim().min(1).max(40),
  score: z.number().min(0).max(7),
  bizQ1: answer,
  bizQ2: answer,
  bizQ3: answer,
  bizQ4: answer,
  bizQ5: answer,
});

export const logCompletionToSheet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => completionInput.parse(data))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env['LOVABLE_API_KEY'];
    const connectionKey = process.env['GOOGLE_SHEETS_API_KEY'];
    if (!lovableApiKey || !connectionKey) {
      console.error("[sheets] Google Sheets connection is not configured");
      return { ok: false as const };
    }

    const url = `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_TAB}!A:L:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          [
            data.name,
            data.email,
            data.organization,
            data.role,
            data.workStartDate,
            data.completionDate,
            `${data.score}/7`,
            data.bizQ1,
            data.bizQ2,
            data.bizQ3,
            data.bizQ4,
            data.bizQ5,
          ],
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[sheets] append failed [${response.status}]: ${body}`);
      return { ok: false as const };
    }

    return { ok: true as const };
  });
