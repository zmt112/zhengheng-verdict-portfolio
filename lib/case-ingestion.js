const DEFAULT_GEOFENCE_METERS = 100;
const DEFAULT_WAIT_SECONDS = 300;
const MAX_TRACE_GAP_SECONDS = 90;
const MAX_ACCURACY_METERS = 50;

export const sampleOrder = {
  orderId: "ORDER-LOCAL-001",
  title: "商场上车点取消费争议",
  scenario: "司机是否到达及取消费争议",
  claims: {
    driver: "我按导航到达上车点，等待超过五分钟并联系了乘客。",
    passenger: "我在商场门口没有看到司机，不认可本次取消费。",
  },
  trip: {
    requestedAt: "2026-07-18T14:25:00+08:00",
    arrivalAt: "2026-07-18T14:31:50+08:00",
    cancelAt: "2026-07-18T14:38:00+08:00",
    geofenceRadiusM: 100,
    requiredWaitSeconds: 300,
  },
  contactAttempts: [
    {
      at: "2026-07-18T14:33:10+08:00",
      direction: "DRIVER_TO_PASSENGER",
      connectedSeconds: 21,
    },
  ],
};

export const sampleTrajectoryCsv = `timestamp,distance_m,accuracy_m
2026-07-18T14:31:42+08:00,96,12
2026-07-18T14:32:30+08:00,58,10
2026-07-18T14:33:20+08:00,42,11
2026-07-18T14:34:10+08:00,39,13
2026-07-18T14:35:00+08:00,44,12
2026-07-18T14:35:50+08:00,48,10
2026-07-18T14:36:40+08:00,46,11
2026-07-18T14:37:30+08:00,52,12
2026-07-18T14:38:00+08:00,60,10`;

function requiredObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} 必须是对象`);
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} 不能为空`);
  }
}

function parseDate(value, field) {
  requiredString(value, field);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${field} 不是有效的 ISO 时间`);
  return timestamp;
}

export function parseOrderJson(text) {
  let order;
  try {
    order = JSON.parse(text);
  } catch {
    throw new Error("订单文件不是有效的 JSON");
  }

  requiredObject(order, "订单");
  requiredString(order.orderId, "orderId");
  requiredObject(order.trip, "trip");
  const arrivalAt = parseDate(order.trip.arrivalAt, "trip.arrivalAt");
  const cancelAt = parseDate(order.trip.cancelAt, "trip.cancelAt");
  if (cancelAt <= arrivalAt) throw new Error("trip.cancelAt 必须晚于 trip.arrivalAt");
  if (order.claims) {
    requiredObject(order.claims, "claims");
    requiredString(order.claims.driver, "claims.driver");
    requiredString(order.claims.passenger, "claims.passenger");
  }
  if (order.contactAttempts && !Array.isArray(order.contactAttempts)) {
    throw new Error("contactAttempts 必须是数组");
  }
  return order;
}

export function parseTrajectoryCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) throw new Error("轨迹 CSV 至少需要两条数据");
  const headers = lines[0].split(",").map((item) => item.trim());
  for (const field of ["timestamp", "distance_m", "accuracy_m"]) {
    if (!headers.includes(field)) throw new Error(`轨迹 CSV 缺少 ${field} 列`);
  }

  const points = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, position) => [header, values[position]]));
    const timestampMs = Date.parse(record.timestamp);
    const distanceM = Number(record.distance_m);
    const accuracyM = Number(record.accuracy_m);
    if (!Number.isFinite(timestampMs) || !Number.isFinite(distanceM) || !Number.isFinite(accuracyM)) {
      throw new Error(`轨迹 CSV 第 ${index + 2} 行包含无效数据`);
    }
    if (distanceM < 0 || accuracyM < 0) throw new Error(`轨迹 CSV 第 ${index + 2} 行不能包含负数`);
    return { timestamp: record.timestamp, timestampMs, distanceM, accuracyM };
  }).sort((a, b) => a.timestampMs - b.timestampMs);

  return points;
}

function longestInsideSeconds(points, radius) {
  let longest = 0;
  let segmentStart = null;
  let previous = null;
  for (const point of points) {
    const gap = previous ? (point.timestampMs - previous.timestampMs) / 1000 : 0;
    const usable = point.accuracyM <= MAX_ACCURACY_METERS;
    if (point.distanceM <= radius && usable && (!previous || gap <= MAX_TRACE_GAP_SECONDS)) {
      if (segmentStart === null) segmentStart = point.timestampMs;
      longest = Math.max(longest, (point.timestampMs - segmentStart) / 1000);
    } else if (point.distanceM <= radius && usable) {
      segmentStart = point.timestampMs;
    } else {
      segmentStart = null;
    }
    previous = point;
  }
  return Math.round(longest);
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Shanghai" });
}

function safeCaseId(orderId, createdAt) {
  const suffix = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || String(createdAt).slice(-8);
  return `LOCAL-${suffix}-${String(createdAt).slice(-4)}`;
}

/**
 * @param {{ order: any, trajectory: any[], files?: any[], createdAt?: number }} input
 */
export function buildCaseFromInputs({ order, trajectory, files = [], createdAt = Date.now() }) {
  const radius = Number(order.trip.geofenceRadiusM) || DEFAULT_GEOFENCE_METERS;
  const requiredWait = Number(order.trip.requiredWaitSeconds) || DEFAULT_WAIT_SECONDS;
  const arrivalAt = Date.parse(order.trip.arrivalAt);
  const cancelAt = Date.parse(order.trip.cancelAt);
  const maxGap = trajectory.slice(1).reduce((largest, point, index) => Math.max(largest, (point.timestampMs - trajectory[index].timestampMs) / 1000), 0);
  const accuratePoints = trajectory.filter((point) => point.accuracyM <= MAX_ACCURACY_METERS);
  const traceContinuous = trajectory.length >= 2 && maxGap <= MAX_TRACE_GAP_SECONDS && accuratePoints.length === trajectory.length;
  const enteredGeofence = accuratePoints.some((point) => point.distanceM <= radius);
  const dwellSeconds = longestInsideSeconds(trajectory, radius);
  const contactAttempts = (order.contactAttempts ?? []).filter((attempt) => attempt.direction === "DRIVER_TO_PASSENGER" && Date.parse(attempt.at) <= cancelAt);
  const waitedSeconds = Math.round((cancelAt - arrivalAt) / 1000);

  const trajectoryEvidenceId = "E-TRAJECTORY";
  const orderEvidenceId = "E-ORDER";
  const contactEvidenceId = "E-CONTACT";
  const evidence = [
    {
      id: trajectoryEvidenceId,
      time: `${formatTime(trajectory[0].timestampMs)}—${formatTime(trajectory.at(-1).timestampMs)}`,
      title: "上传的连续轨迹",
      summary: `共 ${trajectory.length} 个点，最大间隔 ${Math.round(maxGap)} 秒，范围内最长连续停留 ${dwellSeconds} 秒。`,
      source: "用户上传 trajectory.csv",
      quality: traceContinuous ? "HIGH" : accuratePoints.length >= 2 ? "MEDIUM" : "LOW",
      fileId: files.find((file) => file.role === "TRAJECTORY")?.id,
    },
    {
      id: orderEvidenceId,
      time: formatTime(cancelAt),
      title: "上传的订单事件",
      summary: `到达至取消间隔 ${waitedSeconds} 秒，规则等待阈值 ${requiredWait} 秒。`,
      source: "用户上传 order.json",
      quality: "HIGH",
      fileId: files.find((file) => file.role === "ORDER")?.id,
    },
  ];

  if (contactAttempts.length > 0) {
    const connected = contactAttempts.some((attempt) => Number(attempt.connectedSeconds) > 0);
    evidence.push({
      id: contactEvidenceId,
      time: formatTime(Date.parse(contactAttempts[0].at)),
      title: "订单联系记录",
      summary: `${contactAttempts.length} 次司机主动联系，${connected ? "存在接通记录" : "均未接通"}。`,
      source: "order.json / contactAttempts",
      quality: "HIGH",
    });
  }

  for (const file of files.filter((item) => item.role === "ATTACHMENT")) {
    evidence.push({
      id: file.evidenceId,
      time: formatTime(createdAt),
      title: file.type.startsWith("audio/") ? "用户上传录音" : file.type.startsWith("image/") ? "用户上传截图" : "用户上传附件",
      summary: `${file.name} · SHA-256 ${file.sha256.slice(0, 12)}…，作为辅助材料，未直接写入自动判责条件。`,
      source: "用户上传附件",
      quality: "MEDIUM",
      fileId: file.id,
    });
  }

  const geofenceStatus = enteredGeofence ? "SUPPORTED" : traceContinuous ? "CONTRADICTED" : "UNKNOWN";
  const dwellStatus = dwellSeconds >= requiredWait ? "SUPPORTED" : traceContinuous ? "CONTRADICTED" : "UNKNOWN";
  const caseId = safeCaseId(order.orderId, createdAt);
  return {
    id: caseId,
    storage: "LOCAL",
    title: `已上传 · ${order.title || order.orderId}`,
    description: `由订单 JSON 与轨迹 CSV 自动解析；原始文件哈希和规则版本已冻结。`,
    scenario: order.scenario || "司机是否到达及取消费争议",
    claims: order.claims || { driver: "未提供司机主张", passenger: "未提供乘客主张" },
    facts: [
      { id: "F_GEOFENCE", status: geofenceStatus, evidenceIds: [trajectoryEvidenceId], note: enteredGeofence ? `轨迹显示车辆进入 ${radius} 米有效范围。` : traceContinuous ? `连续轨迹显示车辆始终在 ${radius} 米有效范围外。` : "轨迹质量不足，无法确认是否进入有效范围。" },
      { id: "F_DWELL", status: dwellStatus, evidenceIds: [trajectoryEvidenceId], note: `有效范围内最长连续停留 ${dwellSeconds} 秒，规则要求 ${requiredWait} 秒。` },
      { id: "F_CONTACT", status: contactAttempts.length > 0 ? "SUPPORTED" : "UNKNOWN", evidenceIds: contactAttempts.length > 0 ? [contactEvidenceId] : [], note: contactAttempts.length > 0 ? `取消前记录到 ${contactAttempts.length} 次司机主动联系。` : "订单数据未提供取消前联系记录。" },
      { id: "F_CANCEL_TIME", status: waitedSeconds >= requiredWait ? "SUPPORTED" : "CONTRADICTED", evidenceIds: [orderEvidenceId], note: `订单记录到达至取消间隔 ${waitedSeconds} 秒。` },
      { id: "F_TRACE_CONTINUITY", status: traceContinuous ? "SUPPORTED" : "UNKNOWN", evidenceIds: [trajectoryEvidenceId], note: traceContinuous ? `轨迹最大间隔 ${Math.round(maxGap)} 秒，所有定位精度均在 ${MAX_ACCURACY_METERS} 米以内。` : `轨迹最大间隔 ${Math.round(maxGap)} 秒或存在低精度点，未达到连续性要求。` },
    ],
    evidence,
    files,
    createdAt,
    updatedAt: createdAt,
    owner: "待领取",
    workflowStatus: "PENDING",
    audit: [
      { at: createdAt, title: "纠纷案件已创建", detail: `接收订单 ${order.orderId} 及 ${files.length} 个文件。`, actor: "local.ingestion" },
      { at: createdAt + 1, title: "证据解析完成", detail: `生成 ${evidence.length} 项证据与 5 个必要事实。`, actor: "evidence.parser · v1.0-local" },
      { at: createdAt + 2, title: "规则门控完成", detail: "使用冻结的证明模板运行确定性判责。", actor: "verdict.engine" },
    ],
  };
}
