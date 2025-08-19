export interface RoleStore {
  role: "user" | "host";

  setRole: (role: "user" | "host") => void;
}
