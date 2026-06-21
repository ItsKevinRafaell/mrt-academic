import { api } from './client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface BoardGalleryItem {
  id: number;
  session_id: number;
  uploaded_by: string;
  title: string;
  description: string;
  image_url: string;
  ocr_text: string;
  tags: string[];
  order_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBoardGalleryRequest {
  session_id: number;
  title: string;
  description: string;
  image_url: string;
  ocr_text?: string;
  tags?: string[];
}

export interface UpdateBoardGalleryRequest {
  title?: string;
  description?: string;
  image_url?: string;
  ocr_text?: string;
  tags?: string[];
}

export interface ReorderBoardGalleryRequest {
  order_number: number;
}

export async function createBoardGalleryItem(
  data: CreateBoardGalleryRequest
): Promise<BoardGalleryItem> {
  const response = await api.post('/board-gallery', data);
  return response.data;
}

export async function getBoardGalleryBySession(
  sessionId: number
): Promise<BoardGalleryItem[]> {
  const response = await api.get(`/board-gallery/session/${sessionId}`);
  return response.data.data ?? [];
}

export async function getBoardGalleryItem(id: number): Promise<BoardGalleryItem> {
  const response = await api.get(`/board-gallery/${id}`);
  return response.data;
}

export async function updateBoardGalleryItem(
  id: number,
  data: UpdateBoardGalleryRequest
): Promise<BoardGalleryItem> {
  const response = await api.put(`/board-gallery/${id}`, data);
  return response.data;
}

export async function deleteBoardGalleryItem(id: number): Promise<void> {
  await api.delete(`/board-gallery/${id}`);
}

export async function reorderBoardGalleryItem(
  id: number,
  orderNumber: number
): Promise<void> {
  await api.patch(`/board-gallery/${id}/reorder`, { order_number: orderNumber });
}

export const boardGalleryKeys = {
  bySession: (sessionId: number) => ['board-gallery', 'session', sessionId] as const,
};

export function useBoardGallery(sessionId: number) {
  return useQuery({
    queryKey: boardGalleryKeys.bySession(sessionId),
    queryFn: () => getBoardGalleryBySession(sessionId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });
}

export function useCreateBoardGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardGalleryRequest) => createBoardGalleryItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: boardGalleryKeys.bySession(variables.session_id),
      });
    },
  });
}

export function useDeleteBoardGalleryItem(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBoardGalleryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardGalleryKeys.bySession(sessionId),
      });
    },
  });
}
