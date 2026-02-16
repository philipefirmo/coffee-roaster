export interface Coffee {
  id: string;
  name: string;
  roasts: Roast[];
  observations?: string;
}

export interface Roast {
  id: string;
  date: string;
  pr: string;
  quantity: number; // in grams
  observations?: string;
}

export interface Movement {
  id: string;
  timestamp: string;
  type: 'entrada' | 'saida';
  coffeeId: string;
  coffeeName: string;
  pr: string;
  quantity: number;
  observations?: string;
  responsible: string;
  batch_id?: string; // Para agrupar movimentações múltiplas
}

export interface StockAlert {
  coffeeId: string;
  coffeeName: string;
  currentQuantity: number;
  threshold: number;
}

export interface User {
  name: string;
}

export interface AppState {
  coffees: Coffee[];
  movements: Movement[];
  alerts: StockAlert[];
  lastUpdate: Date;
  lastUpdatedBy?: string;
  currentUser: User | null;
  theme: 'light' | 'dark';
  loading: boolean;
}

export interface MultipleMovementEntry {
  coffeeId: string;
  coffeeName: string;
  pr: string;
  date: string;
  quantity: number;
  observations?: string;
}

export interface AppContextType {
  state: AppState;
  actions: {
    addMovement: (movement: Omit<Movement, 'id' | 'timestamp'> & { timestamp?: string }) => void;
    updateMovement: (movementId: string, movement: Omit<Movement, 'id' | 'timestamp'> & { timestamp?: string }) => void;
    deleteMovement: (movementId: string) => void;
    addCoffee: (coffee: Omit<Coffee, 'id' | 'roasts'>) => void;
    updateCoffee: (coffeeId: string, updates: Partial<Coffee>) => void;
    deleteCoffee: (coffeeId: string) => void;
    addMultipleMovements: (movements: Array<Omit<Movement, 'id'>>) => Promise<void>;
    refreshData: () => void;
    login: (name: string) => void;
    logout: () => void;
  };
}
