
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Heart, 
  Pill, 
  Calendar, 
  Save, 
  Print, 
  Search,
  Plus,
  History,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Prontuario = () => {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dados de exemplo
  const samplePatients = [
    {
      id: '1',
      name: 'Maria Silva Santos',
      cpf: '123.456.789-00',
      birthDate: '1985-03-15',
      phone: '(11) 98765-4321',
      email: 'maria.silva@email.com',
      employeeBadge: 'EMP001',
      address: 'Rua das Flores, 123 - São Paulo, SP'
    },
    {
      id: '2',
      name: 'João Oliveira Costa',
      cpf: '987.654.321-00',
      birthDate: '1978-07-22',
      phone: '(11) 91234-5678',
      email: 'joao.costa@email.com',
      employeeBadge: 'EMP002',
      address: 'Av. Paulista, 456 - São Paulo, SP'
    }
  ];

  const [currentRecord, setCurrentRecord] = useState({
    complaints: '',
    currentIllnessHistory: '',
    pastMedicalHistory: '',
    medications: '',
    allergies: '',
    socialHistory: '',
    familyHistory: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: ''
    },
    physicalExam: '',
    diagnosis: '',
    treatment: '',
    followUp: '',
    observations: ''
  });

  const [prescriptions, setPrescriptions] = useState([
    { id: '1', medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const handleSaveRecord = () => {
    if (!selectedPatient) {
      toast({
        title: "Erro",
        description: "Selecione um paciente antes de salvar o prontuário",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Prontuário Salvo!",
      description: "As informações do paciente foram salvas com sucesso",
    });
  };

  const handlePrintRecord = () => {
    toast({
      title: "Imprimindo Prontuário",
      description: "O prontuário será enviado para impressão",
    });
  };

  const addPrescription = () => {
    const newId = (prescriptions.length + 1).toString();
    setPrescriptions([...prescriptions, {
      id: newId,
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const updatePrescription = (id: string, field: string, value: string) => {
    setPrescriptions(prescriptions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const currentPatient = samplePatients.find(p => p.id === selectedPatient);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-primary">PRONTUÁRIO ELETRÔNICO</h1>
          </div>
          <p className="text-xl text-muted-foreground">Sistema de Atendimento Médico</p>
        </div>

        {/* Seleção de Paciente */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="flex items-center">
              <Search className="mr-2" />
              Seleção de Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Buscar paciente por nome ou crachá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {samplePatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPatient === patient.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPatient(patient.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      <Badge variant="outline">{patient.employeeBadge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">CPF: {patient.cpf}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Paciente Selecionado */}
        {currentPatient && (
          <Card className="mb-6 shadow-lg">
            <CardHeader className="bg-success text-white">
              <CardTitle className="flex items-center">
                <User className="mr-2" />
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-semibold">Nome Completo</Label>
                  <p className="text-lg">{currentPatient.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Data de Nascimento</Label>
                  <p className="text-lg">{new Date(currentPatient.birthDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Telefone</Label>
                  <p className="text-lg">{currentPatient.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="font-semibold">Endereço</Label>
                  <p className="text-lg">{currentPatient.address}</p>
                </div>
                <div>
                  <Label className="font-semibold">Crachá</Label>
                  <p className="text-lg">{currentPatient.employeeBadge}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de Prontuário */}
        {selectedPatient && (
          <Card className="shadow-lg">
            <CardHeader className="bg-accent text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Stethoscope className="mr-2" />
                  Atendimento Médico
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={handleSaveRecord} className="bg-success hover:bg-success/90">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={handlePrintRecord} variant="outline" className="text-white border-white hover:bg-white/10">
                    <Print className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="anamnese" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                  <TabsTrigger value="sinais">Sinais Vitais</TabsTrigger>
                  <TabsTrigger value="exame">Exame Físico</TabsTrigger>
                  <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="prescricao">Prescrição</TabsTrigger>
                </TabsList>

                <TabsContent value="anamnese" className="space-y-6 mt-6">
                  <div className="grid gap-6">
                    <div>
                      <Label htmlFor="complaints" className="text-base font-semibold">Queixa Principal</Label>
                      <Textarea
                        id="complaints"
                        placeholder="Descreva a queixa principal do paciente..."
                        value={currentRecord.complaints}
                        onChange={(e) => setCurrentRecord({...currentRecord, complaints: e.target.value})}
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="currentHistory" className="text-base font-semibold">História da Doença Atual</Label>
                      <Textarea
                        id="currentHistory"
                        placeholder="Descreva a evolução dos sintomas..."
                        value={currentRecord.currentIllnessHistory}
                        onChange={(e) => setCurrentRecord({...currentRecord, currentIllnessHistory: e.target.value})}
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pastHistory" className="text-base font-semibold">Antecedentes Pessoais</Label>
                        <Textarea
                          id="pastHistory"
                          placeholder="Doenças anteriores, cirurgias..."
                          value={currentRecord.pastMedicalHistory}
                          onChange={(e) => setCurrentRecord({...currentRecord, pastMedicalHistory: e.target.value})}
                          className="mt-2"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="familyHistory" className="text-base font-semibold">Antecedentes Familiares</Label>
                        <Textarea
                          id="familyHistory"
                          placeholder="Histórico familiar de doenças..."
                          value={currentRecord.familyHistory}
                          onChange={(e) => setCurrentRecord({...currentRecord, familyHistory: e.target.value})}
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="medications" className="text-base font-semibold">Medicações em Uso</Label>
                        <Textarea
                          id="medications"
                          placeholder="Liste as medicações atuais..."
                          value={currentRecord.medications}
                          onChange={(e) => setCurrentRecord({...currentRecord, medications: e.target.value})}
                          className="mt-2"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="allergies" className="text-base font-semibold">Alergias</Label>
                        <Textarea
                          id="allergies"
                          placeholder="Alergias conhecidas..."
                          value={currentRecord.allergies}
                          onChange={(e) => setCurrentRecord({...currentRecord, allergies: e.target.value})}
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sinais" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bp" className="text-base font-semibold">Pressão Arterial</Label>
                      <Input
                        id="bp"
                        placeholder="120/80 mmHg"
                        value={currentRecord.vitalSigns.bloodPressure}
                        onChange={(e) => setCurrentRecord({
                          ...currentRecord,
                          vitalSigns: {...currentRecord.vitalSigns, bloodPressure: e.target.value}
                        })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="hr" className="text-base font-semibold">Frequência Cardíaca</Label>
                      <Input
                        id="hr"
                        placeholder="72 bpm"
                        value={currentRecord.vitalSigns.heartRate}
                        onChange={(e) => setCurrentRecord({
                          ...currentRecord,
                          vitalSigns: {...currentRecord.vitalSigns, heartRate: e.target.value}
                        })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="temp" className="text-base font-semibold">Temperatura</Label>
                      <Input
                        id="temp"
                        placeholder="36.5°C"
                        value={currentRecord.vitalSigns.temperature}
                        onChange={(e) => setCurrentRecord({
                          ...currentRecord,
                          vitalSigns: {...currentRecord.vitalSigns, temperature: e.target.value}
                        })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rr" className="text-base font-semibold">Freq. Respiratória</Label>
                      <Input
                        id="rr"
                        placeholder="16 irpm"
                        value={currentRecord.vitalSigns.respiratoryRate}
                        onChange={(e) => setCurrentRecord({
                          ...currentRecord,
                          vitalSigns: {...currentRecord.vitalSigns, respiratoryRate: e.target.value}
                        })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sat" className="text-base font-semibold">Saturação O2</Label>
                      <Input
                        id="sat"
                        placeholder="98%"
                        value={currentRecord.vitalSigns.oxygenSaturation}
                        onChange={(e) => setCurrentRecord({
                          ...currentRecord,
                          vitalSigns: {...currentRecord.vitalSigns, oxygenSaturation: e.target.value}
                        })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="weight" className="text-base font-semibold">Peso</Label>
                      <Input
                        id="weight"
                        placeholder="70 kg"
                        value={currentRecord.vitalSigns.weight}
                        onChange={(e) => setCurrentRecord({
                          ...currentRecord,
                          vitalSigns: {...currentRecord.vitalSigns, weight: e.target.value}
                        })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exame" className="space-y-6 mt-6">
                  <div>
                    <Label htmlFor="physicalExam" className="text-base font-semibold">Exame Físico</Label>
                    <Textarea
                      id="physicalExam"
                      placeholder="Descreva os achados do exame físico por sistemas..."
                      value={currentRecord.physicalExam}
                      onChange={(e) => setCurrentRecord({...currentRecord, physicalExam: e.target.value})}
                      className="mt-2"
                      rows={8}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="diagnostico" className="space-y-6 mt-6">
                  <div className="grid gap-6">
                    <div>
                      <Label htmlFor="diagnosis" className="text-base font-semibold">Diagnóstico</Label>
                      <Textarea
                        id="diagnosis"
                        placeholder="Diagnóstico principal e diagnósticos diferenciais..."
                        value={currentRecord.diagnosis}
                        onChange={(e) => setCurrentRecord({...currentRecord, diagnosis: e.target.value})}
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="treatment" className="text-base font-semibold">Plano Terapêutico</Label>
                      <Textarea
                        id="treatment"
                        placeholder="Tratamento proposto..."
                        value={currentRecord.treatment}
                        onChange={(e) => setCurrentRecord({...currentRecord, treatment: e.target.value})}
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="followUp" className="text-base font-semibold">Acompanhamento</Label>
                      <Textarea
                        id="followUp"
                        placeholder="Orientações e retorno..."
                        value={currentRecord.followUp}
                        onChange={(e) => setCurrentRecord({...currentRecord, followUp: e.target.value})}
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prescricao" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Prescrições</h3>
                    <Button onClick={addPrescription} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Medicação
                    </Button>
                  </div>

                  {prescriptions.map((prescription, index) => (
                    <Card key={prescription.id} className="p-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Medicação {index + 1}</Label>
                          <Badge variant="outline">
                            <Pill className="w-3 h-3 mr-1" />
                            Prescrição
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Medicamento</Label>
                            <Input
                              placeholder="Nome do medicamento"
                              value={prescription.medication}
                              onChange={(e) => updatePrescription(prescription.id, 'medication', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Dosagem</Label>
                            <Input
                              placeholder="Ex: 500mg"
                              value={prescription.dosage}
                              onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Frequência</Label>
                            <Input
                              placeholder="Ex: 8/8h"
                              value={prescription.frequency}
                              onChange={(e) => updatePrescription(prescription.id, 'frequency', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Duração</Label>
                            <Input
                              placeholder="Ex: 7 dias"
                              value={prescription.duration}
                              onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Instruções</Label>
                          <Textarea
                            placeholder="Instruções de uso..."
                            value={prescription.instructions}
                            onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Prontuario;
