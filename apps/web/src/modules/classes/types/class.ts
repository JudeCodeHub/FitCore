export interface IClassTrainer {
  id: string;
  name: string;
}

export interface IClass {
  id: string;
  name: string;
  trainerId: string;
  trainer: IClassTrainer;
  capacity: number;
  startTime: string;
  endTime: string;
  recurrenceRule: string | null;
  bookedCount: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}
