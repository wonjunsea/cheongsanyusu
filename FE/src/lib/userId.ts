const STORAGE_KEY = 'bitu-stop:user_id';

/** 프로토타입 단계 사용자 식별자 — localStorage에 저장되는 랜덤 UUID */
export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
