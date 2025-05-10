
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
  title: "Volunteer Check-in System",
  description: "Team leader portal to mark volunteer attendance.",
};

// Mock data for demonstration
const mockVolunteersForCheckin = [
  { id: "vol1", name: "John Doe", scheduledShift: "Morning Shift (9 AM - 1 PM)", task: "Registration" },
  { id: "vol2", name: "Jane Smith", scheduledShift: "Afternoon Shift (1 PM - 5 PM)", task: "Ushering" },
  { id: "vol3", name: "Alice Brown", scheduledShift: "Morning Shift (9 AM - 1 PM)", task: "Info Desk" },
  { id: "vol4", name: "Bob Green", scheduledShift: "Full Day (9 AM - 5 PM)", task: "Logistics" },
  { id: "vol5", name: "Charlie White", scheduledShift: "Evening Prep (5 PM - 7 PM)", task: "Setup Crew" },
];

export default function CheckInPage() {
  // In a real app, this state would be managed with API calls to Supabase
  const [checkedInVolunteers, setCheckedInVolunteers] = React.useState<Record<string, boolean>>({});

  const handleCheckInToggle = (volunteerId: string) => {
    setCheckedInVolunteers(prev => ({
      ...prev,
      [volunteerId]: !prev[volunteerId],
    }));
    // Here, you would make an API call to update the check-in status in Supabase
    console.log(`Volunteer ${volunteerId} check-in status toggled to: ${!checkedInVolunteers[volunteerId]}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ClipboardCheck className="mr-2 h-6 w-6 text-accent" />
            Volunteer Check-in
          </CardTitle>
          <CardDescription>
            Team leaders: Please mark attendance for volunteers in your team. This system assumes Wi-Fi connectivity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-medium mb-2 flex items-center"><Users className="mr-2 h-5 w-5"/>Your Team Members</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This list shows volunteers scheduled for today under your supervision.
            </p>
            <p className="text-sm text-muted-foreground">
              Select the checkbox next to a volunteer's name to mark them as checked-in.
            </p>
          </div>
          
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {mockVolunteersForCheckin.length > 0 ? (
                mockVolunteersForCheckin.map(volunteer => (
                  <div key={volunteer.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{volunteer.name}</p>
                      <p className="text-sm text-muted-foreground">Task: {volunteer.task}</p>
                      <p className="text-xs text-muted-foreground">Scheduled: {volunteer.scheduledShift}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`checkin-${volunteer.id}`}
                        checked={!!checkedInVolunteers[volunteer.id]}
                        onCheckedChange={() => handleCheckInToggle(volunteer.id)}
                        aria-label={`Mark ${volunteer.name} as checked in`}
                      />
                      <Label htmlFor={`checkin-${volunteer.id}`} className="cursor-pointer">
                        {checkedInVolunteers[volunteer.id] ? "Checked In" : "Check In"}
                      </Label>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center">No volunteers scheduled for your team at this time, or data is loading.</p>
              )}
            </div>
          </ScrollArea>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => alert("Submitting all check-ins... (Simulated)")}>
              Submit All Check-ins
            </Button>
          </div>
           <p className="text-xs text-muted-foreground mt-4">
              Note: Actual check-ins will be tracked against submitted availability.
              This data will be crucial for post-event analysis and future planning.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
