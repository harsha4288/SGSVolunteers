
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, BarChart3, Sparkles } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="flex flex-col space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome to VolunteerVerse!</CardTitle>
          <CardDescription className="text-lg">
            Manage your volunteer data efficiently and gain insights with our powerful tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-4">
            <p>
              Navigate through the sections using the sidebar to view volunteer lists, analyze data,
              and utilize AI-powered tagging for better organization.
            </p>
            <p>
              This platform is designed to be intuitive, responsive, and adaptable to your needs,
              whether on desktop or mobile.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Image
              src="https://picsum.photos/400/300"
              alt="Team collaboration"
              width={400}
              height={300}
              className="rounded-lg shadow-md"
              data-ai-hint="team collaboration"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Volunteers
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Seva Areas
            </CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15+</div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              In the next two weeks
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tags Generated</CardTitle>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">500+</div>
            <p className="text-xs text-muted-foreground">
              Improving categorization
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
