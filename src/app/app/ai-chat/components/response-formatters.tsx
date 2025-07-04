import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadgeCell } from '@/components/ui/data-table/cells/StatusBadgeCell';
// import { StatsCards } from '@/app/app/dashboard/components/shared/stats-cards';
import { getTaskIconConfig } from '@/lib/task-icons';
import { ColumnDef } from '@tanstack/react-table';
import { Shirt, Users, Clock, AlertCircle, LucideIcon } from 'lucide-react';

// Simple StatCard component for AI chat responses
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: LucideIcon;
}> = ({ title, value, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// Simple StatsCards component for AI chat responses
const StatsCards: React.FC<{
  stats: Array<{ title: string; value: number; icon: LucideIcon }>;
}> = ({ stats }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {stats.map((stat, index) => (
      <StatCard key={index} {...stat} />
    ))}
  </div>
);

// Types for structured API responses
export interface TShirtInventoryItem {
  size_cd: string;
  quantity_on_hand: number;
  sort_order?: number;
}

export interface VolunteerStatsItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  seva_category?: string;
  gm_family?: boolean;
  student_batch?: string;
}

export interface CheckInItem {
  id: string;
  volunteer_name: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'pending';
}

export interface SevaCategoryStats {
  category_name: string;
  volunteer_count: number;
  icon?: string;
  color?: string;
}

// T-Shirt Inventory Response Formatter
export const TShirtInventoryResponse: React.FC<{ 
  data: TShirtInventoryItem[];
  title?: string;
}> = ({ data, title = "T-Shirt Inventory" }) => {
  const columns: ColumnDef<TShirtInventoryItem>[] = [
    {
      accessorKey: 'size_cd',
      header: 'Size',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue('size_cd')}
        </Badge>
      ),
    },
    {
      accessorKey: 'quantity_on_hand',
      header: 'Quantity',
      cell: ({ row }) => {
        const quantity = row.getValue('quantity_on_hand') as number;
        return (
          <StatusBadgeCell
            value={quantity}
            type="inventory"
            percentage={Math.min(quantity / 50 * 100, 100)} // Assuming 50 is max stock
            showLabel={true}
          />
        );
      },
    },
  ];

  const totalStock = data.reduce((sum, item) => sum + item.quantity_on_hand, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStock}</div>
          <p className="text-xs text-muted-foreground">
            Total shirts across all sizes
          </p>
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns}
        data={data}
        density="compact"
        className="border rounded-lg"
      />
    </div>
  );
};

// Volunteer Statistics Response Formatter
export const VolunteerStatsResponse: React.FC<{
  data: VolunteerStatsItem[];
  stats?: { total: number; gmFamily: number; nonGmFamily: number };
  title?: string;
}> = ({ data, stats, title = "Volunteer Statistics" }) => {
  const columns: ColumnDef<VolunteerStatsItem>[] = [
    {
      accessorKey: 'first_name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'seva_category',
      header: 'Seva Category',
      cell: ({ row }) => {
        const seva = row.getValue('seva_category') as string;
        if (!seva) return <span className="text-muted-foreground">-</span>;
        
        const iconConfig = getTaskIconConfig(seva);
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            {iconConfig.icon && <iconConfig.icon className="h-3 w-3" />}
            {seva}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'gm_family',
      header: 'GM Family',
      cell: ({ row }) => {
        const isGmFamily = row.getValue('gm_family') as boolean;
        return (
          <Badge variant={isGmFamily ? "default" : "outline"}>
            {isGmFamily ? 'Yes' : 'No'}
          </Badge>
        );
      },
    },
  ];

  const statsData = stats ? [
    { title: 'Total Volunteers', value: stats.total, icon: Users },
    { title: 'GM Family', value: stats.gmFamily, icon: Users },
    { title: 'Non-GM Family', value: stats.nonGmFamily, icon: Users },
  ] : [];

  return (
    <div className="space-y-4">
      {stats && <StatsCards stats={statsData} />}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            density="compact"
            className="border rounded-lg"
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Seva Category Stats Response Formatter
export const SevaCategoryStatsResponse: React.FC<{
  data: SevaCategoryStats[];
  title?: string;
}> = ({ data, title = "Volunteer Count by Seva Category" }) => {
  const columns: ColumnDef<SevaCategoryStats>[] = [
    {
      accessorKey: 'category_name',
      header: 'Seva Category',
      cell: ({ row }) => {
        const category = row.getValue('category_name') as string;
        const iconConfig = getTaskIconConfig(category);
        return (
          <div className="flex items-center gap-2">
            {iconConfig.icon && <iconConfig.icon className="h-4 w-4" />}
            <span className="font-medium">{category}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'volunteer_count',
      header: 'Volunteers',
      cell: ({ row }) => {
        const count = row.getValue('volunteer_count') as number;
        return (
          <Badge variant="secondary" className="font-mono">
            {count}
          </Badge>
        );
      },
    },
  ];

  const totalVolunteers = data.reduce((sum, item) => sum + item.volunteer_count, 0);
  const sortedData = [...data].sort((a, b) => b.volunteer_count - a.volunteer_count);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVolunteers}</div>
          <p className="text-xs text-muted-foreground">
            Total volunteers across {data.length} seva categories
          </p>
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns}
        data={sortedData}
        density="compact"
        className="border rounded-lg"
      />
    </div>
  );
};

// Check-in Response Formatter
export const CheckInResponse: React.FC<{
  data: CheckInItem[];
  title?: string;
  dateContext?: string;
}> = ({ data, title = "Check-in Information", dateContext }) => {
  const columns: ColumnDef<CheckInItem>[] = [
    {
      accessorKey: 'volunteer_name',
      header: 'Volunteer',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue('volunteer_name')}
        </span>
      ),
    },
    {
      accessorKey: 'check_in_time',
      header: 'Check-in Time',
      cell: ({ row }) => {
        const time = row.getValue('check_in_time') as string;
        return (
          <div className="flex flex-col">
            <span className="font-mono text-sm">
              {new Date(time).toLocaleTimeString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(time).toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <StatusBadgeCell
            value={status}
            type="attendance"
            showLabel={true}
          />
        );
      },
    },
  ];

  const statusCounts = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {title}
            {dateContext && (
              <Badge variant="outline" className="ml-2">
                {dateContext}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.length}</div>
          <p className="text-xs text-muted-foreground">
            Total check-ins
            {dateContext && ` for ${dateContext}`}
          </p>
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns}
        data={data}
        density="compact"
        className="border rounded-lg"
      />
    </div>
  );
};

// Error Response Formatter
export const ErrorResponse: React.FC<{
  message: string;
  suggestions?: string[];
}> = ({ message, suggestions = [] }) => (
  <Card className="border-destructive">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        Error
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm mb-4">{message}</p>
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Try these instead:</p>
          <ul className="text-sm space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-muted-foreground">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);

// Help Response Formatter
export const HelpResponse: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        How can I help you?
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Shirt className="h-4 w-4" />
          T-shirt Inventory
        </h4>
        <ul className="text-sm space-y-1 text-muted-foreground ml-6">
          <li>• "How many large T-shirts are left?"</li>
          <li>• "Show me t-shirt inventory"</li>
          <li>• "What's the stock for M size?"</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Volunteer Statistics
        </h4>
        <ul className="text-sm space-y-1 text-muted-foreground ml-6">
          <li>• "How many volunteers do we have?"</li>
          <li>• "Show volunteer count by seva category"</li>
          <li>• "List volunteers in Registration"</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Check-in Information
        </h4>
        <ul className="text-sm space-y-1 text-muted-foreground ml-6">
          <li>• "How many volunteers checked in today?"</li>
          <li>• "Who checked in yesterday?"</li>
          <li>• "Check-in status for John Smith"</li>
        </ul>
      </div>
    </CardContent>
  </Card>
);