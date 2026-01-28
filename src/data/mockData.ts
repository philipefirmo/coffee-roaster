import { Coffee, Movement } from '../types';

export const mockCoffees: Coffee[] = [
  {
    id: '1',
    name: 'JOSANE',
    roasts: [{ id: '1', date: '19/01/26', pr: '9140', quantity: 1500 }],
    observations: ''
  },
  {
    id: '2',
    name: 'RAYRA',
    roasts: [{ id: '2', date: '19/01/26', pr: '9146', quantity: 197 }],
    observations: ''
  },
  {
    id: '3',
    name: 'MANGABEIRA',
    roasts: [{ id: '3', date: '26/01/26', pr: '9193', quantity: 1750 }],
    observations: ''
  },
  {
    id: '4',
    name: 'GESHA SIDNEY',
    roasts: [{ id: '4', date: '26/01/26', pr: '9188', quantity: 2672 }],
    observations: ''
  },
  {
    id: '5',
    name: 'PACAMARA',
    roasts: [{ id: '5', date: '26/01/26', pr: '9187', quantity: 1700 }],
    observations: ''
  },
  {
    id: '6',
    name: 'SAMUEL',
    roasts: [
      { id: '6', date: '19/01/26', pr: '9141', quantity: 370 },
      { id: '7', date: '19/01/26', pr: '9147', quantity: 1000 },
      { id: '8', date: '26/01/26', pr: '9194', quantity: 2300 }
    ],
    observations: ''
  },
  {
    id: '7',
    name: 'GABRIEL',
    roasts: [{ id: '9', date: '22/01/26', pr: '9166', quantity: 540 }],
    observations: ''
  },
  {
    id: '8',
    name: 'RENATO',
    roasts: [{ id: '10', date: '22/01/26', pr: '9167', quantity: 1900 }],
    observations: ''
  },
  {
    id: '9',
    name: 'ROMILDO',
    roasts: [{ id: '11', date: '26/01/26', pr: '9190', quantity: 967 }],
    observations: ''
  },
  {
    id: '10',
    name: 'SIVANIUS',
    roasts: [{ id: '12', date: '19/01/26', pr: '9171', quantity: 2540 }],
    observations: ''
  },
  {
    id: '11',
    name: 'VAVÁ',
    roasts: [{ id: '13', date: '22/01/26', pr: '9170', quantity: 1280 }],
    observations: ''
  },
  {
    id: '12',
    name: 'MOKINHA',
    roasts: [
      { id: '14', date: '26/01/26', pr: '9201', quantity: 5200 },
      { id: '15', date: '26/01/26', pr: '9198', quantity: 3700 }
    ],
    observations: ''
  },
  {
    id: '13',
    name: 'BLEND DA CASA',
    roasts: [],
    observations: 'Sem estoque no momento'
  }
];

export const mockMovements: Movement[] = [];
