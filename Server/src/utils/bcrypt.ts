import bcrypt from "bcrypt";

export const hashValue = (value: string, saltRounds = 10) => {
  return bcrypt.hash(value, saltRounds);
};

export const compareValue = (value: string, hashValue: string) => {
  return bcrypt.compare(value, hashValue);
};
