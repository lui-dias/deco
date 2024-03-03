export const measure = <T extends Array<any>, U>(
  fn: (...args: T) => U,
  t: string,
) => {
  return (...args: T): U => {
    console.time(t);
    const a = fn(...args);
    console.timeEnd(t);
    return a;
  };
};
