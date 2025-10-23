
export interface Patient {
  id: string;
  number: string;
  type: 'normal' | 'priority';
  employeeBadge: string;
  timestamp: Date;
  status: 'waiting' | 'called' | 'in_service' | 'completed';
  calledAt?: Date;
  consultingRoom?: string;
  attendant?: string;
  // Novos campos opcionais para o fluxo do Wizard no Tablet
  personType?: 'visitante' | 'colaborador';
  name?: string;
}

export interface QueueStats {
  totalToday: number;
  normalQueue: number;
  priorityQueue: number;
  averageWaitTime: number;
  completedToday: number;
}

export interface CallHistory {
  id: string;
  patientNumber: string;
  type: 'triage' | 'consulting';
  location: string;
  timestamp: Date;
}
