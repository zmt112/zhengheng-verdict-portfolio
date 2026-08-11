export type LocalFileRecord = {
  id: string;
  caseId: string;
  evidenceId: string;
  name: string;
  type: string;
  size: number;
  sha256: string;
  role: "ORDER" | "TRAJECTORY" | "ATTACHMENT";
  blob: Blob;
};

const DB_NAME = "zhengheng-verdict-local";
const DB_VERSION = 1;
const CASE_STORE = "cases";
const FILE_STORE = "files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("当前浏览器不支持 IndexedDB"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CASE_STORE)) database.createObjectStore(CASE_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(FILE_STORE)) database.createObjectStore(FILE_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开本地案件库"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("本地存储操作失败"));
  });
}

export async function saveLocalCase(caseData: Record<string, unknown>, files: LocalFileRecord[]) {
  const database = await openDatabase();
  const transaction = database.transaction([CASE_STORE, FILE_STORE], "readwrite");
  transaction.objectStore(CASE_STORE).put(caseData);
  for (const file of files) transaction.objectStore(FILE_STORE).put(file);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("案件保存失败"));
    transaction.onabort = () => reject(transaction.error ?? new Error("案件保存已中止"));
  });
  database.close();
}

export async function listLocalCases<T = Record<string, unknown>>(): Promise<T[]> {
  const database = await openDatabase();
  const items = await requestResult(database.transaction(CASE_STORE).objectStore(CASE_STORE).getAll()) as T[];
  database.close();
  return items.sort((a, b) => Number((b as Record<string, unknown>).createdAt ?? 0) - Number((a as Record<string, unknown>).createdAt ?? 0));
}

export async function getLocalCase<T = Record<string, unknown>>(caseId: string): Promise<T | undefined> {
  const database = await openDatabase();
  const item = await requestResult(database.transaction(CASE_STORE).objectStore(CASE_STORE).get(caseId)) as T | undefined;
  database.close();
  return item;
}

export async function getLocalFile(fileId: string): Promise<LocalFileRecord | undefined> {
  const database = await openDatabase();
  const item = await requestResult(database.transaction(FILE_STORE).objectStore(FILE_STORE).get(fileId)) as LocalFileRecord | undefined;
  database.close();
  return item;
}

export async function updateLocalCaseWorkflow(caseId: string, update: { status: string; owner?: string; title: string; detail: string }) {
  const caseData = await getLocalCase<Record<string, unknown>>(caseId);
  if (!caseData) throw new Error("未找到本地案件");
  const now = Date.now();
  const audit = Array.isArray(caseData.audit) ? caseData.audit : [];
  const next = {
    ...caseData,
    workflowStatus: update.status,
    owner: update.owner ?? caseData.owner,
    updatedAt: now,
    audit: [...audit, { at: now, title: update.title, detail: update.detail, actor: "portfolio.operator" }],
  };
  const database = await openDatabase();
  await requestResult(database.transaction(CASE_STORE, "readwrite").objectStore(CASE_STORE).put(next));
  database.close();
  return next;
}

export async function clearLocalCases() {
  const database = await openDatabase();
  const transaction = database.transaction([CASE_STORE, FILE_STORE], "readwrite");
  transaction.objectStore(CASE_STORE).clear();
  transaction.objectStore(FILE_STORE).clear();
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("清空失败"));
  });
  database.close();
}

export async function sha256(file: Blob) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
