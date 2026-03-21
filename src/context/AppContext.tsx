import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppContextType, Coffee, Movement, StockAlert, Roast } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AppProviderProps {
  children: React.ReactNode;
}

type AppAction =
  | { type: 'SET_DATA'; payload: { coffees: Coffee[]; movements: Movement[]; lastUpdate: Date; lastUpdatedBy: string } }
  | { type: 'TOGGLE_THEME' }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState & { theme: 'light' | 'dark' } = {
  coffees: [],
  movements: [],
  alerts: [],
  lastUpdate: new Date(),
  lastUpdatedBy: 'Sistema',
  currentUser: null,
  theme: 'light',
  loading: true,
};

const AppContext = createContext<(AppContextType & { toggleTheme: () => void }) | undefined>(undefined);

function calculateAlerts(coffees: Coffee[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  coffees.forEach(coffee => {
    const totalQuantity = coffee.roasts.reduce((sum, roast) => sum + roast.quantity, 0);
    const threshold = coffee.minStockThreshold || 500;

    if (totalQuantity < threshold) {
      alerts.push({
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        currentQuantity: totalQuantity,
        threshold: threshold,
      });
    }
  });

  return alerts;
}

function appReducer(state: AppState & { theme: 'light' | 'dark' }, action: AppAction): AppState & { theme: 'light' | 'dark' } {
  switch (action.type) {
    case 'SET_DATA': {
      const { coffees, movements, lastUpdate, lastUpdatedBy } = action.payload;
      return {
        ...state,
        coffees,
        movements,
        alerts: calculateAlerts(coffees),
        lastUpdate,
        lastUpdatedBy,
      };
    }

    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };

    case 'LOGIN':
      return {
        ...state,
        currentUser: { name: action.payload },
      };

    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { showToast } = useToast();

  // Carregar Tema
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' && state.theme === 'light') {
      dispatch({ type: 'TOGGLE_THEME' });
    }
  }, []);

  // Aplicar Tema
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [state.theme]);

  // Função para buscar dados do Supabase
  const fetchData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Buscar Cafés e Torras
      const { data: coffeesData, error: coffeesError } = await supabase
        .from('coffees')
        .select('*, roasts(*)');

      if (coffeesError) throw coffeesError;

      // Buscar Movimentações
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .order('timestamp', { ascending: false });

      if (movementsError) throw movementsError;

      // Formatar dados para o formato do AppState
      const formattedCoffees: Coffee[] = (coffeesData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        observations: c.observations,
        roasts: (c.roasts || []).map((r: any) => ({
          id: r.id,
          date: r.date,
          pr: r.pr,
          quantity: r.quantity,
          observations: r.observations,
        })),
      }));

      const formattedMovements: Movement[] = (movementsData || []).map((m: any) => ({
        id: m.id,
        timestamp: m.timestamp,
        type: m.type as 'entrada' | 'saida',
        coffeeId: m.coffee_id,
        coffeeName: formattedCoffees.find(c => c.id === m.coffee_id)?.name || 'Desconhecido',
        pr: m.pr,
        quantity: m.quantity,
        observations: m.observations,
        responsible: m.responsible || '',
      }));

      let lastUpdateDate = new Date();
      let lastResponsible = 'Sistema';

      if (formattedMovements.length > 0) {
        // Como já ordenamos por timestamp DESC no select, o primeiro é o mais recente
        const lastMove = formattedMovements[0];
        const parsedDate = new Date(lastMove.timestamp);

        if (!isNaN(parsedDate.getTime())) {
          lastUpdateDate = parsedDate;
          lastResponsible = lastMove.responsible || 'Sistema';
        }
      }

      dispatch({
        type: 'SET_DATA',
        payload: {
          coffees: formattedCoffees,
          movements: formattedMovements,
          lastUpdate: lastUpdateDate,
          lastUpdatedBy: lastResponsible
        }
      });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showToast('Erro ao carregar dados do servidor', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [showToast]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actions = {
    addMovement: async (movement: Omit<Movement, 'id' | 'timestamp'> & { timestamp?: string }) => {
      try {
        // 1. Validar PR único por café (apenas para entradas)
        if (movement.type === 'entrada') {
          const { data: existingRoasts } = await supabase
            .from('roasts')
            .select('id, coffee_id, pr')
            .eq('pr', movement.pr);

          if (existingRoasts && existingRoasts.length > 0) {
            const isDuplicate = existingRoasts.some((roast: any) => roast.coffee_id !== movement.coffeeId);
            if (isDuplicate) {
              showToast(`O PR ${movement.pr} já está cadastrado para outro café`, 'error');
              return;
            }
          }
        }

        // 2. Criar Movimentação
        const { error: moveError } = await supabase
          .from('movements')
          .insert([{
            type: movement.type,
            coffee_id: movement.coffeeId,
            pr: movement.pr,
            quantity: movement.quantity,
            observations: movement.observations,
            responsible: movement.responsible,
            timestamp: movement.timestamp || new Date().toISOString() // Supabase aceita ISO
          }]);

        if (moveError) throw moveError;

        // 3. Atualizar Estoque (Roast)
        // Primeiro, buscar o roast atual
        const { data: roasts } = await supabase
          .from('roasts')
          .select('*')
          .eq('pr', movement.pr)
          .eq('coffee_id', movement.coffeeId)
          .single();

        let newQuantity = 0;

        if (movement.type === 'entrada') {
          if (roasts) {
            newQuantity = roasts.quantity + movement.quantity;
            await supabase
              .from('roasts')
              .update({ quantity: newQuantity })
              .eq('id', roasts.id);
          } else {
            // Novo Roast (Lote)
            await supabase
              .from('roasts')
              .insert([{
                coffee_id: movement.coffeeId,
                pr: movement.pr,
                date: new Date().toLocaleDateString('pt-BR'), // Data de hoje como padrão para novo lote via entrada
                quantity: movement.quantity,
                observations: movement.observations
              }]);
          }
        } else {
          // Saída
          if (roasts) {
            newQuantity = Math.max(0, roasts.quantity - movement.quantity);
            await supabase
              .from('roasts')
              .update({ quantity: newQuantity })
              .eq('id', roasts.id);
          }
        }

        showToast('Movimentação registrada com sucesso', 'success');
        fetchData(); // Recarrega tudo para garantir consistência

      } catch (error) {
        console.error('Erro ao adicionar movimentação:', error);
        showToast('Erro ao salvar movimentação', 'error');
      }
    },

    updateMovement: async (movementId: string, movement: Omit<Movement, 'id' | 'timestamp'> & { timestamp?: string }) => {
      try {
        // 1. Reverter a movimentação antiga
        const { data: oldMove } = await supabase
          .from('movements')
          .select('*')
          .eq('id', movementId)
          .single();

        if (!oldMove) throw new Error('Movimentação não encontrada');

        const { data: oldRoast } = await supabase
          .from('roasts')
          .select('*')
          .eq('pr', oldMove.pr)
          .eq('coffee_id', oldMove.coffee_id)
          .single();

        if (oldRoast) {
          let revertedQuantity = oldRoast.quantity;
          if (oldMove.type === 'entrada') {
            revertedQuantity -= oldMove.quantity;
          } else {
            revertedQuantity += oldMove.quantity;
          }

          await supabase
            .from('roasts')
            .update({ quantity: Math.max(0, revertedQuantity) })
            .eq('id', oldRoast.id);
        }

        // 2. Atualizar a movimentação
        const { error: updateError } = await supabase
          .from('movements')
          .update({
            type: movement.type,
            coffee_id: movement.coffeeId,
            pr: movement.pr,
            quantity: movement.quantity,
            observations: movement.observations,
            responsible: movement.responsible,
            ...(movement.timestamp && { timestamp: movement.timestamp })
          })
          .eq('id', movementId);

        if (updateError) throw updateError;

        // 3. Aplicar a nova movimentação ao estoque
        const { data: roasts } = await supabase
          .from('roasts')
          .select('*')
          .eq('pr', movement.pr)
          .eq('coffee_id', movement.coffeeId)
          .single();

        let newQuantity = 0;

        // Se o roast mudou (por causa de edição de PR ou Café), precisamos buscar o novo
        // Se for o mesmo roast, usamos o valor já revertido (mas precisamos buscar novamente para garantir)
        const { data: currentRoast } = await supabase
          .from('roasts')
          .select('*')
          .eq('pr', movement.pr)
          .eq('coffee_id', movement.coffeeId)
          .single();

        if (movement.type === 'entrada') {
          if (currentRoast) {
            newQuantity = currentRoast.quantity + movement.quantity;
            // Atualizar também a observação do Roast se for entrada
            await supabase
              .from('roasts')
              .update({
                quantity: newQuantity,
                observations: movement.observations // Sincroniza observação
              })
              .eq('id', currentRoast.id);
          } else {
            // Novo Roast se não existir
            await supabase
              .from('roasts')
              .insert([{
                coffee_id: movement.coffeeId,
                pr: movement.pr,
                date: new Date().toLocaleDateString('pt-BR'),
                quantity: movement.quantity,
                observations: movement.observations
              }]);
          }
        } else {
          // Saída
          if (currentRoast) {
            newQuantity = Math.max(0, currentRoast.quantity - movement.quantity);
            await supabase
              .from('roasts')
              .update({ quantity: newQuantity })
              .eq('id', currentRoast.id);
          }
        }

        showToast('Movimentação atualizada com sucesso', 'success');
        fetchData();

      } catch (error) {
        console.error('Erro ao atualizar movimentação:', error);
        showToast('Erro ao atualizar movimentação', 'error');
      }
    },

    deleteMovement: async (movementId: string) => {
      try {
        // Precisaríamos reverter o estoque antes de deletar.
        // 1. Buscar movimento para saber quantidade
        const { data: moveData } = await supabase
          .from('movements')
          .select('*')
          .eq('id', movementId)
          .single();

        if (!moveData) return;

        // 2. Reverter estoque
        const { data: roast } = await supabase
          .from('roasts')
          .select('*')
          .eq('pr', moveData.pr)
          .eq('coffee_id', moveData.coffee_id)
          .single();

        if (roast) {
          let revertedQuantity = roast.quantity;
          if (moveData.type === 'entrada') {
            revertedQuantity -= moveData.quantity;
          } else {
            revertedQuantity += moveData.quantity;
          }

          await supabase
            .from('roasts')
            .update({ quantity: Math.max(0, revertedQuantity) })
            .eq('id', roast.id);
        }

        // 3. Deletar movimento
        await supabase.from('movements').delete().eq('id', movementId);

        showToast('Movimentação excluída', 'success');
        fetchData();
      } catch (error) {
        console.error('Erro ao deletar:', error);
        showToast('Erro ao deletar movimentação', 'error');
      }
    },

    addCoffee: async (coffee: Omit<Coffee, 'id' | 'roasts'>) => {
      try {
        const { error } = await supabase
          .from('coffees')
          .insert([{ name: coffee.name, observations: coffee.observations }]);

        if (error) throw error;

        showToast('Café cadastrado com sucesso', 'success');
        fetchData();
      } catch (error) {
        console.error('Erro ao adicionar café:', error);
        showToast('Erro ao cadastrar café', 'error');
      }
    },

    updateCoffee: async (coffeeId: string, updates: Partial<Coffee>) => {
      try {
        const { error } = await supabase
          .from('coffees')
          .update({ name: updates.name, observations: updates.observations })
          .eq('id', coffeeId);

        if (error) throw error;

        showToast('Café atualizado', 'success');
        fetchData();
      } catch (error) {
        console.error('Erro ao atualizar café:', error);
        showToast('Erro ao atualizar café', 'error');
      }
    },

    deleteCoffee: async (coffeeId: string) => {
      try {
        const { error } = await supabase
          .from('coffees')
          .delete()
          .eq('id', coffeeId);

        if (error) throw error;

        showToast('Café excluído', 'success');
        fetchData();
      } catch (error) {
        console.error('Erro ao deletar café:', error);
        showToast('Erro ao excluir café', 'error');
      }
    },

    deleteCoffees: async (coffeeIds: string[]) => {
      try {
        const { error } = await supabase
          .from('coffees')
          .delete()
          .in('id', coffeeIds);

        if (error) throw error;

        showToast(`${coffeeIds.length} cafés excluídos`, 'success');
        fetchData();
      } catch (error) {
        console.error('Erro ao deletar cafés:', error);
        showToast('Erro ao excluir cafés', 'error');
      }
    },

    addMultipleMovements: async (movements: Array<Omit<Movement, 'id'>>) => {
      try {
        if (!movements || movements.length === 0) {
          showToast('Nenhuma movimentação para processar', 'error');
          return;
        }

        // Validação de PRs duplicados entre cafés diferentes (apenas entradas)
        const entradas = movements.filter(m => m.type === 'entrada');
        for (const movement of entradas) {
          const { data: existingRoasts } = await supabase
            .from('roasts')
            .select('id, coffee_id, pr')
            .eq('pr', movement.pr);

          if (existingRoasts && existingRoasts.length > 0) {
            // Verificar se o PR pertence a OUTRO café (não o atual)
            const belongsToOtherCoffee = existingRoasts.some(
              (roast: any) => roast.coffee_id !== movement.coffeeId
            );

            if (belongsToOtherCoffee) {
              showToast(`O PR ${movement.pr} já está cadastrado para outro café`, 'error');
              return;
            }
            // Se pertence ao MESMO café, OK! Pode adicionar mais quantidade
          }
        }

        // Processar cada movimentação
        for (const movement of movements) {
          // Criar Movimentação no banco
          const { error: moveError } = await supabase
            .from('movements')
            .insert([{
              type: movement.type,
              coffee_id: movement.coffeeId,
              pr: movement.pr,
              quantity: movement.quantity,
              observations: movement.observations,
              responsible: movement.responsible,
              timestamp: movement.timestamp
            }]);

          if (moveError) throw moveError;

          // Atualizar Estoque (Roast)
          const { data: roasts } = await supabase
            .from('roasts')
            .select('*')
            .eq('pr', movement.pr)
            .eq('coffee_id', movement.coffeeId)
            .single();

          if (movement.type === 'entrada') {
            if (roasts) {
              // Atualizar roast existente
              const newQuantity = roasts.quantity + movement.quantity;
              await supabase
                .from('roasts')
                .update({ quantity: newQuantity })
                .eq('id', roasts.id);
            } else {
              // Criar novo roast
              // Extrair data do timestamp
              const date = movement.timestamp ? movement.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
              await supabase
                .from('roasts')
                .insert([{
                  coffee_id: movement.coffeeId,
                  pr: movement.pr,
                  date: date,
                  quantity: movement.quantity,
                  observations: movement.observations
                }]);
            }
          } else {
            // Saída
            if (roasts) {
              const newQuantity = Math.max(0, roasts.quantity - movement.quantity);
              await supabase
                .from('roasts')
                .update({ quantity: newQuantity })
                .eq('id', roasts.id);
            } else {
              throw new Error(`PR ${movement.pr} não encontrado para saída`);
            }
          }
        }

        showToast(`${movements.length} movimentação(ões) registrada(s) com sucesso`, 'success');
        fetchData(); // Recarregar dados

      } catch (error) {
        console.error('Erro ao adicionar movimentações:', error);
        showToast('Erro ao salvar movimentações', 'error');
        throw error; // Re-throw para o MovementForm tratar
      }
    },

    refreshData: () => {
      fetchData();
      showToast('Dados atualizados', 'info');
    },

    updateRoastObservation: async (roastId: string, observation: string) => {
      try {
        const { error } = await supabase
          .from('roasts')
          .update({ observations: observation })
          .eq('id', roastId);

        if (error) throw error;

        showToast('Observação atualizada com sucesso', 'success');
        fetchData();
      } catch (error) {
        console.error('Erro ao atualizar observação:', error);
        showToast('Erro ao atualizar observação', 'error');
      }
    },

    login: (name: string) => {
      // Login simples local por enquanto
      dispatch({ type: 'LOGIN', payload: name });
    },

    logout: () => {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  return (
    <AppContext.Provider value={{ state, actions, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}
