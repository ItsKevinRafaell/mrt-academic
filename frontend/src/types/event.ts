// TODO: API_NOT_READY — seluruh Events endpoint belum ada di backend
export type EventCategory = "ujian" | "tugas" | "libur" | "kegiatan" | "lainnya";

export interface AcademicEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  category: EventCategory;
  owner_id: string;
}

export interface EventInput {
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  category: EventCategory;
}
