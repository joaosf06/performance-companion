import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Opt-in integration tests use only a freshly created disposable player.
const playerFile = process.env.ROLE_SECURITY_PLAYER_SESSION;
const coachFile = process.env.ROLE_SECURITY_COACH_SESSION;
const runLive = Boolean(playerFile && coachFile);

function sessionClient(file: string | undefined) {
  if (!file) throw new Error("A test session file is required");
  const minted = JSON.parse(readFileSync(file, "utf8"));
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("App connection settings are required");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${minted.session.access_token}` } },
  });
  return { client, id: minted.session.user.id as string };
}

describe("user_roles security migration", () => {
  it("permits INSERT only through the existing coach check", () => {
    const sql = readFileSync("drizzle/migrations/0004_restrict_user_roles_insert_to_coaches.sql", "utf8");
    expect(sql).toContain("WITH CHECK (app_private.has_role(auth.uid(), 'coach'::public.app_role))");
    expect(sql).not.toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
    expect(sql).not.toMatch(/FOR\s+(UPDATE|DELETE|SELECT|ALL)/i);
  });
});

describe.skipIf(!runLive)("user_roles authenticated integration", () => {
  it("new signup creates a profile and only the player role", async () => {
    const player = sessionClient(playerFile);
    const profile = await player.client.from("profiles").select("user_id").eq("user_id", player.id).single();
    expect(profile.error).toBeNull();
    expect(profile.data?.user_id).toBe(player.id);
    const roles = await player.client.from("user_roles").select("role").eq("user_id", player.id);
    expect(roles.error).toBeNull();
    expect(roles.data).toEqual([{ role: "player" }]);
  });

  it("a player self-inserting coach receives an RLS error", async () => {
    const player = sessionClient(playerFile);
    const result = await player.client.from("user_roles").insert({ user_id: player.id, role: "coach" });
    expect(result.error?.code).toBe("42501");
    expect(result.error?.message).toMatch(/row-level security/i);
    const roles = await player.client.from("user_roles").select("role").eq("user_id", player.id);
    expect(roles.data).toEqual([{ role: "player" }]);
  });

  it("a coach can assign coach to the disposable player", async () => {
    const player = sessionClient(playerFile);
    const coach = sessionClient(coachFile);
    expect(coach.id).not.toBe(player.id);
    const ownRoles = await coach.client.from("user_roles").select("role").eq("user_id", coach.id);
    expect(ownRoles.data?.some(row => row.role === "coach")).toBe(true);
    try {
      const result = await coach.client.from("user_roles").insert({ user_id: player.id, role: "coach" }).select("role").single();
      expect(result.error).toBeNull();
      expect(result.data?.role).toBe("coach");
    } finally {
      const cleanup = await coach.client.from("user_roles").delete().eq("user_id", player.id).eq("role", "coach");
      expect(cleanup.error).toBeNull();
    }
    const remaining = await coach.client.from("user_roles").select("role").eq("user_id", player.id);
    expect(remaining.data).toEqual([{ role: "player" }]);
  });
});