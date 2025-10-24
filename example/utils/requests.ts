import { authService } from "../services/AuthService";
import { AuthApi } from "./client";

type GetOptions = {
  url: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

function getPathTo(to: string): string {
  return `${AuthApi}/${to}`;
}

export async function get({ url, params, headers }: GetOptions) {
  const response = await fetch(getPathTo(url) + "?" + new URLSearchParams(params), {
    method: "GET",
    headers: {
      ...(authService.AuthHeader ? { Authorization: authService.AuthHeader } : {}),
      ...headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return await response.json();
}

type PostOptions = {
  url: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export async function post({ url, params, headers }: PostOptions) {
  const response = await fetch(getPathTo(url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authService.AuthHeader ? { Authorization: authService.AuthHeader } : {}),
      ...headers,
    },
    body: JSON.stringify(params ?? {}),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const authHeader = response.headers.get("Authorization");
  if (authHeader) {
    console.log("Received Authorization header:", authHeader);
    authService.setAuthHeader(authHeader);
  }

  return await response.json();
}
