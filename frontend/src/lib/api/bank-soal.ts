import type {
  ExamArchive,
  Simulation,
  SimulationQuestion,
  CreateExamArchiveRequest,
  CreateSimulationRequest,
} from '@/types/bank-soal';
import { api } from './client';

export async function getExamArchives(courseId?: number): Promise<ExamArchive[]> {
  const url = courseId
    ? `/bank-soal/archives?course_id=${courseId}`
    : '/bank-soal/archives';
  const response = await api.get(url);
  // API returns array directly, not wrapped in data object
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getExamArchive(id: number): Promise<ExamArchive> {
  const response = await api.get(`/bank-soal/archives/${id}`);
  return response?.data?.data;
}

export async function createExamArchive(data: CreateExamArchiveRequest): Promise<ExamArchive> {
  const response = await api.post('/bank-soal/archives', data);
  return response?.data?.data;
}

export async function updateExamArchive(id: number, data: Partial<ExamArchive>): Promise<ExamArchive> {
  const response = await api.put(`/bank-soal/archives/${id}`, data);
  return response?.data?.data;
}

export async function deleteExamArchive(id: number): Promise<void> {
  await api.delete(`/bank-soal/archives/${id}`);
}

export async function getSimulations(courseId?: number): Promise<Simulation[]> {
  const url = courseId
    ? `/bank-soal/simulations?course_id=${courseId}`
    : '/bank-soal/simulations';
  const response = await api.get(url);
  // API returns array directly, not wrapped in data object
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getSimulation(id: number): Promise<Simulation> {
  const response = await api.get(`/bank-soal/simulations/${id}`);
  return response?.data?.data;
}

export async function createSimulation(data: CreateSimulationRequest): Promise<Simulation> {
  const response = await api.post('/bank-soal/simulations', data);
  return response?.data?.data;
}

export async function updateSimulation(id: number, data: Partial<Simulation>): Promise<Simulation> {
  const response = await api.put(`/bank-soal/simulations/${id}`, data);
  return response?.data?.data;
}

export async function deleteSimulation(id: number): Promise<void> {
  await api.delete(`/bank-soal/simulations/${id}`);
}

export async function getSimulationQuestions(simulationId: number): Promise<SimulationQuestion[]> {
  const response = await api.get(`/bank-soal/simulations/${simulationId}/questions`);
  // API returns array directly, not wrapped in data object
  return Array.isArray(response?.data) ? response.data : [];
}
