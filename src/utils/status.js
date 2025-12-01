/**
 * Utility designed to create branch coverage.
 * Maps uptime (seconds) to a label.
 */
export function formatStatus(uptimeSec) {
  const uptime = Number(uptimeSec);

  // invalid or negative should NOT throw
  if (!Number.isFinite(uptime) || uptime < 0) {
    return "warming-up";
  }

  if (uptime < 60) {
    return "warming-up";
  }

  if (uptime < 3600) {
    return "healthy";
  }

  return "steady";
}
