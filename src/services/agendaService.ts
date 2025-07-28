import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Types for the agenda module
type AgentSchedule = Database['public']['Tables']['AgentSchedule']['Row'];
type AgentScheduleInsert = Database['public']['Tables']['AgentSchedule']['Insert'];
type AgentScheduleUpdate = Database['public']['Tables']['AgentSchedule']['Update'];

type AvailabilitySlot = Database['public']['Tables']['AvailabilitySlot']['Row'];
type AvailabilitySlotInsert = Database['public']['Tables']['AvailabilitySlot']['Insert'];
type AvailabilitySlotUpdate = Database['public']['Tables']['AvailabilitySlot']['Update'];

// ===== AGENT SCHEDULE SERVICE =====

export const agentScheduleService = {
  // Get agent schedule by agent ID
  async getByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from('AgentSchedule')
      .select('*')
      .eq('agentId', agentId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw new Error(`Erro ao buscar agenda do corretor: ${error.message}`);
    }

    return data;
  },

  // Create agent schedule
  async create(schedule: AgentScheduleInsert) {
    const { data, error } = await supabase
      .from('AgentSchedule')
      .insert(schedule)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar agenda do corretor: ${error.message}`);
    }

    return data;
  },

  // Update agent schedule
  async update(agentId: string, updates: AgentScheduleUpdate) {
    const { data, error } = await supabase
      .from('AgentSchedule')
      .update(updates)
      .eq('agentId', agentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar agenda do corretor: ${error.message}`);
    }

    return data;
  },

  // Upsert agent schedule (create or update)
  async upsert(schedule: AgentScheduleInsert) {
    const { data, error } = await supabase
      .from('AgentSchedule')
      .upsert(schedule, { onConflict: 'agentId' })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar agenda do corretor: ${error.message}`);
    }

    return data;
  },

  // Delete agent schedule
  async delete(agentId: string) {
    const { error } = await supabase
      .from('AgentSchedule')
      .delete()
      .eq('agentId', agentId);

    if (error) {
      throw new Error(`Erro ao deletar agenda do corretor: ${error.message}`);
    }

    return true;
  },

  // Get all agent schedules for a company
  async getByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('AgentSchedule')
      .select(`
        *,
        agent:User(
          id,
          name,
          email,
          role,
          isActive,
          companyId
        )
      `)
      .eq('agent.companyId', companyId);

    if (error) {
      throw new Error(`Erro ao buscar agendas da empresa: ${error.message}`);
    }

    return data;
  }
};

// ===== AVAILABILITY SLOT SERVICE =====

export const availabilitySlotService = {
  // Get slots by agent and date range
  async getByAgentAndDateRange(agentId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .select(`
        *,
        appointments:Appointment(
          id,
          title,
          description,
          status,
          contact:Contact(
            id,
            name,
            email,
            phone
          )
        )
      `)
      .eq('agentId', agentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('startTime', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar slots de disponibilidade: ${error.message}`);
    }

    return data;
  },

  // Get available slots for booking
  async getAvailableSlots(agentId: string, date: string) {
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .select('*')
      .eq('agentId', agentId)
      .eq('date', date)
      .eq('status', 'AVAILABLE')
      .order('startTime', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar slots disponíveis: ${error.message}`);
    }

    return data;
  },

  // Create availability slot
  async create(slot: AvailabilitySlotInsert) {
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .insert(slot)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar slot de disponibilidade: ${error.message}`);
    }

    return data;
  },

  // Create multiple slots (batch)
  async createBatch(slots: AvailabilitySlotInsert[]) {
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .insert(slots)
      .select();

    if (error) {
      throw new Error(`Erro ao criar slots de disponibilidade: ${error.message}`);
    }

    return data;
  },

  // Update availability slot
  async update(slotId: string, updates: AvailabilitySlotUpdate) {
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar slot de disponibilidade: ${error.message}`);
    }

    return data;
  },

  // Book a slot (mark as booked)
  async bookSlot(slotId: string, appointmentId?: string) {
    const updates: AvailabilitySlotUpdate = {
      status: 'BOOKED',
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .update(updates)
      .eq('id', slotId)
      .eq('status', 'AVAILABLE') // Only book if available
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Slot não está mais disponível para agendamento');
      }
      throw new Error(`Erro ao reservar slot: ${error.message}`);
    }

    return data;
  },

  // Release a slot (mark as available)
  async releaseSlot(slotId: string) {
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .update({
        status: 'AVAILABLE',
        updatedAt: new Date().toISOString()
      })
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao liberar slot: ${error.message}`);
    }

    return data;
  },

  // Delete availability slot
  async delete(slotId: string) {
    const { error } = await supabase
      .from('AvailabilitySlot')
      .delete()
      .eq('id', slotId);

    if (error) {
      throw new Error(`Erro ao deletar slot de disponibilidade: ${error.message}`);
    }

    return true;
  },

  // Generate slots based on agent schedule
  async generateSlotsFromSchedule(agentId: string, date: string, duration: number = 60) {
    // Get agent schedule first
    const schedule = await agentScheduleService.getByAgentId(agentId);
    
    if (!schedule) {
      throw new Error('Agenda do corretor não encontrada');
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = schedule.workingHours as any;
    const daySchedule = workingHours[dayOfWeek];

    if (!daySchedule || !daySchedule.available) {
      return []; // No working hours for this day
    }

    const slots: AvailabilitySlotInsert[] = [];
    const startTime = daySchedule.start;
    const endTime = daySchedule.end;
    const breaks = daySchedule.breaks || [];

    // Generate time slots
    let currentTime = startTime;
    while (currentTime < endTime) {
      const slotEndTime = this.addMinutes(currentTime, duration);
      
      if (slotEndTime > endTime) break;

      // Check if slot conflicts with breaks
      const conflictsWithBreak = breaks.some((breakTime: any) => 
        (currentTime >= breakTime.start && currentTime < breakTime.end) ||
        (slotEndTime > breakTime.start && slotEndTime <= breakTime.end)
      );

      if (!conflictsWithBreak) {
        slots.push({
          agentId,
          date,
          startTime: currentTime,
          endTime: slotEndTime,
          duration,
          status: 'AVAILABLE',
          slotType: 'REGULAR',
          source: 'auto_generated'
        });
      }

      currentTime = this.addMinutes(currentTime, duration + (schedule.bufferTime || 0));
    }

    return slots;
  },

  // Helper function to add minutes to time string
  addMinutes(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
};

// ===== AGENDA UTILITIES =====

export const agendaUtils = {
  // Validate working hours JSON structure
  validateWorkingHours(workingHours: any): boolean {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      if (workingHours[day]) {
        const daySchedule = workingHours[day];
        
        if (typeof daySchedule.available !== 'boolean') return false;
        
        if (daySchedule.available) {
          if (!daySchedule.start || !daySchedule.end) return false;
          
          // Validate time format (HH:mm)
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(daySchedule.start) || !timeRegex.test(daySchedule.end)) {
            return false;
          }
        }
      }
    }
    
    return true;
  },

  // Check if agent is available at specific time
  isAgentAvailable(schedule: AgentSchedule, date: string, time: string): boolean {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = schedule.workingHours as any;
    const daySchedule = workingHours[dayOfWeek];

    if (!daySchedule || !daySchedule.available) {
      return false;
    }

    return time >= daySchedule.start && time <= daySchedule.end;
  },

  // Format time for display
  formatTime(timeStr: string): string {
    return timeStr; // Can be enhanced for different formats
  },

  // Get next available slot for agent
  async getNextAvailableSlot(agentId: string): Promise<AvailabilitySlot | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('AvailabilitySlot')
      .select('*')
      .eq('agentId', agentId)
      .eq('status', 'AVAILABLE')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('startTime', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar próximo slot disponível:', error);
    }

    return data;
  }
};