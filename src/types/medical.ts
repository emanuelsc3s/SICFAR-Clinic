
export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  employeeBadge: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: Date;
  doctor: string;
  complaints: string;
  currentIllnessHistory: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  socialHistory: string;
  familyHistory: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    respiratoryRate: string;
    oxygenSaturation: string;
    weight: string;
    height: string;
  };
  physicalExam: string;
  diagnosis: string;
  treatment: string;
  prescriptions: Prescription[];
  followUp: string;
  observations: string;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: Date;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  reason: string;
}
