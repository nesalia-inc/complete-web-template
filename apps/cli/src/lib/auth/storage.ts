import Conf from "conf";

export type StoredCredentials = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  expiresAt: number;
};

export const storage = new Conf<{ credentials: StoredCredentials | null }>({
  projectName: "complete-web-template",
  configName: "auth",
  defaults: {
    credentials: null,
  },
});

export function saveCredentials(credentials: StoredCredentials): void {
  storage.set("credentials", credentials);
}

export function loadCredentials(): StoredCredentials | null {
  return storage.get("credentials");
}

export function clearCredentials(): void {
  storage.delete("credentials");
}

export function isExpired(credentials: StoredCredentials): boolean {
  return Date.now() > credentials.expiresAt;
}