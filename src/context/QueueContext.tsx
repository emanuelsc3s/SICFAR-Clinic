
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Patient, QueueStats, CallHistory } from '@/types/queue';

interface QueueState {
  patients: Patient[];
  currentCalls: CallHistory[];
  stats: QueueStats;
}

type QueueAction = 
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'CALL_PATIENT'; payload: { patientId: string; location: string; attendant: string } }
  | { type: 'COMPLETE_PATIENT'; payload: string }
  | { type: 'UPDATE_STATS' };

const initialState: QueueState = {
  patients: [],
  currentCalls: [],
  stats: {
    totalToday: 0,
    normalQueue: 0,
    priorityQueue: 0,
    averageWaitTime: 0,
    completedToday: 0
  }
};

const QueueContext = createContext<{
  state: QueueState;
  dispatch: React.Dispatch<QueueAction>;
} | null>(null);

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'ADD_PATIENT': {
      const newPatients = [...state.patients, action.payload];
      return {
        ...state,
        patients: newPatients,
        stats: {
          ...state.stats,
          totalToday: state.stats.totalToday + 1,
          normalQueue: newPatients.filter(p => p.type === 'normal' && p.status === 'waiting').length,
          priorityQueue: newPatients.filter(p => p.type === 'priority' && p.status === 'waiting').length
        }
      };
    }
    
    case 'CALL_PATIENT': {
      const updatedPatients = state.patients.map(patient => 
        patient.id === action.payload.patientId 
          ? { 
              ...patient, 
              status: 'called' as const, 
              calledAt: new Date(),
              attendant: action.payload.attendant
            }
          : patient
      );
      
      const calledPatient = updatedPatients.find(p => p.id === action.payload.patientId);
      const newCall: CallHistory = {
        id: `call-${Date.now()}`,
        patientNumber: calledPatient?.number || '',
        type: action.payload.location.includes('Consultório') ? 'consulting' : 'triage',
        location: action.payload.location,
        timestamp: new Date()
      };
      
      const updatedCalls = [newCall, ...state.currentCalls].slice(0, 6);
      
      return {
        ...state,
        patients: updatedPatients,
        currentCalls: updatedCalls,
        stats: {
          ...state.stats,
          normalQueue: updatedPatients.filter(p => p.type === 'normal' && p.status === 'waiting').length,
          priorityQueue: updatedPatients.filter(p => p.type === 'priority' && p.status === 'waiting').length
        }
      };
    }
    
    case 'COMPLETE_PATIENT': {
      const updatedPatients = state.patients.map(patient => 
        patient.id === action.payload 
          ? { ...patient, status: 'completed' as const }
          : patient
      );
      
      return {
        ...state,
        patients: updatedPatients,
        stats: {
          ...state.stats,
          completedToday: state.stats.completedToday + 1,
          normalQueue: updatedPatients.filter(p => p.type === 'normal' && p.status === 'waiting').length,
          priorityQueue: updatedPatients.filter(p => p.type === 'priority' && p.status === 'waiting').length
        }
      };
    }
    
    default:
      return state;
  }
}

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, initialState);

  // Simular dados iniciais para demonstração
  useEffect(() => {
    const samplePatients: Patient[] = [
      {
        id: '1',
        number: 'N001',
        type: 'normal',
        employeeBadge: 'EMP001',
        timestamp: new Date(Date.now() - 300000),
        status: 'waiting'
      },
      {
        id: '2',
        number: 'P001',
        type: 'priority',
        employeeBadge: 'EMP002',
        timestamp: new Date(Date.now() - 600000),
        status: 'waiting'
      },
      {
        id: '3',
        number: 'N002',
        type: 'normal',
        employeeBadge: 'EMP003',
        timestamp: new Date(Date.now() - 900000),
        status: 'waiting'
      },
      {
        id: '4',
        number: 'P002',
        type: 'priority',
        employeeBadge: 'EMP004',
        timestamp: new Date(Date.now() - 1200000),
        status: 'waiting'
      }
    ];

    samplePatients.forEach(patient => {
      dispatch({ type: 'ADD_PATIENT', payload: patient });
    });

    // Simular algumas chamadas atuais
    setTimeout(() => {
      dispatch({ 
        type: 'CALL_PATIENT', 
        payload: { 
          patientId: '2', 
          location: 'Triagem 1', 
          attendant: 'Enfermeira Ana' 
        } 
      });
    }, 1000);

    setTimeout(() => {
      dispatch({ 
        type: 'CALL_PATIENT', 
        payload: { 
          patientId: '1', 
          location: 'Consultório 3', 
          attendant: 'Dr. Silva' 
        } 
      });
    }, 2000);

    setTimeout(() => {
      dispatch({ 
        type: 'CALL_PATIENT', 
        payload: { 
          patientId: '4', 
          location: 'Triagem 2', 
          attendant: 'Enfermeira Maria' 
        } 
      });
    }, 3000);

    setTimeout(() => {
      dispatch({ 
        type: 'CALL_PATIENT', 
        payload: { 
          patientId: '3', 
          location: 'Consultório 1', 
          attendant: 'Dra. Santos' 
        } 
      });
    }, 4000);
  }, []);

  return (
    <QueueContext.Provider value={{ state, dispatch }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
