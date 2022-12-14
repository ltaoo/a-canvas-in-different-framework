let _uuid = -1;
export function uuid() {
  console.log("[UTILS]uuid", _uuid);
  _uuid += 1;
  return _uuid;
}
export function setUuid(nextUuid: number) {
  _uuid = nextUuid;
  return _uuid;
}
