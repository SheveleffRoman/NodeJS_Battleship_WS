export const isValidRequestObject = (reqObj: unknown): boolean => {
  if (!isObj(reqObj)) {
    return false;
  }

  return (
    reqObj instanceof Object &&
    "type" in reqObj &&
    "id" in reqObj &&
    "data" in reqObj
  );
};

export const isObj = (obj: unknown): boolean => {
  return !!(obj && typeof obj);
};
