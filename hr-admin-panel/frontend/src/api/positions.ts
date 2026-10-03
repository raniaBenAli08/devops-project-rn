import apiClient from './client';
import { Position } from '../types';

export interface PositionRequest {
  title: string;
  level: string;
  minSalary: number | null;
  maxSalary: number | null;
  departmentId: number;
}

export const getPositions = async (): Promise<Position[]> => {
  const response = await apiClient.get('/positions');
  return response.data;
};

export const createPosition = async (data: PositionRequest): Promise<Position> => {
  const response = await apiClient.post('/positions', data);
  return response.data;
};
