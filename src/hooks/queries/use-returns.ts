import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { returnService, CreateReturnInput } from "@/services/return/returnService";
import { adminReturnService, ReturnFilters } from "@/services/admin/adminReturnService";
import { ReturnStatus } from "@/types";

export const RETURN_KEYS = {
  all: ["returns"] as const,
  user: (userId: string) => [...RETURN_KEYS.all, "user", userId] as const,
  detail: (returnId: string) => [...RETURN_KEYS.all, "detail", returnId] as const,
  adminList: (filters: ReturnFilters, page: number) =>
    [...RETURN_KEYS.all, "admin", filters, page] as const,
  adminAnalytics: () => [...RETURN_KEYS.all, "admin-analytics"] as const,
};

export function useUserReturns(userId: string) {
  return useQuery({
    queryKey: RETURN_KEYS.user(userId),
    queryFn: () => returnService.getUserReturns(userId),
    enabled: !!userId,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReturnInput) => returnService.createReturnRequest(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RETURN_KEYS.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: RETURN_KEYS.all });
    },
  });
}

export function useAdminReturns(filters: ReturnFilters = {}, page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: RETURN_KEYS.adminList(filters, page),
    queryFn: () => adminReturnService.getAllReturns(filters, page, limit),
  });
}

export function useAdminReturnAnalytics() {
  return useQuery({
    queryKey: RETURN_KEYS.adminAnalytics(),
    queryFn: () => adminReturnService.getReturnAnalytics(),
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      returnId,
      status,
      adminNotes,
      shouldRestock,
    }: {
      returnId: string;
      status: ReturnStatus;
      adminNotes?: string;
      shouldRestock?: boolean;
    }) => adminReturnService.updateReturnStatus(returnId, status, adminNotes, shouldRestock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
