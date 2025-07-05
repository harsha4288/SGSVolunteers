import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  DataTableBadge
} from '@/components/ui/data-table';
import { StatusBadgeCell } from '@/components/ui/data-table/cells/StatusBadgeCell';
// import { StatsCards } from '@/app/app/dashboard/components/shared/stats-cards';
import { getTaskIconConfig } from '@/lib/task-icons';
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
  message?: string;
}> = ({ data, title = "T-Shirt Inventory", message }) => {
  const totalStock = data.reduce((sum, item) => sum + item.quantity_on_hand, 0);

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {message}
        </div>
      )}
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
      
      <DataTable density="compact" className="border rounded-lg">
        <DataTableColGroup>
          <DataTableCol />
          <DataTableCol />
        </DataTableColGroup>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Size</DataTableHead>
            <DataTableHead>Quantity</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {data.map((item, index) => (
            <DataTableRow key={index}>
              <DataTableCell>
                <DataTableBadge variant="outline" className="font-mono">
                  {item.size_cd}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell>
                <StatusBadgeCell
                  value={item.quantity_on_hand}
                  type="inventory"
                  percentage={Math.min(item.quantity_on_hand / 50 * 100, 100)} // Assuming 50 is max stock
                  showLabel={true}
                />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

// Volunteer Statistics Response Formatter
export const VolunteerStatsResponse: React.FC<{
  data: VolunteerStatsItem[];
  stats?: { total: number; gmFamily: number; nonGmFamily: number };
  title?: string;
  message?: string;
  useBulletPoints?: boolean;
}> = ({ data, stats, title = "Volunteer Statistics", message, useBulletPoints = false }) => {
  // Debug logging
  console.log('VolunteerStatsResponse data:', data);
  console.log('VolunteerStatsResponse stats:', stats);
  console.log('Data length:', data?.length);
  console.log('First item:', data?.[0]);
  
  const statsData = stats ? [
    { title: 'Total Volunteers', value: stats.total, icon: Users },
    { title: 'GM Family', value: stats.gmFamily, icon: Users },
    { title: 'Non-GM Family', value: stats.nonGmFamily, icon: Users },
  ] : [];

  // Simple bullet point fallback
  const BulletPointList = () => (
    <div className="space-y-2">
      <h4 className="font-medium">Volunteer List:</h4>
      <ul className="space-y-1">
        {data.map((volunteer, index) => (
          <li key={volunteer.id || index} className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {volunteer.first_name} {volunteer.last_name}
            </span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {volunteer.seva_category || 'N/A'}
              </Badge>
              <Badge variant={volunteer.gm_family ? "default" : "outline"} className="text-xs">
                {volunteer.gm_family ? 'GM' : 'Non-GM'}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {message}
        </div>
      )}
      {stats && <StatsCards stats={statsData} />}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {useBulletPoints || !data || data.length === 0 ? (
            <BulletPointList />
          ) : (
            <DataTable density="compact" className="border rounded-lg">
              <DataTableColGroup>
                <DataTableCol />
                <DataTableCol />
                <DataTableCol />
              </DataTableColGroup>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Name</DataTableHead>
                  <DataTableHead>Seva Category</DataTableHead>
                  <DataTableHead>GM Family</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {data.map((volunteer, index) => (
                  <DataTableRow key={volunteer.id || index}>
                    <DataTableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {volunteer.first_name} {volunteer.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {volunteer.email}
                        </span>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      {volunteer.seva_category ? (
                        <DataTableBadge variant="outline" className="flex items-center gap-1">
                          {(() => {
                            const iconConfig = getTaskIconConfig(volunteer.seva_category);
                            return iconConfig.icon && <iconConfig.icon className="h-3 w-3" />;
                          })()}
                          {volunteer.seva_category}
                        </DataTableBadge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <DataTableBadge variant={volunteer.gm_family ? "default" : "outline"}>
                        {volunteer.gm_family ? 'Yes' : 'No'}
                      </DataTableBadge>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Seva Category Stats Response Formatter
export const SevaCategoryStatsResponse: React.FC<{
  data: SevaCategoryStats[];
  title?: string;
  message?: string;
}> = ({ data, title = "Volunteer Count by Seva Category", message }) => {
  const totalVolunteers = data.reduce((sum, item) => sum + item.volunteer_count, 0);
  const sortedData = [...data].sort((a, b) => b.volunteer_count - a.volunteer_count);

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {message}
        </div>
      )}
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
      
      <DataTable density="compact" className="border rounded-lg">
        <DataTableColGroup>
          <DataTableCol />
          <DataTableCol />
        </DataTableColGroup>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Seva Category</DataTableHead>
            <DataTableHead>Volunteers</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {sortedData.map((item, index) => (
            <DataTableRow key={index}>
              <DataTableCell>
                <div className="flex items-center gap-2">
                  {(() => {
                    const iconConfig = getTaskIconConfig(item.category_name);
                    return iconConfig.icon && <iconConfig.icon className="h-4 w-4" />;
                  })()}
                  <span className="font-medium">{item.category_name}</span>
                </div>
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge variant="secondary" className="font-mono">
                  {item.volunteer_count}
                </DataTableBadge>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

// Check-in Response Formatter
export const CheckInResponse: React.FC<{
  data: CheckInItem[];
  title?: string;
  dateContext?: string;
  message?: string;
}> = ({ data, title = "Check-in Information", dateContext, message }) => {
  const statusCounts = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {message}
        </div>
      )}
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
      
      <DataTable density="compact" className="border rounded-lg">
        <DataTableColGroup>
          <DataTableCol />
          <DataTableCol />
          <DataTableCol />
        </DataTableColGroup>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Volunteer</DataTableHead>
            <DataTableHead>Check-in Time</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {data.map((item, index) => (
            <DataTableRow key={item.id || index}>
              <DataTableCell>
                <span className="font-medium">{item.volunteer_name}</span>
              </DataTableCell>
              <DataTableCell>
                <div className="flex flex-col">
                  <span className="font-mono text-sm">
                    {new Date(item.check_in_time).toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.check_in_time).toLocaleDateString()}
                  </span>
                </div>
              </DataTableCell>
              <DataTableCell>
                <StatusBadgeCell
                  value={item.status}
                  type="attendance"
                  showLabel={true}
                />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
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