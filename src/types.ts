/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EquipmentType = 
  | 'CCTV' 
  | 'NETWORK' 
  | 'FIRE' 
  | 'WIFI' 
  | 'SECURITY'
  | 'CCTV_DOME'
  | 'CCTV_BULLET'
  | 'WIFI_ROUTER'
  | 'FIRE_DETECTOR'
  | 'SWITCH_RACK'
  | 'SERVER_RACK'
  | 'ALARM_SIREN'
  | 'CONTROL_PANEL'
  | 'ACCESS_CONTROL'
  | 'INTERCOM'
  | 'UPS_BATTERY'
  | 'TV'
  | 'MONITOR'
  | 'TEXT'
  | 'RECTANGLE'
  | 'CIRCLE';

export interface Point {
  x: number;
  y: number;
}

export interface ConnectionPort {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  subType: string;
  x: number;
  y: number;
  rotation: number;
  properties: Record<string, any>;
  layerId: string;
}

export interface CustomCableType {
  id: string;
  name: string;
  color: string;
  thickness: number;
  costPerMeter: number;
}

export interface CustomEquipmentType {
  id: string;
  name: string;
  type: EquipmentType;
  subType: string;
  desc: string;
  price: number;
  iconKey: string;
}

export interface Cable {
  id: string;
  points: number[];
  type: string;
  color: string;
  layerId: string;
  tension?: number;
  strokeWidth?: number;
  dash?: number[];
  cableTypeId?: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: EquipmentType | 'ANNOTATION' | 'MEASURE' | 'PLAN';
  opacity: number;
}

export interface PlanImage {
  id: string;
  src: string; // The base64 or url of the image
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PlanSheet {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  pageNum?: number;
  canvasBg: string; // The base64 high-resolution rendered image data URL
  dimensions: { width: number; height: number };
  equipment: Equipment[];
  cables: Cable[];
  images?: PlanImage[];
  scaleRatio?: number; // Pixels per meter
}

export interface ProjectState {
  currentPage: number;
  zoom: number;
  layers: Layer[];
  equipment: Equipment[];
  cables: Cable[];
  selectedId: string | null;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'LATE';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: any;
  method: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId: string;
  amount: number;
  createdAt: any;
  dueDate: any;
  validationStatus: InvoiceStatus;
  paymentStatus: PaymentStatus;
  createdBy: string;
  validatedBy?: string;
  comments?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  date: any;
  targetId: string;
}

export interface ProjectDetails {
  id: string;
  clientId: string;
  name: string;
  revenue: number;
  materialCost: number;
  laborCost: number;
  createdAt: any;
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDay: number;
  duration: number;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

