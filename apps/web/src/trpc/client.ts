import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/trpc";

export const api = createTRPCReact<AppRouter>();
