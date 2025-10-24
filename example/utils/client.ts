const reownProjectId = import.meta.env.VITE_REOWN_PROJECT_ID;
const authApi = import.meta.env.VITE_API!;


if (!reownProjectId) {
  throw Error("Missing reown project id");
}
if (!authApi) {
  throw Error("Missing auth api");
}

export const ReownProjectId = reownProjectId;
export const AuthApi = authApi;

