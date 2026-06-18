export interface Photo {
  id: number;
  session_id: number;
  url: string;
  title: string;
  caption?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadPhotoRequest {
  file: File;
  title: string;
  caption?: string;
}
