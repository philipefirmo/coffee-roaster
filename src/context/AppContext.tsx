import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AppContextType, Coffee, Movement, StockAlert } from '../types';
import { mockCoffees, mockMovements } from '../data/mockData';

interface AppProviderProps {
  children: React.ReactNode;
}

type AppAction =
  | { type: 'ADD_MOVEMENT'; payload: Omit<Movement, 'id' | 'timestamp'> }
  | { type: 'UPDATE_MOVEMENT'; payload: { movementId: string; movement: Omit<Movement, 'id' | 'timestamp'> } }
  | { type: 'DELETE_MOVEMENT'; payload: string }
  | { type: 'ADD_COFFEE'; payload: Omit<Coffee, 'id' | 'roasts'> }
  | { type: 'UPDATE_COFFEE'; payload: { coffeeId: string; updates: Partial<Coffee> } }
  | { type: 'DELETE_COFFEE'; payload: string }
  | { type: 'REFRESH_DATA' }
  | { type: 'LOAD_FROM_STORAGE'; payload: AppState }
  | { type: 'TOGGLE_THEME' }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  coffees: mockCoffees,
  movements: mockMovements,
  alerts: [],
  lastUpdate: new Date(),
  lastUpdatedBy: 'Sistema',
  currentUser: null,
  theme: 'light',
};

const AppContext = createContext<(AppContextType & { toggleTheme: () => void }) | undefined>(undefined);

function calculateAlerts(coffees: Coffee[]): StockAlert[] {
  const alerts: StockAlert[] = [];
  
  coffees.forEach(coffee => {
    const totalQuantity = coffee.roasts.reduce((sum, roast) => sum + roast.quantity, 0);
    if (totalQuantity < 500) {
      alerts.push({
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        currentQuantity: totalQuantity,
        threshold: 500,
      });
    }
  });
  
  return alerts;
}

// Helper to update stock based on a movement
function updateStock(coffees: Coffee[], movement: Movement, revert: boolean = false): Coffee[] {
  return coffees.map(coffee => {
    if (coffee.id === movement.coffeeId) {
      const updatedRoasts = coffee.roasts.map(roast => {
        if (roast.pr === movement.pr) {
          let newQuantity = roast.quantity;
          const quantityChange = movement.quantity;

          if (revert) {
            // Revert operation: undo the effect of the movement
            if (movement.type === 'entrada') {
              newQuantity -= quantityChange; // Undo entry: subtract
            } else {
              newQuantity += quantityChange; // Undo exit: add
            }
          } else {
            // Apply operation
            if (movement.type === 'entrada') {
              newQuantity += quantityChange;
            } else {
              newQuantity -= quantityChange;
            }
          }
          
          return { ...roast, quantity: Math.max(0, newQuantity) };
        }
        return roast;
      });

      // Handle new roasts for entry (only if applying, not reverting)
      if (!revert && movement.type === 'entrada') {
        const existingRoast = updatedRoasts.find(r => r.pr === movement.pr);
        if (!existingRoast) {
          updatedRoasts.push({
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('pt-BR'),
            pr: movement.pr,
            quantity: movement.quantity,
            observations: movement.observations
          });
        }
      }
      
      return { ...coffee, roasts: updatedRoasts };
    }
    return coffee;
  });
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_MOVEMENT': {
      const quantityNum = Number(action.payload.quantity);
      const newMovement: Movement = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        quantity: quantityNum,
      };

      const updatedCoffees = updateStock(state.coffees, newMovement);

      const newState = {
        ...state,
        coffees: updatedCoffees,
        movements: [newMovement, ...state.movements],
        lastUpdate: new Date(),
        lastUpdatedBy: action.payload.responsible,
      };

      newState.alerts = calculateAlerts(updatedCoffees);
      return newState;
    }

    case 'UPDATE_MOVEMENT': {
      const { movementId, movement } = action.payload;
      const quantityNum = Number(movement.quantity);
      
      // Find the old movement
      const oldMovement = state.movements.find(m => m.id === movementId);
      if (!oldMovement) return state;

      // 1. Revert the old movement's effect on stock
      let updatedCoffees = updateStock(state.coffees, oldMovement, true);

      // 2. Apply the new movement's effect on stock
      const newMovementFull: Movement = {
        ...movement,
        id: oldMovement.id,
        timestamp: oldMovement.timestamp, // Keep original timestamp
        quantity: quantityNum,
      };

      updatedCoffees = updateStock(updatedCoffees, newMovementFull, false);

      const updatedMovements = state.movements.map(m => 
        m.id === movementId ? newMovementFull : m
      );

      return {
        ...state,
        coffees: updatedCoffees,
        movements: updatedMovements,
        alerts: calculateAlerts(updatedCoffees),
        lastUpdate: new Date(),
        lastUpdatedBy: movement.responsible,
      };
    }

    case 'DELETE_MOVEMENT': {
      const movementId = action.payload;
      const oldMovement = state.movements.find(m => m.id === movementId);
      if (!oldMovement) return state;

      // Revert the movement's effect
      const updatedCoffees = updateStock(state.coffees, oldMovement, true);
      
      const updatedMovements = state.movements.filter(m => m.id !== movementId);

      return {
        ...state,
        coffees: updatedCoffees,
        movements: updatedMovements,
        alerts: calculateAlerts(updatedCoffees),
        lastUpdate: new Date(),
      };
    }

    case 'ADD_COFFEE': {
      const newCoffee: Coffee = {
        ...action.payload,
        id: Date.now().toString(),
        roasts: [],
      };
      return {
        ...state,
        coffees: [...state.coffees, newCoffee],
        lastUpdate: new Date(),
      };
    }

    case 'UPDATE_COFFEE': {
      const updatedCoffees = state.coffees.map(coffee =>
        coffee.id === action.payload.coffeeId
          ? { ...coffee, ...action.payload.updates }
          : coffee
      );

      return {
        ...state,
        coffees: updatedCoffees,
        alerts: calculateAlerts(updatedCoffees),
        lastUpdate: new Date(),
      };
    }

    case 'DELETE_COFFEE': {
      const updatedCoffees = state.coffees.filter(c => c.id !== action.payload);
      return {
        ...state,
        coffees: updatedCoffees,
        alerts: calculateAlerts(updatedCoffees),
        lastUpdate: new Date(),
      };
    }

    case 'REFRESH_DATA':
      return {
        ...state,
        lastUpdate: new Date(),
      };

    case 'LOAD_FROM_STORAGE':
      return { ...state, ...action.payload };

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

    default:
      return state;
  }
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Aplicar tema no HTML
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    // Check if we need to seed initial data (v2 check)
    const hasSeeded = localStorage.getItem('coffeeStockData_v2_seeded');
    const storedData = localStorage.getItem('coffeeStockData_v2');

    if (!hasSeeded) {
      // First time with new data structure: ignore old data, use initialState (mockData)
      localStorage.setItem('coffeeStockData_v2', JSON.stringify(initialState));
      localStorage.setItem('coffeeStockData_v2_seeded', 'true');
      // No need to dispatch LOAD, initialState is already set
    } else if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Converter lastUpdate de volta para Date
        if (parsedData.lastUpdate) {
          parsedData.lastUpdate = new Date(parsedData.lastUpdate);
        }
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedData });
      } catch (error) {
        console.error('Erro ao carregar dados do localStorage:', error);
      }
    }
  }, []);

  // Salvar dados no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('coffeeStockData_v2', JSON.stringify(state));
  }, [state]);

  const actions = {
    addMovement: (movement: Omit<Movement, 'id' | 'timestamp'>) => {
      dispatch({ type: 'ADD_MOVEMENT', payload: movement });
    },
    updateMovement: (movementId: string, movement: Omit<Movement, 'id' | 'timestamp'>) => {
      dispatch({ type: 'UPDATE_MOVEMENT', payload: { movementId, movement } });
    },
    deleteMovement: (movementId: string) => {
      dispatch({ type: 'DELETE_MOVEMENT', payload: movementId });
    },
    addCoffee: (coffee: Omit<Coffee, 'id' | 'roasts'>) => {
      dispatch({ type: 'ADD_COFFEE', payload: coffee });
    },
    updateCoffee: (coffeeId: string, updates: Partial<Coffee>) => {
      dispatch({ type: 'UPDATE_COFFEE', payload: { coffeeId, updates } });
    },
    deleteCoffee: (coffeeId: string) => {
      dispatch({ type: 'DELETE_COFFEE', payload: coffeeId });
    },
    refreshData: () => {
      dispatch({ type: 'REFRESH_DATA' });
    },
    login: (name: string) => {
      dispatch({ type: 'LOGIN', payload: name });
    },
    logout: () => {
      dispatch({ type: 'LOGOUT' });
    },
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
