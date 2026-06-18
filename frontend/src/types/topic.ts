export interface Topic {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order_number: number;
  created_at: string;
  updated_at: string;
}

export interface TopicWithSessions extends Topic {
  sessions: TopicSession[];
}

export interface TopicWithDetails extends Topic {
  sessions: TopicSession[];
  materials: TopicMaterial[];
  session_count: number;
  material_count: number;
}

export interface TopicSession {
  id: number;
  course_id: number;
  number: number;
  title: string;
  description?: string;
  topic_id?: number;
  materials?: TopicMaterial[];
}

export interface TopicMaterial {
  id: number;
  session_id?: number;
  topic_id?: number;
  title: string;
  description?: string;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTopicRequest {
  name: string;
  description?: string;
}

export interface UpdateTopicRequest {
  name?: string;
  description?: string;
}

export interface ReorderTopicsRequest {
  topic_ids: number[];
}
