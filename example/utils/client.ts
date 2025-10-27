const reownProjectId = import.meta.env.VITE_REOWN_PROJECT_ID;
const authApi = import.meta.env.VITE_API!;
const isProduction = import.meta.env.MODE === 'production';
console.log('isProduction', isProduction);


if (!reownProjectId) {
  throw Error("Missing reown project id");
}
if (!authApi) {
  throw Error("Missing auth api");
}

export const ReownProjectId = reownProjectId;
export const AuthApi = authApi;
export const IsProduction = isProduction;

