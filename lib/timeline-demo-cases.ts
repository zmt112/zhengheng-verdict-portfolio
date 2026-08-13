export type EvidenceType = "GPS" | "AUDIO" | "IM" | "ORDER" | "IMAGE";
export type Actor = "PASSENGER" | "PLATFORM" | "DRIVER";
export type FactStatus = "SUPPORTED" | "CONFLICTED" | "UNKNOWN" | "EXPERIENCE";

export type EvidenceItem = { name: string; type: EvidenceType; quality?: "HIGH" | "MEDIUM" | "LOW" };

export type TimelineEvent = {
  id: string;
  phaseId: string;
  actor: Actor;
  time: string;
  title: string;
  position: number;
  icon: string;
  evidence: EvidenceItem[];
  summary: string;
  fact: string;
  occurredAt: string;
  submittedAt?: string;
  conflict?: boolean;
};

export type CasePhase = {
  id: string;
  label: string;
  date: string;
  time: string;
  rangeLabel: string;
  state: "complete" | "warning" | "blocked";
  summary: string;
  gapBefore?: string;
  ticks: string[];
};

export type TimelineFact = {
  id: string;
  label: string;
  status: FactStatus;
  evidence: string;
  interpretation: string;
  impact: string;
};

export type TimelineDemoCase = {
  id: string;
  title: string;
  tag: string;
  status: "DECIDABLE" | "CONFLICT";
  statusLabel: string;
  statusHint: string;
  phases: CasePhase[];
  events: TimelineEvent[];
  facts: TimelineFact[];
  decision: { title: string; summary: string; action: string };
};

const sameDayEvents: TimelineEvent[] = [
  { id: "same-passenger-shot", phaseId: "trip", actor: "PASSENGER", time: "14:29:45", title: "乘客截取地图", position: 47, icon: "▧", evidence: [{ name: "乘客地图截图.png", type: "IMAGE", quality: "MEDIUM" }, { name: "截图OCR结果.json", type: "IMAGE" }], summary: "截图显示司机当时距上车点约 187 米，但截图发生在司机实际到达前 81 秒。", fact: "只能证明截图时刻的位置状态，不能证明取消时司机仍未到达。", occurredAt: "2026-07-18 14:29:45" },
  { id: "same-passenger-location", phaseId: "trip", actor: "PASSENGER", time: "14:31:20", title: "乘客位于入口 B", position: 54, icon: "⌖", evidence: [{ name: "乘客定位点.json", type: "GPS" }], summary: "乘客位于距平台锚点 129 米的入口 B，定位精度 18 米。", fact: "支持乘客没有看到司机的体验，但不反驳司机到达平台指定点。", occurredAt: "2026-07-18 14:31:20" },
  { id: "same-passenger-im", phaseId: "trip", actor: "PASSENGER", time: "14:34:30", title: "发送位置消息", position: 67, icon: "···", evidence: [{ name: "司乘IM会话.json", type: "IM" }], summary: "乘客发送“我在入口 B，看不到你”，消息已送达。", fact: "证明乘客表达了所在入口，不直接证明车辆位置。", occurredAt: "2026-07-18 14:34:30" },
  { id: "same-platform-order", phaseId: "trip", actor: "PLATFORM", time: "14:18:05", title: "订单创建", position: 4, icon: "◇", evidence: [{ name: "订单流水.json", type: "ORDER" }], summary: "平台记录发单、接单、到达、取消与计费状态。", fact: "提供事件时间基准和规则版本。", occurredAt: "2026-07-18 14:18:05" },
  { id: "same-platform-call", phaseId: "trip", actor: "PLATFORM", time: "14:32:10", title: "平台电话接通", position: 58, icon: "☎", evidence: [{ name: "平台通话录音.wav", type: "AUDIO" }, { name: "ASR分角色转写.json", type: "AUDIO" }, { name: "通话元数据.json", type: "ORDER" }], summary: "司乘电话接通 28 秒，双方描述了不同的入口位置。", fact: "证明取消前完成必要联系；通话内容不替代 GPS 证明车辆位置。", occurredAt: "2026-07-18 14:32:10" },
  { id: "same-platform-cancel", phaseId: "trip", actor: "PLATFORM", time: "14:37:34", title: "司机取消并计费", position: 79, icon: "¥", evidence: [{ name: "取消事件.json", type: "ORDER" }, { name: "取消费规则快照.json", type: "ORDER" }], summary: "进入围栏后 382 秒，司机以乘客未出现为由取消，产生 8 元费用。", fact: "证明取消发生在等待阈值之后。", occurredAt: "2026-07-18 14:37:34" },
  { id: "same-driver-accept", phaseId: "trip", actor: "DRIVER", time: "14:18:11", title: "司机接单", position: 5, icon: "车", evidence: [{ name: "接单事件.json", type: "ORDER" }], summary: "司机在距上车点约 1.8 公里处接单并开始前往。", fact: "提供行程起点，不参与最终责任判断。", occurredAt: "2026-07-18 14:18:11" },
  { id: "same-driver-gps", phaseId: "trip", actor: "DRIVER", time: "14:18—14:31", title: "连续 GPS 轨迹", position: 32, icon: "⌁", evidence: [{ name: "司机GPS轨迹.csv", type: "GPS" }, { name: "轨迹质量报告.json", type: "GPS" }], summary: "连续轨迹显示司机逐步接近平台锚点，最终进入 60 米围栏。", fact: "支持司机进入有效上车范围，且关键时间窗轨迹连续。", occurredAt: "2026-07-18 14:18:11—14:31:06" },
  { id: "same-driver-arrive", phaseId: "trip", actor: "DRIVER", time: "14:31:12", title: "点击到达", position: 53, icon: "✓", evidence: [{ name: "到达事件.json", type: "ORDER" }, { name: "到达定位快照.json", type: "GPS" }], summary: "点击到达时距锚点 28 米，定位精度 8 米。", fact: "与连续轨迹共同支持司机到达，而非仅依赖点击行为。", occurredAt: "2026-07-18 14:31:12" },
  { id: "same-driver-wait", phaseId: "trip", actor: "DRIVER", time: "14:31—14:37", title: "围栏内持续等待", position: 70, icon: "◷", evidence: [{ name: "围栏停留计算.json", type: "GPS" }], summary: "司机在有效范围内持续停留 382 秒。", fact: "支持达到规则要求的等待时长。", occurredAt: "2026-07-18 14:31:12—14:37:34" },
  { id: "same-dispute", phaseId: "appeal", actor: "PASSENGER", time: "14:42:16", title: "当天提交申诉", position: 24, icon: "!", evidence: [{ name: "纠纷工单.json", type: "ORDER" }, { name: "证据附件清单.json", type: "ORDER" }], summary: "乘客以“司机未到上车点”为由提交取消费申诉。", fact: "定义争议命题，不作为责任事实。", occurredAt: "2026-07-18 14:42:16", submittedAt: "2026-07-18 14:42:16" },
  { id: "same-attachment", phaseId: "appeal", actor: "PLATFORM", time: "14:42:40", title: "附件登记与哈希", position: 52, icon: "#", evidence: [{ name: "附件入库回执.json", type: "ORDER" }], summary: "平台登记截图和录音的来源、形成时间、上传时间与文件哈希。", fact: "建立证据来源链，不代表附件中的主张已经成立。", occurredAt: "2026-07-18 14:42:40" },
  { id: "same-snapshot", phaseId: "review", actor: "PLATFORM", time: "14:43:02", title: "冻结案件快照", position: 28, icon: "▣", evidence: [{ name: "SNAP-005-V1.json", type: "ORDER" }], summary: "系统将订单、轨迹、联系记录和用户附件冻结为同一版本。", fact: "确保后续复算使用同一证据与规则版本。", occurredAt: "2026-07-18 14:43:02" },
  { id: "same-evaluate", phaseId: "review", actor: "PLATFORM", time: "14:43:08", title: "事实门控通过", position: 60, icon: "✓", evidence: [{ name: "事实评估结果.json", type: "ORDER" }], summary: "四项必要事实均获得满足质量要求的证据支持。", fact: "允许输出司机已完成到达、等待与联系义务的建议结论。", occurredAt: "2026-07-18 14:43:08" },
];

const delayedEvents: TimelineEvent[] = [
  { id: "late-passenger-wait", phaseId: "trip", actor: "PASSENGER", time: "20:05:40", title: "乘客在南门等待", position: 36, icon: "人", evidence: [{ name: "乘客定位快照.json", type: "GPS" }], summary: "乘客位于南门入口，距平台指定上车点 164 米。", fact: "支持乘客没有看到司机的体验，但不能单独判断司机是否到达平台锚点。", occurredAt: "2026-08-12 20:05:40" },
  { id: "late-passenger-im", phaseId: "trip", actor: "PASSENGER", time: "20:07:18", title: "询问司机位置", position: 56, icon: "···", evidence: [{ name: "司乘IM会话.json", type: "IM" }], summary: "乘客询问“我在南门，你在哪里”，消息已送达。", fact: "证明双方发生入口沟通，不证明任何一方的空间位置。", occurredAt: "2026-08-12 20:07:18" },
  { id: "late-order", phaseId: "trip", actor: "PLATFORM", time: "20:01:04", title: "订单创建", position: 4, icon: "◇", evidence: [{ name: "订单流水.json", type: "ORDER" }], summary: "平台生成订单并冻结指定上车点。", fact: "提供事件时间基准。", occurredAt: "2026-08-12 20:01:04" },
  { id: "late-location-conflict", phaseId: "trip", actor: "PLATFORM", time: "20:06:02", title: "两路定位发生冲突", position: 45, icon: "!", conflict: true, evidence: [{ name: "司机手机定位.csv", type: "GPS" }, { name: "车辆遥测定位.csv", type: "GPS" }, { name: "定位对账报告.json", type: "GPS" }], summary: "司机手机定位显示距锚点 42 米；同一时刻车辆遥测显示距锚点 318 米。两路均为高可信平台数据。", fact: "关键空间事实存在高影响冲突，不能选择更有利于任一方的一路数据直接判责。", occurredAt: "2026-08-12 20:06:02" },
  { id: "late-call", phaseId: "trip", actor: "PLATFORM", time: "20:08:10", title: "平台电话接通", position: 64, icon: "☎", evidence: [{ name: "通话元数据.json", type: "ORDER" }, { name: "ASR转写.json", type: "AUDIO", quality: "MEDIUM" }], summary: "司机主动联系乘客，通话接通 19 秒。", fact: "支持完成必要联系，但不能消解定位冲突。", occurredAt: "2026-08-12 20:08:10" },
  { id: "late-cancel", phaseId: "trip", actor: "PLATFORM", time: "20:13:15", title: "司机取消并计费", position: 91, icon: "¥", evidence: [{ name: "取消事件.json", type: "ORDER" }], summary: "司机点击到达后等待 421 秒并取消订单。", fact: "证明操作时间满足阈值，不等于已经证明车辆真实到达。", occurredAt: "2026-08-12 20:13:15" },
  { id: "late-driver-gps", phaseId: "trip", actor: "DRIVER", time: "20:01—20:06", title: "手机 GPS 接近锚点", position: 25, icon: "⌁", evidence: [{ name: "司机手机定位.csv", type: "GPS" }], summary: "司机手机 SDK 轨迹连续且显示进入 60 米围栏。", fact: "单独看支持到达，但与车辆遥测冲突，不能独立形成责任结论。", occurredAt: "2026-08-12 20:01:10—20:06:02", conflict: true },
  { id: "late-driver-arrive", phaseId: "trip", actor: "DRIVER", time: "20:06:14", title: "点击到达", position: 48, icon: "✓", evidence: [{ name: "到达点击事件.json", type: "ORDER" }], summary: "司机在 App 中点击到达。", fact: "属于操作行为，必须与可靠位置证据共同使用。", occurredAt: "2026-08-12 20:06:14" },
  { id: "late-upload", phaseId: "appeal", actor: "PASSENGER", time: "09:23:40", title: "隔日提交申诉", position: 22, icon: "!", evidence: [{ name: "隔日纠纷工单.json", type: "ORDER" }], summary: "乘客在次日上午对前一晚的取消费发起申诉。", fact: "定义争议命题，不改变前一晚的客观事实。", occurredAt: "2026-08-13 09:23:40", submittedAt: "2026-08-13 09:23:40" },
  { id: "late-shot", phaseId: "appeal", actor: "PASSENGER", time: "09:24:10", title: "补传昨日地图截图", position: 43, icon: "▧", evidence: [{ name: "昨日地图截图.png", type: "IMAGE", quality: "MEDIUM" }, { name: "截图时间校验.json", type: "IMAGE" }], summary: "截图于前一晚 20:05:52 形成，次日 09:24:10 上传；画面显示司机图标仍在远处。", fact: "为定位冲突提供补充线索，但截图展示的是客户端渲染位置，不能替代平台原始定位。", occurredAt: "2026-08-12 20:05:52", submittedAt: "2026-08-13 09:24:10" },
  { id: "late-ingest", phaseId: "appeal", actor: "PLATFORM", time: "09:24:12", title: "登记双时间与哈希", position: 55, icon: "#", evidence: [{ name: "附件来源链.json", type: "ORDER" }], summary: "平台分别记录证据形成时间、提交时间和入库时间。", fact: "防止把次日上传误解为次日发生。", occurredAt: "2026-08-13 09:24:12" },
  { id: "late-reconcile", phaseId: "review", actor: "PLATFORM", time: "09:30:05", title: "定位对账失败", position: 26, icon: "!", conflict: true, evidence: [{ name: "定位对账报告.json", type: "GPS" }, { name: "数据源健康报告.json", type: "ORDER" }], summary: "手机定位与车辆遥测在关键等待窗口持续矛盾，暂未发现可排除任一路的故障证据。", fact: "关键事实保持 CONFLICTED，触发人工专家复核。", occurredAt: "2026-08-13 09:30:05" },
  { id: "late-gate", phaseId: "review", actor: "PLATFORM", time: "09:30:08", title: "自动判责已停止", position: 55, icon: "—", evidence: [{ name: "门控结果.json", type: "ORDER" }], summary: "系统拒绝输出司机已履约或未履约的责任结论。", fact: "证据冲突时保持未知，比输出看似确定但不可复核的答案更安全。", occurredAt: "2026-08-13 09:30:08" },
  { id: "late-driver-task", phaseId: "review", actor: "DRIVER", time: "09:31:20", title: "请求补充设备诊断", position: 76, icon: "+", evidence: [{ name: "补证任务.json", type: "ORDER" }], summary: "系统向司机侧设备链路发起诊断数据补充任务。", fact: "用于判断手机是否与车辆分离或遥测是否存在延迟。", occurredAt: "2026-08-13 09:31:20" },
];

export const timelineDemoCases: TimelineDemoCase[] = [
  {
    id: "CASE-005",
    title: "当天申诉 · 商场入口错位",
    tag: "当天申诉",
    status: "DECIDABLE",
    statusLabel: "证据闭合，可形成建议结论",
    statusHint: "用户附件存在时间局限，但平台轨迹、到达、等待和联系记录相互支持。",
    phases: [
      { id: "trip", label: "行程发生", date: "7月18日", time: "14:18—14:37", rangeLabel: "当前片段 · 19 分钟", state: "complete", summary: "查看争议发生时司乘与平台记录。", ticks: ["14:18", "14:22", "14:26", "14:30", "14:34", "14:38"] },
      { id: "appeal", label: "当天申诉", date: "7月18日", time: "14:42—14:43", rangeLabel: "当前片段 · 1 分钟", state: "complete", gapBefore: "间隔 5 分钟", summary: "乘客当天提交申诉并上传补充材料。", ticks: ["14:42:00", "14:42:15", "14:42:30", "14:42:45", "14:43:00"] },
      { id: "review", label: "证据编排与判责", date: "7月18日", time: "14:43—14:44", rangeLabel: "当前片段 · 1 分钟", state: "complete", summary: "冻结快照并运行必要事实门控。", ticks: ["14:43:00", "14:43:15", "14:43:30", "14:43:45", "14:44:00"] },
    ],
    events: sameDayEvents,
    facts: [
      { id: "F_GEOFENCE", label: "司机进入有效上车范围", status: "SUPPORTED", evidence: "连续GPS、围栏事件、到达定位", interpretation: "多路平台记录相互支持；乘客截图早于实际到达。", impact: "满足自动判责条件" },
      { id: "F_DWELL", label: "司机达到规定等待时长", status: "SUPPORTED", evidence: "围栏内停留382秒", interpretation: "连续性与定位精度均达到规则要求。", impact: "满足自动判责条件" },
      { id: "F_CONTACT", label: "取消前完成必要联系", status: "SUPPORTED", evidence: "平台电话元数据", interpretation: "已接通28秒，不使用通话内容判责。", impact: "满足自动判责条件" },
      { id: "F_EXPERIENCE", label: "乘客未见到车辆的体验", status: "EXPERIENCE", evidence: "入口B定位、IM、录音", interpretation: "乘客体验成立，但与司机是否到平台锚点是两个命题。", impact: "转入上车点治理" },
    ],
    decision: { title: "司机已完成到达、等待与联系义务", summary: "关键责任事实均由满足质量要求的平台证据支持，可以生成建议结论；同时保留乘客入口体验问题。", action: "维持演示取消费 · 创建入口歧义治理任务" },
  },
  {
    id: "CASE-006",
    title: "隔日申诉 · 两路定位矛盾",
    tag: "隔日申诉",
    status: "CONFLICT",
    statusLabel: "证据冲突，停止自动判责",
    statusHint: "司机手机定位与车辆遥测在关键时刻相互矛盾，且暂时无法排除任一路。",
    phases: [
      { id: "trip", label: "行程发生", date: "8月12日", time: "20:01—20:13", rangeLabel: "当前片段 · 12 分钟", state: "warning", summary: "关键等待窗口出现两路高可信定位冲突。", ticks: ["20:01", "20:03", "20:06", "20:08", "20:11", "20:13"] },
      { id: "appeal", label: "隔日申诉", date: "8月13日", time: "09:23—09:25", rangeLabel: "当前片段 · 2 分钟", state: "complete", gapBefore: "跨夜 13小时10分", summary: "乘客次日上午提交申诉并补传前一晚形成的截图。", ticks: ["09:23:30", "09:23:50", "09:24:10", "09:24:30", "09:24:50"] },
      { id: "review", label: "冲突复核", date: "8月13日", time: "09:30—待处理", rangeLabel: "当前片段 · 处理中", state: "blocked", gapBefore: "间隔 5 分钟", summary: "系统停止自动判责并生成设备链路补证任务。", ticks: ["09:30:00", "09:30:30", "09:31:00", "09:31:30", "待处理"] },
    ],
    events: delayedEvents,
    facts: [
      { id: "F_GEOFENCE", label: "司机进入有效上车范围", status: "CONFLICTED", evidence: "手机GPS 42m ↔ 车辆遥测318m", interpretation: "两路均为高可信平台数据，不能择一使用。", impact: "阻断责任结论" },
      { id: "F_DWELL", label: "司机在范围内完成等待", status: "UNKNOWN", evidence: "到达点击、手机轨迹、取消时间", interpretation: "等待时长成立依赖“车辆已到达”，前置事实未闭合。", impact: "阻断责任结论" },
      { id: "F_CONTACT", label: "取消前完成必要联系", status: "SUPPORTED", evidence: "平台电话元数据", interpretation: "已接通19秒，但联系不能替代到达义务。", impact: "仅支持联系事实" },
      { id: "F_SCREENSHOT", label: "乘客补传截图的证明力", status: "EXPERIENCE", evidence: "20:05形成、次日09:24提交", interpretation: "截图是真实补充线索，但展示客户端渲染位置。", impact: "不能消解平台冲突" },
    ],
    decision: { title: "暂不输出司乘责任结论", summary: "关键空间事实存在高影响冲突。系统不会因为司机点击到达、乘客截图或任一方陈述而选择性下结论。", action: "暂停费用与处罚联动 · 转定位链路专家复核" },
  },
];
