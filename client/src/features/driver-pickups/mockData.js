import { MAX_MY_PICKUPS, PICKUP_STATUSES, isActivePickupStatus } from './constants';

const seedUnassigned = [
  {
    id: 'PK-1004',
    customerName: 'John Doe',
    phone: '555-0101',
    address: '123 Main St',
    distance: '2.5 km',
    categoryName: 'E-Waste',
    estimatedQuantity: 2,
  },
  {
    id: 'PK-1005',
    customerName: 'Sarah Chen',
    phone: '555-0142',
    address: '88 River Rd',
    distance: '3.1 km',
    categoryName: 'Batteries',
    estimatedQuantity: 5,
  },
  {
    id: 'PK-1006',
    customerName: 'Mike Torres',
    phone: '555-0199',
    address: '12 Oak Lane',
    distance: '4.8 km',
    categoryName: 'E-Waste',
    estimatedQuantity: 1,
  },
];

const seedAssigned = [
  {
    id: 'PK-1001',
    customerName: 'Jane Smith',
    phone: '555-0110',
    address: '456 Oak Ave',
    distance: '5.2 km',
    categoryName: 'E-Waste',
    estimatedQuantity: 3,
    status: 'COLLECTING',
    driverId: 'DRV-DEMO',
  },
  {
    id: 'PK-1002',
    customerName: 'Bob Wilson',
    phone: '555-0120',
    address: '789 Pine Rd',
    distance: '8.1 km',
    categoryName: 'Appliances',
    estimatedQuantity: 1,
    status: 'COLLECTED',
    actualQuantity: 1,
    note: 'Collected as estimated',
    driverId: 'DRV-DEMO',
    completedAt: '2026-08-04T08:30:00.000Z',
  },
  {
    id: 'PK-1003',
    customerName: 'Amy Nguyen',
    phone: '555-0130',
    address: '22 Lake View',
    distance: '1.4 km',
    categoryName: 'E-Waste',
    estimatedQuantity: 4,
    status: 'ASSIGNED',
    driverId: 'DRV-DEMO',
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let unassigned = clone(seedUnassigned);
let assigned = clone(seedAssigned);
let demoMode = false;

export function isDemoMode() {
  return demoMode;
}

export function setDemoMode(value) {
  demoMode = value;
}

export function getMockUnassigned() {
  return clone(unassigned);
}

export function getMockAssigned() {
  return clone(assigned);
}

function getActiveCount() {
  return assigned.filter((pickup) => isActivePickupStatus(pickup.status)).length;
}

export function mockClaimPickup(id) {
  if (getActiveCount() >= MAX_MY_PICKUPS) {
    const error = new Error(`You can only hold up to ${MAX_MY_PICKUPS} active pickups.`);
    error.status = 400;
    throw error;
  }

  const index = unassigned.findIndex((pickup) => pickup.id === id);
  if (index === -1) {
    const alreadyAssigned = assigned.some((pickup) => pickup.id === id);
    if (alreadyAssigned) {
      const error = new Error('This order has already been claimed by another driver.');
      error.status = 409;
      throw error;
    }
    const error = new Error('Pickup not found');
    error.status = 404;
    throw error;
  }

  const [claimed] = unassigned.splice(index, 1);
  const assignedPickup = {
    ...claimed,
    status: PICKUP_STATUSES.ASSIGNED,
    driverId: 'DRV-DEMO',
  };
  assigned = [assignedPickup, ...assigned];

  return {
    success: true,
    message: 'Order claimed successfully',
    data: { id: assignedPickup.id, status: PICKUP_STATUSES.ASSIGNED, driverId: 'DRV-DEMO' },
  };
}

export function mockReleasePickup(id) {
  const index = assigned.findIndex((pickup) => pickup.id === id);
  if (index === -1) {
    const error = new Error('Pickup not found');
    error.status = 404;
    throw error;
  }

  const current = assigned[index];
  if (current.status !== PICKUP_STATUSES.ASSIGNED) {
    const error = new Error('Only ASSIGNED pickups can be returned to unassigned');
    error.status = 400;
    throw error;
  }

  assigned = [...assigned.slice(0, index), ...assigned.slice(index + 1)];
  const {
    status: _status,
    driverId: _driverId,
    actualQuantity: _actualQuantity,
    note: _note,
    imageUrl: _imageUrl,
    completedAt: _completedAt,
    ...rest
  } = current;

  unassigned = [{ ...rest }, ...unassigned];

  return {
    success: true,
    message: 'Pickup returned to unassigned',
    data: { id: current.id },
  };
}

export function mockUpdatePickupStatus(id, payload) {
  const index = assigned.findIndex((pickup) => pickup.id === id);
  if (index === -1) {
    const error = new Error('Pickup not found');
    error.status = 404;
    throw error;
  }

  const current = assigned[index];
  const nextStatus = payload.status;

  if (nextStatus === PICKUP_STATUSES.COLLECTED && !(Number(payload.actualQuantity) > 0)) {
    const error = new Error('Actual quantity is required to complete pickup');
    error.status = 400;
    throw error;
  }

  const updated = {
    ...current,
    status: nextStatus,
    ...(payload.actualQuantity != null ? { actualQuantity: Number(payload.actualQuantity) } : {}),
    ...(payload.note != null ? { note: payload.note } : {}),
    ...(payload.imageUrl != null ? { imageUrl: payload.imageUrl } : {}),
    ...(nextStatus === PICKUP_STATUSES.COLLECTED
      ? { completedAt: new Date().toISOString() }
      : {}),
  };

  assigned = [...assigned.slice(0, index), updated, ...assigned.slice(index + 1)];
  return { success: true, data: updated };
}
