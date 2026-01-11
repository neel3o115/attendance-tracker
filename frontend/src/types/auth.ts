export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: User;
};
