import { getOrders } from '@/services/order/orderServerService'
import { OrderType } from '@/types'
import {
	useQuery,
	useMutation,
	useQueryClient,
	UseQueryOptions,
} from '@tanstack/react-query'

// Query Keys
export const orderKeys = {
	all: ['orders'] as const,
	lists: () => [...orderKeys.all, 'list'] as const,
	list: (userId: string) => [...orderKeys.lists(), { userId }] as const,
	details: () => [...orderKeys.all, 'detail'] as const,
	detail: (id: string) => [...orderKeys.details(), id] as const,
}

// Get all orders for a user
export function useOrders(
	userId: string,
	options?: UseQueryOptions<OrderType[]>
) {
	return useQuery({
		queryKey: orderKeys.list(userId),
		queryFn: () => getOrders(userId),
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		retry: (failureCount, error) => {
			if (
				error instanceof Error &&
				(error.message.includes('404') ||
					error.message.includes('permission'))
			) {
				return false
			}
			return failureCount < 2
		},
		throwOnError: false,
		...options,
	})
}

// Cancel order mutation (verifies the caller's Firebase ID token server-side)
export function useCancelOrder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			orderId,
			reason,
			userId,
		}: {
			orderId: string
			reason: string
			userId: string
		}) => {
			const { auth } = await import('@/lib/firebase/client')
			const token = await auth.currentUser?.getIdToken()
			if (!token) throw new Error('You must be signed in to cancel an order.')
			const { cancelOrderWithRestock } = await import('@/services/order/cancelOrderServer')
			const result = await cancelOrderWithRestock(orderId, reason, token)
			if (!result.success) {
				throw new Error(result.error)
			}
			return { orderId, userId }
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(variables.orderId),
			})
			if (variables.userId) {
				queryClient.invalidateQueries({
					queryKey: orderKeys.list(variables.userId),
				})
			}
			queryClient.invalidateQueries({
				queryKey: orderKeys.lists(),
			})
		},
	})
}
