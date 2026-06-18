import { api } from './client';

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

// Create a new board gallery item
export async function createBoardGalleryItem(
  data: CreateBoardGalleryRequest
): Promise<BoardGalleryItem> {
  const response = await api.post('/board-gallery', data);
  return response.data;
}

// Get all board gallery items for a session
export async function getBoardGalleryBySession(
  sessionId: number
): Promise<BoardGalleryItem[]> {
  const response = await api.get(`/board-gallery/session/${sessionId}`);
  return response.data;
}

// Get a single board gallery item by ID
export async function getBoardGalleryItem(id: number): Promise<BoardGalleryItem> {
  const response = await api.get(`/board-gallery/${id}`);
  return response.data;
}

// Update a board gallery item
export async function updateBoardGalleryItem(
  id: number,
  data: UpdateBoardGalleryRequest
): Promise<BoardGalleryItem> {
  const response = await api.put(`/board-gallery/${id}`, data);
  return response.data;
}

// Delete a board gallery item (soft delete)
export async function deleteBoardGalleryItem(id: number): Promise<void> {
  await api.delete(`/board-gallery/${id}`);
}

// Reorder a board gallery item
export async function reorderBoardGalleryItem(
  id: number,
  orderNumber: number
): Promise<void> {
  await api.patch(`/board-gallery/${id}/reorder`, { order_number: orderNumber });
}
