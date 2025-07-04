"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Monitor, Smartphone, Tablet, Award, Settings } from 'lucide-react';

export default function Solution8AssignmentsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/test-solutions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Solutions
            </Button>
          </Link>
          <Badge variant="default" className="bg-yellow-500">
            🥇 #1 Ranked Solution
          </Badge>
          <Badge variant="outline">
            Score: 122/100
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Award className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Solution 8: Adaptive Breakpoint System</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          Assignments Table - Multi-layout system that switches strategies based on content and viewport
        </p>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Content-Aware Switching
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Automatically switches between different layout strategies
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                Multiple Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Combines CSS Grid, Flexbox, and intrinsic sizing approaches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Ultimate Flexibility
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Adapts to any content length and viewport size
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testing Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm mb-2">🧪 Testing Checklist:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Adaptive layout switching
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Perfect content distribution
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Multiple breakpoint handling
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Seamless responsive behavior
            </div>
          </div>
        </div>

        {/* Device Testing */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => window.resizeTo(375, 667)}>
            <Smartphone className="h-3 w-3 mr-1" />
            Mobile (375px)
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.resizeTo(768, 1024)}>
            <Tablet className="h-3 w-3 mr-1" />
            Tablet (768px)
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.resizeTo(1280, 720)}>
            <Monitor className="h-3 w-3 mr-1" />
            Desktop (1280px)
          </Button>
        </div>
      </div>

      {/* Implementation Note */}
      <div className="border rounded-lg bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Solution 8: Adaptive Breakpoint System</h2>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
          <div className="space-y-4">
            <Award className="h-12 w-12 mx-auto text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
              #1 Ranked Solution - Coming Soon
            </h3>
            <p className="text-sm text-amber-600 dark:text-amber-300 max-w-md mx-auto">
              This is the highest-scoring solution with advanced adaptive breakpoint logic. 
              The implementation combines multiple layout strategies for optimal results.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="secondary">Score: 122/100</Badge>
              <Badge variant="secondary">Content-aware switching</Badge>
              <Badge variant="secondary">Multiple strategies</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Implementation available in: datatable_solutions/iteration_8/
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/test-solutions/6/assignments">
          <Button variant="outline">
            🥈 Try Solution 6 (Available)
          </Button>
        </Link>
        <Link href="/test-solutions/comparison">
          <Button variant="outline">
            📊 Compare with Other Solutions
          </Button>
        </Link>
      </div>
    </div>
  );
}