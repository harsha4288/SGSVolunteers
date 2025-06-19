"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Package, Truck, AlertCircle } from "lucide-react";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  DataTableBadge,
} from "../../../../../../datatable_solutions/iteration_1/implementation/components/ui/data-table";

// Mock data types for t-shirt management
interface TshirtOrder {
  volunteer_id: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color?: string;
  design?: string;
  status: 'ordered' | 'received' | 'distributed' | 'pending';
  order_date?: string;
  distribution_date?: string;
  notes?: string;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TshirtSize {
  size: string;
  inventory_count: number;
  distributed_count: number;
}

interface UnifiedTshirtTableProps {
  volunteers: Volunteer[];
  tshirtOrders: TshirtOrder[];
  sizeInventory: TshirtSize[];
  onUpdateStatus?: (volunteerId: string, newStatus: TshirtOrder['status']) => void;
  onUpdateSize?: (volunteerId: string, newSize: TshirtOrder['size']) => void;
}

// Default props for demo purposes
const defaultVolunteers: Volunteer[] = [
  { id: '1', first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com' },
  { id: '2', first_name: 'Maria', last_name: 'Garcia-Rodriguez', email: 'maria.garcia.rodriguez@example.com' },
  { id: '3', first_name: 'Alexander', last_name: 'Constantinopolous', email: 'alex.constantinopolous@example.com' },
  { id: '4', first_name: 'Wei', last_name: 'Zhang', email: 'wei.zhang@example.com' },
  { id: '5', first_name: 'Sarah', last_name: 'Johnson-Williams', email: 'sarah.johnson.williams@example.com' },
  { id: '6', first_name: 'Christopher', last_name: 'Vandenberg-Patterson', email: 'chris.vandenberg.patterson@example.com' },
];

const defaultTshirtOrders: TshirtOrder[] = [
  { volunteer_id: '1', size: 'L', color: 'Navy', design: 'Event 2024', status: 'distributed', order_date: '2023-12-01', distribution_date: '2023-12-15' },
  { volunteer_id: '2', size: 'M', color: 'Navy', design: 'Event 2024', status: 'received', order_date: '2023-12-01' },
  { volunteer_id: '3', size: 'XL', color: 'Navy', design: 'Event 2024', status: 'ordered', order_date: '2023-12-05' },
  { volunteer_id: '4', size: 'S', color: 'Navy', design: 'Event 2024', status: 'distributed', order_date: '2023-11-28', distribution_date: '2023-12-15' },
  { volunteer_id: '5', size: 'M', color: 'Navy', design: 'Event 2024', status: 'pending' },
  { volunteer_id: '6', size: 'XXL', color: 'Navy', design: 'Event 2024', status: 'received', order_date: '2023-12-03' },
];

const defaultSizeInventory: TshirtSize[] = [
  { size: 'XS', inventory_count: 5, distributed_count: 0 },
  { size: 'S', inventory_count: 15, distributed_count: 8 },
  { size: 'M', inventory_count: 25, distributed_count: 18 },
  { size: 'L', inventory_count: 30, distributed_count: 22 },
  { size: 'XL', inventory_count: 20, distributed_count: 12 },
  { size: 'XXL', inventory_count: 8, distributed_count: 3 },
];

// Size ordering for consistent display
const sizeOrder: TshirtOrder['size'][] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function UnifiedTshirtTable({
  volunteers = defaultVolunteers,
  tshirtOrders = defaultTshirtOrders,
  sizeInventory = defaultSizeInventory,
  onUpdateStatus,
  onUpdateSize
}: UnifiedTshirtTableProps) {

  // Helper function to get order for a specific volunteer
  const getVolunteerOrder = (volunteerId: string): TshirtOrder | null => {
    return tshirtOrders.find(order => order.volunteer_id === volunteerId) || null;
  };

  // Helper function to get inventory for a specific size
  const getSizeInventory = (size: string): TshirtSize | null => {
    return sizeInventory.find(inv => inv.size === size) || null;
  };

  // Render status badge
  const renderStatusBadge = (order: TshirtOrder | null) => {
    if (!order) {
      return (
        <DataTableBadge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-gray-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          No Order
        </DataTableBadge>
      );
    }

    switch (order.status) {
      case 'distributed':
        return (
          <DataTableBadge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Distributed
          </DataTableBadge>
        );
      case 'received':
        return (
          <DataTableBadge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200">
            <Package className="h-3 w-3 mr-1" />
            Ready
          </DataTableBadge>
        );
      case 'ordered':
        return (
          <DataTableBadge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200">
            <Truck className="h-3 w-3 mr-1" />
            Ordered
          </DataTableBadge>
        );
      case 'pending':
        return (
          <DataTableBadge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </DataTableBadge>
        );
      default:
        return (
          <DataTableBadge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-gray-200">
            Unknown
          </DataTableBadge>
        );
    }
  };

  // Render size cell with inventory info
  const renderSizeCell = (order: TshirtOrder | null, size: TshirtOrder['size']) => {
    const inventory = getSizeInventory(size);
    const isOrdered = order?.size === size;
    const available = inventory ? inventory.inventory_count - inventory.distributed_count : 0;
    
    return (
      <div className="flex flex-col items-center gap-1">
        {isOrdered ? (
          <DataTableBadge variant="default" className="bg-primary text-primary-foreground">
            {size}
          </DataTableBadge>
        ) : (
          <DataTableBadge variant="outline" className="text-muted-foreground border-muted">
            {size}
          </DataTableBadge>
        )}
        <span className="text-xs text-muted-foreground">
          {available} left
        </span>
      </div>
    );
  };

  return (
    <DataTable
      maxHeight="calc(100vh - 300px)"
      frozenColumns={[0]}
      density="compact"
      useGridLayout={true}
      volunteerColumnGrid={{
        minWidth: '180px',
        maxFraction: '0.22fr'
      }}
    >
      <DataTableColGroup>
        <DataTableCol gridArea="volunteer" />
        <DataTableCol gridArea="status" />
        {sizeOrder.map((size) => (
          <DataTableCol key={size} gridArea={`size-${size}`} />
        ))}
        <DataTableCol gridArea="notes" />
      </DataTableColGroup>

      <DataTableHeader>
        <DataTableRow hover={false}>
          <DataTableHead align="left" className="px-3" colIndex={0} vAlign="middle">
            Volunteer
          </DataTableHead>
          <DataTableHead align="center" colIndex={1} vAlign="middle">
            Status
          </DataTableHead>
          {sizeOrder.map((size, index) => (
            <DataTableHead key={size} align="center" colIndex={index + 2} vAlign="middle" className="min-w-0">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{size}</span>
                <span className="text-xs text-muted-foreground">Size</span>
              </div>
            </DataTableHead>
          ))}
          <DataTableHead align="left" colIndex={sizeOrder.length + 2} vAlign="middle">
            Order Details
          </DataTableHead>
        </DataTableRow>
      </DataTableHeader>

      <DataTableBody>
        {volunteers.map((volunteer) => {
          const order = getVolunteerOrder(volunteer.id);
          return (
            <DataTableRow key={volunteer.id}>
              <DataTableCell
                className="font-medium px-3"
                colIndex={0}
                vAlign="middle"
              >
                <div className="flex flex-col">
                  <span className="text-sm">{volunteer.first_name} {volunteer.last_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {volunteer.email}
                  </span>
                </div>
              </DataTableCell>
              
              <DataTableCell
                align="center"
                colIndex={1}
                vAlign="middle"
              >
                {renderStatusBadge(order)}
              </DataTableCell>
              
              {sizeOrder.map((size, index) => (
                <DataTableCell
                  key={size}
                  align="center"
                  colIndex={index + 2}
                  vAlign="middle"
                >
                  {renderSizeCell(order, size)}
                </DataTableCell>
              ))}
              
              <DataTableCell
                align="left"
                colIndex={sizeOrder.length + 2}
                vAlign="middle"
              >
                <div className="flex flex-col gap-1">
                  {order?.color && (
                    <span className="text-xs">
                      <strong>Color:</strong> {order.color}
                    </span>
                  )}
                  {order?.design && (
                    <span className="text-xs">
                      <strong>Design:</strong> {order.design}
                    </span>
                  )}
                  {order?.order_date && (
                    <span className="text-xs text-muted-foreground">
                      Ordered: {new Date(order.order_date).toLocaleDateString()}
                    </span>
                  )}
                  {order?.distribution_date && (
                    <span className="text-xs text-muted-foreground">
                      Distributed: {new Date(order.distribution_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </DataTableCell>
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}